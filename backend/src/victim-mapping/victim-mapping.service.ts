import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { LoggerService } from 'src/common/logger/logger.service';

export interface VictimRelationship {
  victim_id: string;
  victim_name: string;
  victim_phone: string;
  total_amount_lost: number;
  safety_status: string;
  harassment_severity: string;
  connected_suspects: Array<{
    suspect_id: string;
    suspect_name: string;
    suspect_phone: string;
    risk_score: number;
    network_role: string;
  }>;
  call_count: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ConvergencePoint {
  victim_id: string;
  victim_name: string;
  convergence_lat: number;
  convergence_lon: number;
  unique_callers: number;
  caller_names: string[];
  total_interactions: number;
  zone_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface HarassmentPattern {
  caller_id: string;
  caller_name: string;
  caller_phone: string;
  victim_id: string;
  victim_name: string;
  victim_phone: string;
  harassment_type: string;
  evidence_count: number;
  harassment_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommended_action: string;
}

export interface TrajectoryPoint {
  call_id: string;
  timestamp: string;
  position: {
    latitude: number;
    longitude: number;
    tower_id: string;
  };
  tower_location: string;
  receiver_phone: string;
  duration_seconds: number;
}

@Injectable()
export class VictimMappingService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get all victim relationships from Victim nodes via HAS_VICTIM
   */
  async getVictimMappingGraph(
    investigationId: string,
  ): Promise<VictimRelationship[]> {
    this.logger.log(
      `Fetching victim mapping for ${investigationId}`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:HAS_VICTIM]->(v:Victim)
      
      // Parse callingSuspects and find matching suspects
      WITH i, v, 
           CASE 
             WHEN v.callingSuspects IS NOT NULL AND v.callingSuspects <> 'NONE' 
             THEN split(v.callingSuspects, ' | ')
             ELSE []
           END AS suspectIds
      
      // Match suspects that called this victim
      OPTIONAL MATCH (i)-[:CONTAINS]->(s:Suspect)
      WHERE s.id IN suspectIds OR s.phone = v.phone
      
      // Also check for calls where suspect called victim's phone
      OPTIONAL MATCH (s)-[call:CALLED]->(target:Suspect {phone: v.phone})
      
      WITH v, 
           collect(DISTINCT {
             suspect_id: s.id,
             suspect_name: s.name,
             suspect_phone: s.phone,
             risk_score: s.riskScore,
             network_role: s.networkRole
           }) AS connected_suspects,
           sum(COALESCE(call.callCount, 0)) AS total_calls
      
      RETURN {
        victim_id: v.victimId,
        victim_name: v.name,
        victim_phone: v.phone,
        total_amount_lost: v.totalAmountLost,
        safety_status: v.safetyStatus,
        harassment_severity: v.harassmentSeverity,
        connected_suspects: [cs IN connected_suspects WHERE cs.suspect_id IS NOT NULL],
        call_count: total_calls,
        risk_level: CASE
          WHEN v.harassmentSeverity = 'CRITICAL' OR v.safetyStatus = 'THREATENED' THEN 'CRITICAL'
          WHEN v.harassmentSeverity = 'HIGH' OR v.totalAmountLost > 500000 THEN 'HIGH'
          WHEN v.harassmentSeverity = 'MEDIUM' OR v.totalAmountLost > 100000 THEN 'MEDIUM'
          ELSE 'LOW'
        END
      } AS relationship
      
      ORDER BY v.totalAmountLost DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const relationships = records.map(
        (r) => r.get('relationship') as VictimRelationship,
      );
      this.logger.success(
        `Found ${relationships.length} victim relationships`,
        'VictimMappingService',
      );
      return relationships;
    } catch (error) {
      this.logger.error(
        `Failed to get victim mapping: ${error}`,
        undefined,
        'VictimMappingService',
      );
      throw error;
    }
  }

  /**
   * Find convergence points using CDR tower data
   */
  async findConvergencePoints(
    investigationId: string,
  ): Promise<ConvergencePoint[]> {
    this.logger.log(
      `Finding convergence points for ${investigationId}`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:HAS_VICTIM]->(v:Victim)
      MATCH (i)-[:CONTAINS]->(s1:Suspect)-[cdr1:CDR_CALL]->(target1:Suspect {phone: v.phone})
      MATCH (i)-[:CONTAINS]->(s2:Suspect)-[cdr2:CDR_CALL]->(target2:Suspect {phone: v.phone})
      WHERE s1.id < s2.id
      AND cdr1.callerTowerId = cdr2.callerTowerId
      
      // Get tower coordinates
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(tower:CellTower {towerId: cdr1.callerTowerId})
      
      WITH v, tower,
           collect(DISTINCT s1.name) + collect(DISTINCT s2.name) AS callers,
           count(*) AS interaction_count
      
      WHERE tower IS NOT NULL
      
      RETURN {
        victim_id: v.victimId,
        victim_name: v.name,
        convergence_lat: tower.latitude,
        convergence_lon: tower.longitude,
        unique_callers: size(callers),
        caller_names: callers,
        total_interactions: interaction_count,
        zone_severity: CASE
          WHEN interaction_count > 50 THEN 'CRITICAL'
          WHEN interaction_count > 20 THEN 'HIGH'
          WHEN interaction_count > 10 THEN 'MEDIUM'
          ELSE 'LOW'
        END
      } AS convergence
      
      ORDER BY interaction_count DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const points = records.map(
        (r) => r.get('convergence') as ConvergencePoint,
      );
      this.logger.success(
        `Found ${points.length} convergence points`,
        'VictimMappingService',
      );
      return points;
    } catch (error) {
      this.logger.error(
        `Failed to find convergence points: ${error}`,
        undefined,
        'VictimMappingService',
      );
      throw error;
    }
  }

  /**
   * Detect harassment patterns using Victim nodes and call data
   */
  async detectHarassmentPatterns(
    investigationId: string,
  ): Promise<HarassmentPattern[]> {
    this.logger.log(
      `Detecting harassment patterns for ${investigationId}`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:HAS_VICTIM]->(v:Victim)
      MATCH (i)-[:CONTAINS]->(caller:Suspect)-[call:CALLED]->(target:Suspect)
      WHERE target.phone = v.phone AND call.callCount > 3
      
      RETURN {
        caller_id: caller.id,
        caller_name: caller.name,
        caller_phone: caller.phone,
        victim_id: v.victimId,
        victim_name: v.name,
        victim_phone: v.phone,
        harassment_type: CASE
          WHEN call.proximityPattern = 'NEAR' THEN 'PROXIMITY_HARASSMENT'
          WHEN call.callCount > 20 THEN 'PERSISTENT_HARASSMENT'
          ELSE 'REPEATED_CONTACT'
        END,
        evidence_count: call.callCount,
        harassment_severity: CASE
          WHEN call.callCount > 30 THEN 'CRITICAL'
          WHEN call.callCount > 15 THEN 'HIGH'
          WHEN call.callCount > 8 THEN 'MEDIUM'
          ELSE 'LOW'
        END,
        recommended_action: CASE
          WHEN call.callCount > 30 THEN 'IMMEDIATE_ARREST'
          WHEN call.callCount > 15 THEN 'URGENT_INVESTIGATION'
          WHEN call.callCount > 8 THEN 'HEIGHTENED_SURVEILLANCE'
          ELSE 'MONITOR'
        END
      } AS pattern
      
      ORDER BY call.callCount DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const patterns = records.map(
        (r) => r.get('pattern') as HarassmentPattern,
      );
      this.logger.success(
        `Found ${patterns.length} harassment patterns`,
        'VictimMappingService',
      );
      return patterns;
    } catch (error) {
      this.logger.error(
        `Failed to detect patterns: ${error}`,
        undefined,
        'VictimMappingService',
      );
      throw error;
    }
  }

  /**
   * Track movement trajectory using CDR data with tower coordinates
   */
  async trackMovementTrajectory(
    investigationId: string,
    suspectId: string,
  ): Promise<TrajectoryPoint[]> {
    this.logger.log(
      `Tracking trajectory for ${suspectId}`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})-[cdr:CDR_CALL]->(receiver)
      
      // Get tower coordinates
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(tower:CellTower {towerId: cdr.callerTowerId})
      
      RETURN {
        call_id: cdr.callId,
        timestamp: cdr.callStartTime,
        position: {
          latitude: tower.latitude,
          longitude: tower.longitude,
          tower_id: cdr.callerTowerId
        },
        tower_location: tower.towerLocation,
        receiver_phone: receiver.phone,
        duration_seconds: cdr.duration
      } AS trajectory
      
      ORDER BY cdr.callStartTime ASC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        suspectId,
      });
      const points = records.map((r) => r.get('trajectory') as TrajectoryPoint);
      this.logger.success(
        `Found ${points.length} trajectory points`,
        'VictimMappingService',
      );
      return points;
    } catch (error) {
      this.logger.error(
        `Failed to track trajectory: ${error}`,
        undefined,
        'VictimMappingService',
      );
      throw error;
    }
  }

  /**
   * Find collaborative calls (multiple suspects calling same victim)
   */
  async findCollaborativeCalls(investigationId: string) {
    this.logger.log(
      `Finding collaborative calls for ${investigationId}`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:HAS_VICTIM]->(v:Victim)
      MATCH (i)-[:CONTAINS]->(c1:Suspect)-[call1:CALLED]->(target:Suspect {phone: v.phone})
      MATCH (i)-[:CONTAINS]->(c2:Suspect)-[call2:CALLED]->(target)
      WHERE c1.id < c2.id
      AND call1.callDate = call2.callDate
      
      RETURN {
        victim_id: v.victimId,
        victim_name: v.name,
        caller1_id: c1.id,
        caller1_name: c1.name,
        caller1_phone: c1.phone,
        caller2_id: c2.id,
        caller2_name: c2.name,
        caller2_phone: c2.phone,
        call_date: call1.callDate,
        collaboration_type: 'COORDINATED_HARASSMENT',
        severity: 'HIGH'
      } AS collaboration
      
      ORDER BY call1.callDate DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const collaborations = records.map((r) => r.get('collaboration'));
      this.logger.success(
        `Found ${collaborations.length} collaborative calls`,
        'VictimMappingService',
      );
      return collaborations;
    } catch (error) {
      this.logger.error(
        `Failed to find collaborative calls: ${error}`,
        undefined,
        'VictimMappingService',
      );
      throw error;
    }
  }
}
