import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { Integer } from 'neo4j-driver';

import { SupabaseService } from 'src/supabase/supabase.service';

/**
 * Helper to convert Neo4j Integer objects to regular JavaScript numbers
 * Neo4j returns large integers as {low, high} objects
 */
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (Integer.isInteger(value)) return value.toNumber();
  if (typeof value === 'object' && 'low' in value && 'high' in value) {
    return Integer.fromValue(value).toNumber();
  }
  return Number(value) || 0;
}

/**
 * Helper to recursively convert all Neo4j Integers in an object
 */
function convertNeo4jIntegers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Integer.isInteger(obj)) return obj.toNumber();
  if (typeof obj === 'object' && 'low' in obj && 'high' in obj) {
    return Integer.fromValue(obj).toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertNeo4jIntegers);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertNeo4jIntegers(obj[key]);
    }
    return result;
  }
  return obj;
}

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
    private readonly supabaseService: SupabaseService,
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
      
      // Find suspects from metadata
      WITH i, v, 
           CASE 
             WHEN v.callingSuspects IS NOT NULL AND v.callingSuspects <> 'NONE' 
             THEN split(v.callingSuspects, ' | ')
             ELSE []
           END AS suspectIds
      
      // Match suspects via relationships (CDR_CALL, CALLED, etc.) to victim's suspect node
      OPTIONAL MATCH (i)-[:CONTAINS]->(vs:Suspect {phone: v.phone})
      OPTIONAL MATCH (s_rel:Suspect)-[r:CDR_CALL|CALLED|TRANSACTION]-(vs)
      WHERE (i)-[:CONTAINS]->(s_rel) AND s_rel.isVictim IS NULL AND s_rel.status <> 'VICTIM'
      
      // Match suspects explicitly listed in metadata
      OPTIONAL MATCH (i)-[:CONTAINS]->(s_meta:Suspect)
      WHERE s_meta.id IN suspectIds AND s_meta.isVictim IS NULL AND s_meta.status <> 'VICTIM'

      // Match suspects via Geospatial proximity (Same Tower)
      // We look for suspects who have CDR relationship at the same tower as the victim's calls
      OPTIONAL MATCH (vs)-[r_v:CDR_CALL]->()
      WITH i, v, vs, r_v, s_rel, s_meta, r
      OPTIONAL MATCH (i)-[:CONTAINS]->(s_geo:Suspect)-[r_s:CDR_CALL]->()
      WHERE r_s.callerTowerId = r_v.callerTowerId 
        AND s_geo.id <> vs.id 
        AND s_geo.isVictim IS NULL 
        AND s_geo.status <> 'VICTIM'
      
      WITH v, 
           collect(DISTINCT s_rel) AS rel_suspects,
           collect(DISTINCT s_meta) AS meta_suspects,
           collect(DISTINCT s_geo) AS geo_suspects,
           count(DISTINCT r) + count(DISTINCT r_v) AS total_interactions
      
      WITH v, total_interactions,
           [s IN (rel_suspects + meta_suspects + geo_suspects) WHERE s IS NOT NULL] AS all_connected
      
      RETURN {
        victim_id: v.victimId,
        victim_name: v.name,
        victim_phone: v.phone,
        total_amount_lost: v.totalAmountLost,
        safety_status: v.safetyStatus,
        harassment_severity: v.harassmentSeverity,
        connected_suspects: [s IN all_connected | {
          suspect_id: s.id,
          suspect_name: s.name,
          suspect_phone: s.phone,
          risk_score: s.riskScore,
          network_role: s.networkRole
        }],
        call_count: total_interactions,
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
        (r) =>
          convertNeo4jIntegers(r.get('relationship')) as VictimRelationship,
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
      `Finding convergence points for ${investigationId} (Hybrid)`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:HAS_VICTIM]->(v:Victim)
      MATCH (i)-[:CONTAINS]->(s1:Suspect)-[cdr1:CDR_CALL]->(target1:Suspect {phone: v.phone})
      MATCH (i)-[:CONTAINS]->(s2:Suspect)-[cdr2:CDR_CALL]->(target2:Suspect {phone: v.phone})
      WHERE s1.id < s2.id
      AND cdr1.callerTowerId = cdr2.callerTowerId
      
      WITH v, cdr1.callerTowerId AS tower_id,
           collect(DISTINCT s1.name) + collect(DISTINCT s2.name) AS callers,
           count(*) AS interaction_count
      
      RETURN {
        victim_id: v.victimId,
        victim_name: v.name,
        tower_id: tower_id,
        unique_callers: size(callers),
        caller_names: callers,
        total_interactions: interaction_count
      } AS raw_convergence
      ORDER BY interaction_count DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });

      const rawConvergence = records.map((r) =>
        convertNeo4jIntegers(r.get('raw_convergence')),
      );
      if (rawConvergence.length === 0) return [];

      // Fetch tower coordinates from Supabase
      const towerIds = [
        ...new Set(rawConvergence.map((c) => c.tower_id).filter(Boolean)),
      ];
      const towers = await this.supabaseService.getTowersByIds(towerIds);
      const towerMap = new Map(towers.map((t) => [t.cell_id, t]));

      const points: ConvergencePoint[] = rawConvergence
        .map((c) => {
          const towerData = towerMap.get(c.tower_id);
          if (!towerData) return null;

          return {
            victim_id: c.victim_id,
            victim_name: c.victim_name,
            convergence_lat: towerData.lat,
            convergence_lon: towerData.lon,
            unique_callers: c.unique_callers,
            caller_names: c.caller_names,
            total_interactions: c.total_interactions,
            zone_severity:
              c.total_interactions > 50
                ? 'CRITICAL'
                : c.total_interactions > 20
                  ? 'HIGH'
                  : c.total_interactions > 10
                    ? 'MEDIUM'
                    : 'LOW',
          };
        })
        .filter(Boolean) as ConvergencePoint[];

      this.logger.success(
        `Found ${points.length} convergence points via Supabase coordinates`,
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
      MATCH (i:Investigation {id: $invId})
      
      // Part A: Call-based patterns
      MATCH (i)-[:HAS_VICTIM]->(v:Victim)
      MATCH (i)-[:CONTAINS]->(caller:Suspect)-[call:CALLED]->(target:Suspect)
      WHERE target.phone = v.phone AND call.callCount > 3
      
      WITH i, v, caller, call, [] AS event_patterns
      
      // Part B: Spatial patterns (Trespassing)
      OPTIONAL MATCH (i)-[:CONTAINS]->(stalker:Suspect)-[:PINGED]->(event:Event:TRESPASSED)
      
      WITH v, caller, call, stalker, count(event) AS trespass_count
      
      // Create unified pattern list
      WITH 
        // Existing call patterns
        [{
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
        }] + 
        // Spatial patterns
        CASE 
          WHEN stalker IS NOT NULL AND trespass_count > 0 THEN [{
            caller_id: stalker.id,
            caller_name: stalker.name,
            caller_phone: stalker.phone,
            victim_id: 'GLOBAL', 
            victim_name: 'Restricted Zone',
            victim_phone: 'N/A',
            harassment_type: 'SPATIAL_STALKING',
            evidence_count: trespass_count,
            harassment_severity: CASE WHEN trespass_count > 5 THEN 'CRITICAL' ELSE 'HIGH' END,
            recommended_action: 'INTERCEPT_IMMEDIATELY'
          }]
          ELSE []
        END AS all_patterns
      
      UNWIND all_patterns AS pattern
      RETURN pattern
      ORDER BY pattern.evidence_count DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const patterns = records.map(
        (r) => convertNeo4jIntegers(r.get('pattern')) as HarassmentPattern,
      );
      this.logger.success(
        `Found ${patterns.length} harassment patterns (including spatial)`,
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
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})
      
      // Get historical trajectory points from properties
      WITH i, s,
           CASE 
             WHEN s.trajectoryHistory IS NOT NULL 
             THEN split(s.trajectoryHistory, '|') 
             ELSE [] 
           END AS historical_points
      
      UNWIND (CASE WHEN size(historical_points) > 0 THEN historical_points ELSE [null] END) AS hpStr
      WITH i, s, hpStr
      
      // Get historical CDR points
      OPTIONAL MATCH (s)-[cdr:CDR_CALL]->(receiver)
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(tower:CellTower {towerId: cdr.callerTowerId})
      
      // Get real-time Event points
      OPTIONAL MATCH (s)-[:PINGED]->(event:Event)
      
      WITH i, s, cdr, tower, receiver, event, hpStr
      
      // Parse historical point string
      WITH i, s, cdr, tower, receiver, event, hpStr,
           CASE 
             WHEN hpStr IS NOT NULL THEN split(hpStr, ',')
             ELSE []
           END AS hpCoords
           
      // Create unified points
      WITH 
        CASE 
          WHEN event IS NOT NULL THEN {
            call_id: 'event-' + toString(id(event)),
            timestamp: toString(event.timestamp),
            position: {
              latitude: event.location.latitude,
              longitude: event.location.longitude,
              tower_id: event.cell_tower_id
            },
            tower_location: 'GPS Signal (' + COALESCE(event.cell_tower_id, 'No Tower') + ')',
            receiver_phone: 'N/A (Spatial Event)',
            duration_seconds: 0,
            type: 'EVENT'
          }
          WHEN cdr IS NOT NULL AND tower IS NOT NULL THEN {
            call_id: cdr.callId,
            timestamp: cdr.callStartTime,
            position: {
              latitude: tower.latitude,
              longitude: tower.longitude,
              tower_id: cdr.callerTowerId
            },
            tower_location: tower.towerLocation,
            receiver_phone: receiver.phone,
            duration_seconds: cdr.duration,
            type: 'CDR'
          }
          WHEN size(hpCoords) = 2 THEN {
            call_id: 'hist-' + toString(id(s)) + '-' + hpStr,
            timestamp: '0000-00-00T00:00:00.000Z', // Baseline for ordering if no actual time exists
            position: {
              latitude: toFloat(hpCoords[0]),
              longitude: toFloat(hpCoords[1]),
              tower_id: null
            },
            tower_location: 'Historical Coordinate',
            receiver_phone: 'N/A',
            duration_seconds: 0,
            type: 'HISTORY'
          }
          ELSE NULL
        END AS p
      
      WHERE p IS NOT NULL
      
      RETURN DISTINCT p AS trajectory
      ORDER BY p.type DESC, p.timestamp ASC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        suspectId,
      });

      // Debug logging
      this.logger.log(
        `Raw query returned ${records.length} records`,
        'VictimMappingService',
      );

      const rawPoints = records
        .map((r) => convertNeo4jIntegers(r.get('trajectory')))
        .filter(Boolean);

      this.logger.log(
        `Filtered to ${rawPoints.length} valid trajectory points`,
        'VictimMappingService',
      );

      if (rawPoints.length === 0) {
        // Additional diagnostic query to see what's available
        const diagnosticQuery = `
          MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})
          OPTIONAL MATCH (s)-[cdr:CDR_CALL]->()
          OPTIONAL MATCH (i)-[:HAS_TOWER]->(t:CellTower)
          RETURN 
            count(DISTINCT cdr) as cdrCount,
            count(DISTINCT t) as towerCount,
            collect(DISTINCT cdr.callerTowerId)[0..5] as sampleTowerIds,
            collect(DISTINCT t.towerId)[0..5] as availableTowerIds
        `;

        const diagnostic = await this.neo4jService.readCypher(diagnosticQuery, {
          invId: investigationId,
          suspectId,
        });

        if (diagnostic.length > 0) {
          const diag = convertNeo4jIntegers(diagnostic[0].toObject());
          this.logger.warn(
            `Trajectory empty but found: ${diag.cdrCount} CDR records, ${diag.towerCount} towers. ` +
              `Sample CDR tower IDs: ${JSON.stringify(diag.sampleTowerIds)}, ` +
              `Available tower IDs: ${JSON.stringify(diag.availableTowerIds)}`,
            'VictimMappingService',
          );
        }

        return [];
      }

      const towerIds = [
        ...new Set(rawPoints.map((p) => p.position.tower_id).filter(Boolean)),
      ];
      const towers = await this.supabaseService.getTowersByIds(towerIds);
      const towerMap = new Map(towers.map((t) => [t.cell_id, t]));

      const trajectory: TrajectoryPoint[] = rawPoints
        .map((p) => {
          const towerData = towerMap.get(p.position.tower_id);
          if (!towerData && p.type === 'CDR') return null;

          return {
            call_id: p.call_id,
            timestamp: p.timestamp,
            position: {
              latitude: towerData?.lat || p.position.latitude,
              longitude: towerData?.lon || p.position.longitude,
              tower_id: p.position.tower_id,
            },
            range_km: towerData?.range_km || 2, // Default 2km if unknown
            tower_location: towerData?.name || p.tower_location,
            receiver_phone: p.receiver_phone,
            duration_seconds: p.duration_seconds,
          };
        })
        .filter(Boolean) as TrajectoryPoint[];

      return trajectory;
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

  /**
   * Get suspects who called or contacted a specific victim
   * Returns suspects from suspects_enhanced.csv that have relationships with the victim
   */
  async getSuspectsForVictim(
    investigationId: string,
    victimPhone: string,
  ): Promise<
    Array<{
      suspect_id: string;
      suspect_name: string;
      suspect_phone: string;
      connection_type: string;
      interaction_count: number;
      risk_level: string;
    }>
  > {
    this.logger.log(
      `Finding suspects for victim ${victimPhone} in investigation ${investigationId}`,
      'VictimMappingService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(victim:Suspect {phone: $victimPhone})
      WHERE victim.isVictim = true OR victim.status = 'VICTIM'
      
      // Find suspects who called the victim via CDR
      OPTIONAL MATCH (i)-[:CONTAINS]->(suspect_cdr:Suspect)-[cdr:CDR_CALL]->(victim)
      WHERE suspect_cdr.isVictim IS NULL 
        AND suspect_cdr.status <> 'VICTIM'
        AND suspect_cdr.phone <> $victimPhone
      
      // Find suspects connected via transactions
      OPTIONAL MATCH (i)-[:CONTAINS]->(suspect_tx:Suspect)-[tx:TRANSACTION]-(victim)
      WHERE suspect_tx.isVictim IS NULL 
        AND suspect_tx.status <> 'VICTIM'
        AND suspect_tx.phone <> $victimPhone
      
      // Collect all unique suspects with their connection info
      WITH suspect_cdr, suspect_tx
      WHERE suspect_cdr IS NOT NULL OR suspect_tx IS NOT NULL
      
      WITH COALESCE(suspect_cdr, suspect_tx) AS suspect,
           CASE 
             WHEN suspect_cdr IS NOT NULL THEN 'CDR_CALL'
             WHEN suspect_tx IS NOT NULL THEN 'TRANSACTION'
             ELSE 'UNKNOWN'
           END AS connection_type
      
      // Get interaction count for each suspect
      WITH suspect, connection_type, count(*) as interactions
      
      RETURN DISTINCT {
        suspect_id: suspect.id,
        suspect_name: suspect.name,
        suspect_phone: suspect.phone,
        connection_type: connection_type,
        interaction_count: interactions,
        risk_level: COALESCE(suspect.risk, suspect.riskLevel, 'UNKNOWN')
      } AS suspect_data
      ORDER BY suspect_data.interaction_count DESC, suspect_data.suspect_name
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        victimPhone,
      });

      const suspects = records.map((r) =>
        convertNeo4jIntegers(r.get('suspect_data')),
      );

      this.logger.success(
        `Found ${suspects.length} suspects connected to victim ${victimPhone}`,
        'VictimMappingService',
      );

      return suspects;
    } catch (error) {
      this.logger.error(
        `Failed to get suspects for victim: ${error}`,
        undefined,
        'VictimMappingService',
      );
      throw error;
    }
  }
}
