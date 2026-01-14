import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';

export interface VictimRelationship {
  caller_id: string;
  caller_name: string;
  caller_phone: string;
  victim_id: string;
  victim_name: string;
  victim_phone: string;
  call_count: number;
  total_duration: number;
  pattern_type: 'FREQUENT' | 'REGULAR' | 'OCCASIONAL' | 'SPORADIC';
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  proximity_calls_count: number;
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
    accuracy_m: number;
  };
  tower_id: string;
  tower_location: string;
  receiver_phone: string;
  duration_seconds: number;
}

@Injectable()
export class VictimMappingService {
  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * Get all victim relationships with geolocation data
   */
  async getVictimMappingGraph(
    investigationId: string,
  ): Promise<VictimRelationship[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(caller:Suspect)-[call:CALLED]->(victim:Suspect)
      
      RETURN {
        caller_id: caller.id,
        caller_name: caller.name,
        caller_phone: caller.phone,
        victim_id: victim.id,
        victim_name: victim.name,
        victim_phone: victim.phone,
        call_count: call.callCount,
        total_duration: call.duration,
        pattern_type: CASE 
          WHEN call.callCount > 20 THEN 'FREQUENT'
          WHEN call.callCount > 10 THEN 'REGULAR'
          WHEN call.callCount > 5 THEN 'OCCASIONAL'
          ELSE 'SPORADIC'
        END,
        risk_level: CASE
          WHEN call.callCount > 20 AND call.proximityPattern = 'NEAR' THEN 'CRITICAL'
          WHEN call.callCount > 10 AND call.proximityPattern = 'NEAR' THEN 'HIGH'
          WHEN call.callCount > 5 THEN 'MEDIUM'
          ELSE 'LOW'
        END,
        proximity_calls_count: COALESCE(call.proximityCallsCount, 0)
      } AS relationship
      
      ORDER BY call.callCount DESC
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('relationship') as VictimRelationship);
  }

  /**
   * Find convergence points where multiple callers interact with victim
   */
  async findConvergencePoints(
    investigationId: string,
  ): Promise<ConvergencePoint[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(c1:Suspect)-[call1:CALLED]->(victim:Suspect)
      MATCH (i)-[:CONTAINS]->(c2:Suspect)-[call2:CALLED]->(victim)
      WHERE c1.id < c2.id
      AND call1.triangulationLat IS NOT NULL 
      AND call2.triangulationLat IS NOT NULL
      AND abs(call1.triangulationLat - call2.triangulationLat) < 0.05
      AND abs(call1.triangulationLon - call2.triangulationLon) < 0.05
      
      WITH victim,
           (call1.triangulationLat + call2.triangulationLat) / 2 as convergence_lat,
           (call1.triangulationLon + call2.triangulationLon) / 2 as convergence_lon,
           collect(DISTINCT c1.name) + collect(DISTINCT c2.name) as callers,
           count(*) as interaction_count
      
      RETURN {
        victim_id: victim.id,
        victim_name: victim.name,
        convergence_lat: convergence_lat,
        convergence_lon: convergence_lon,
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

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('convergence') as ConvergencePoint);
  }

  /**
   * Detect harassment patterns based on proximity and frequency
   */
  async detectHarassmentPatterns(
    investigationId: string,
  ): Promise<HarassmentPattern[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(caller:Suspect)-[call:CALLED]->(victim:Suspect)
      WHERE call.proximityPattern = 'NEAR' AND call.callCount > 3
      
      RETURN {
        caller_id: caller.id,
        caller_name: caller.name,
        caller_phone: caller.phone,
        victim_id: victim.id,
        victim_name: victim.name,
        victim_phone: victim.phone,
        harassment_type: 'PROXIMITY_HARASSMENT',
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

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('pattern') as HarassmentPattern);
  }

  /**
   * Track movement trajectory of a suspect
   */
  async trackMovementTrajectory(
    investigationId: string,
    suspectId: string,
  ): Promise<TrajectoryPoint[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})-[call:CALLED]->()
      WHERE call.triangulationLat IS NOT NULL
      
      RETURN {
        call_id: call.callId,
        timestamp: call.callStartTime,
        position: {
          latitude: call.triangulationLat,
          longitude: call.triangulationLon,
          accuracy_m: call.triangulationAccuracy
        },
        tower_id: call.callerTowerId,
        tower_location: call.callerTowerLocation,
        receiver_phone: call.receiverPhone,
        duration_seconds: call.duration
      } AS trajectory
      
      ORDER BY call.callStartTime ASC
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
      suspectId,
    });
    return records.map((r) => r.get('trajectory') as TrajectoryPoint);
  }

  /**
   * Find collaborative calls (multiple suspects calling same victim)
   */
  async findCollaborativeCalls(investigationId: string) {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(c1:Suspect)-[call1:CALLED]->(v:Suspect)
      MATCH (i)-[:CONTAINS]->(c2:Suspect)-[call2:CALLED]->(v)
      WHERE c1.id < c2.id
      AND call1.callDate = call2.callDate
      
      RETURN {
        victim_id: v.id,
        victim_name: v.name,
        caller1_name: c1.name,
        caller1_phone: c1.phone,
        caller2_name: c2.name,
        caller2_phone: c2.phone,
        call_date: call1.callDate,
        collaboration_type: 'COORDINATED_HARASSMENT',
        severity: 'HIGH'
      } AS collaboration
      
      ORDER BY call1.callDate DESC
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('collaboration'));
  }
}
