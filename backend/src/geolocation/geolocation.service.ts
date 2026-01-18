import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Integer } from 'neo4j-driver';
import { VictimCallerConnection, TriangulationResult } from './geolocation.dto';

/**
 * Helper to recursively convert all Neo4j Integers in an object to regular JS numbers
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
export interface DistanceCluster {
  caller_id: string;
  caller_name: string;
  victim_id: string;
  victim_name: string;
  proximity_calls: number;
  avg_distance_km: number;
  min_distance_km: number;
  cluster_center_lat: number;
  cluster_center_lon: number;
}

export interface LocationPrediction {
  suspect_id: string;
  suspect_name: string;
  suspect_phone: string;
  last_known_position: {
    latitude: number;
    longitude: number;
    timestamp: string;
    tower_id: string;
  };
  movement_pattern: string[];
  predicted_location: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MapMarker {
  call_id: string;
  caller: { id: string; name: string; phone: string };
  receiver: { id: string; name: string; phone: string };
  caller_position: { lat: number; lon: number; tower_id: string };
  receiver_position: { lat: number; lon: number; tower_id: string };
  tower: { id: string; location: string; lat: number; lon: number };
  proximity_pattern: string;
  distance_km: number;
  call_duration: number;
  call_time: string;
  risk_level: string;
}

export interface CellTower {
  tower_id: string;
  location: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  provider: string;
  high_risk_calls: number;
  investigation_priority: string;
}

@Injectable()
export class GeolocationService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Find distance-based harassment clusters using CDR data
   */
  async findDistanceBasedClusters(
    investigationId: string,
  ): Promise<DistanceCluster[]> {
    this.logger.log(
      `Finding distance-based clusters for ${investigationId}`,
      'GeolocationService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(c:Suspect)-[cdr:CDR_CALL]->(v:Suspect)
      WHERE cdr.approximateDistanceKm IS NOT NULL AND cdr.approximateDistanceKm < 10
      
      // Get tower coordinates for clustering
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(tower:CellTower {towerId: cdr.callerTowerId})
      
      WITH c, v,
           collect({
             distance: cdr.approximateDistanceKm,
             lat: tower.latitude,
             lon: tower.longitude
           }) AS call_data,
           count(*) as proximity_call_count
      
      WHERE proximity_call_count > 2
      
      RETURN {
        caller_id: c.id,
        caller_name: c.name,
        victim_id: v.id,
        victim_name: v.name,
        proximity_calls: proximity_call_count,
        avg_distance_km: avg([cd IN call_data | cd.distance]),
        min_distance_km: min([cd IN call_data | cd.distance]),
        cluster_center_lat: avg([cd IN call_data WHERE cd.lat IS NOT NULL | cd.lat]),
        cluster_center_lon: avg([cd IN call_data WHERE cd.lon IS NOT NULL | cd.lon])
      } AS cluster
      
      ORDER BY proximity_call_count DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const clusters = records.map(
        (r) => convertNeo4jIntegers(r.get('cluster')) as DistanceCluster,
      );
      this.logger.success(
        `Found ${clusters.length} distance-based clusters`,
        'GeolocationService',
      );
      return clusters;
    } catch (error) {
      this.logger.error(
        `Failed to find clusters: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }

  /**
   * Predict current location based on CDR movement history
   */
  async predictCurrentLocation(
    investigationId: string,
    suspectId: string,
  ): Promise<LocationPrediction | null> {
    this.logger.log(
      `Predicting location for suspect ${suspectId} (Hybrid)`,
      'GeolocationService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})
      
      // Get historical CDR tower IDs
      OPTIONAL MATCH (s)-[cdr:CDR_CALL]->()
      
      // Get real-time event tower IDs
      OPTIONAL MATCH (s)-[:PINGED]->(e:Event)
      
      WITH s, 
           CASE 
             WHEN e IS NOT NULL THEN {
               time: toString(e.timestamp),
               tower_id: e.cell_tower_id,
               type: 'EVENT'
             }
             WHEN cdr IS NOT NULL THEN {
               time: cdr.callStartTime,
               tower_id: cdr.callerTowerId,
               type: 'CDR'
             }
             ELSE NULL
           END AS pos
      
      WHERE pos IS NOT NULL
      
      WITH s, pos
      ORDER BY pos.time DESC
      LIMIT 15
      
      WITH s, collect(pos) AS recent_positions
      
      RETURN {
        suspect_id: s.id,
        suspect_name: s.name,
        suspect_phone: s.phone,
        recent_positions: recent_positions
      } AS result
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        suspectId,
      });

      if (
        records.length === 0 ||
        !records[0].get('result').recent_positions.length
      ) {
        this.logger.warn(
          `No location data for suspect ${suspectId}`,
          'GeolocationService',
        );
        return null;
      }

      const result = convertNeo4jIntegers(records[0].get('result'));
      const recentPositions = result.recent_positions;

      // Fetch tower coordinates
      const towerIds = [
        ...new Set(recentPositions.map((p) => p.tower_id).filter(Boolean)),
      ] as string[];
      const towers = await this.supabaseService.getTowersByIds(towerIds);
      const towerMap = new Map(towers.map((t) => [t.cell_id, t]));

      const lastPos = recentPositions[0];
      const towerData = towerMap.get(lastPos.tower_id);

      const prediction: LocationPrediction = {
        suspect_id: result.suspect_id,
        suspect_name: result.suspect_name,
        suspect_phone: result.suspect_phone,
        last_known_position: {
          latitude: towerData?.lat || 0,
          longitude: towerData?.lon || 0,
          timestamp: lastPos.time,
          tower_id: lastPos.tower_id || 'GPS',
        },
        movement_pattern: recentPositions.map((p) => {
          const t = towerMap.get(p.tower_id);
          return t ? `${t.name} (${p.time})` : `Unknown Tower ${p.tower_id}`;
        }),
        predicted_location: towerData?.name || 'Unknown',
        confidence_level:
          recentPositions.length >= 8
            ? 'HIGH'
            : recentPositions.length >= 4
              ? 'MEDIUM'
              : 'LOW',
      };

      this.logger.success(
        `Location predicted with ${prediction.confidence_level} confidence`,
        'GeolocationService',
      );
      return prediction;
    } catch (error) {
      this.logger.error(
        `Failed to predict location: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }

  /**
   * Get all cell towers from Supabase (infrastructure data)
   * Cell towers are stored in Supabase PostGIS, not Neo4j
   */
  async getCellTowers(investigationId: string): Promise<CellTower[]> {
    this.logger.log(
      `Fetching cell towers from Supabase for ${investigationId}`,
      'GeolocationService',
    );

    try {
      // Fetch all cell towers from Supabase
      const towers = await this.supabaseService.getAllCellTowers();

      this.logger.success(
        `Retrieved ${towers.length} cell towers from Supabase`,
        'GeolocationService',
      );

      // Transform Supabase tower format to CellTower interface
      return towers.map((t) => ({
        tower_id: t.cell_id,
        location: t.name || t.cell_id,
        latitude: t.lat,
        longitude: t.lon,
        city: '',
        state: '',
        provider: '',
        high_risk_calls: 0,
        investigation_priority: 'LOW',
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch towers from Supabase: ${error}`,
        undefined,
        'GeolocationService',
      );
      // Return empty array instead of throwing to prevent breaking the map
      return [];
    }
  }

  /**
   * Get all geolocation markers for map display (hybrid Neo4j + Supabase)
   * Uses cell tower triangulation to estimate caller location
   */
  async getMapMarkers(investigationId: string): Promise<MapMarker[]> {
    this.logger.log(
      `Fetching map markers for ${investigationId}`,
      'GeolocationService',
    );

    // Step 1: Query Neo4j for CDR calls with tower IDs
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(caller:Suspect)
            -[cdr:CDR_CALL]->(receiver:Suspect)
      WHERE (i)-[:CONTAINS]->(receiver)
      
      RETURN {
        call_id: cdr.callId,
        caller: {
          id: caller.id,
          name: caller.name,
          phone: caller.phone
        },
        receiver: {
          id: receiver.id,
          name: receiver.name,
          phone: receiver.phone
        },
        caller_tower_id: cdr.callerTowerId,
        receiver_tower_id: cdr.receiverTowerId,
        call_time: cdr.callStartTime,
        duration: cdr.durationSec,
        proximity: cdr.proximityPattern
      } AS call
      ORDER BY cdr.callStartTime DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });

      const calls = records.map((r) => convertNeo4jIntegers(r.get('call')));

      this.logger.log(
        `Found ${calls.length} CDR calls from Neo4j for investigation ${investigationId}`,
        'GeolocationService',
      );

      if (calls.length === 0) {
        return [];
      }

      // Step 2: Extract unique tower IDs
      const towerIds = [
        ...new Set(
          calls
            .flatMap((c) => [c.caller_tower_id, c.receiver_tower_id])
            .filter(Boolean),
        ),
      ];

      this.logger.log(
        `Unique tower IDs found in CDR: ${towerIds.join(', ')}`,
        'GeolocationService',
      );

      // Step 3: Fetch tower coordinates from Supabase
      const towers = await this.supabaseService.getTowersByIds(towerIds);
      const towerMap = new Map(towers.map((t) => [t.cell_id, t]));

      this.logger.log(
        `Successfully matched ${towerMap.size} out of ${towerIds.length} unique towers from Supabase`,
        'GeolocationService',
      );

      if (towerMap.size === 0) {
        this.logger.warn(
          `WARNING: None of the ${towerIds.length} tower IDs from Neo4j were found in Supabase cell_towers_2 table!`,
          'GeolocationService',
        );
      }

      // Step 4: Build map markers with tower locations (approximation)
      const markers: MapMarker[] = calls
        .map((call) => {
          const callerTower = towerMap.get(call.caller_tower_id);
          const receiverTower = towerMap.get(call.receiver_tower_id);

          if (!callerTower) {
            // Log missing tower once per ID to avoid spam
            return null; // Skip if tower not found
          }

          return {
            call_id: call.call_id,
            caller: call.caller,
            receiver: call.receiver,
            caller_position: {
              lat: callerTower.lat,
              lon: callerTower.lon,
              tower_id: callerTower.cell_id,
            },
            receiver_position: receiverTower
              ? {
                  lat: receiverTower.lat,
                  lon: receiverTower.lon,
                  tower_id: receiverTower.cell_id,
                }
              : null,
            tower: {
              id: callerTower.cell_id,
              location: callerTower.name || 'Unknown',
              lat: callerTower.lat,
              lon: callerTower.lon,
            },
            proximity_pattern: call.proximity || 'UNKNOWN',
            distance_km: 0, // Can calculate if needed
            call_duration: call.duration || 0,
            call_time: call.call_time,
            risk_level: call.proximity === 'NEAR' ? 'HIGH' : 'MEDIUM',
          } as MapMarker;
        })
        .filter((m) => m !== null) as MapMarker[];

      this.logger.success(
        `Finalized ${markers.length} markers for map display out of ${calls.length} possible calls`,
        'GeolocationService',
      );

      return markers;
    } catch (error) {
      this.logger.error(
        `Failed to fetch markers: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }

  /**
   * Get victim-caller map with hybrid Neo4j + Supabase
   * Neo4j provides relationships, Supabase provides tower coordinates
   */
  async getVictimCallerMap(
    investigationId: string,
    victimId: string,
    rangeKm?: number,
  ): Promise<VictimCallerConnection[]> {
    this.logger.log(
      `Getting victim-caller map for ${victimId}`,
      'GeolocationService',
    );

    // Step 1: Query Neo4j for CDR relationships
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(caller:Suspect)
            -[cdr:CDR_CALL]->(victim:Suspect {id: $victimId})
      
      RETURN {
        call_id: cdr.callId,
        caller: {
          id: caller.id,
          name: caller.name,
          phone: caller.phone
        },
        victim: {
          id: victim.id,
          name: victim.name,
          phone: victim.phone
        },
        caller_tower_id: cdr.callerTowerId,
        receiver_tower_id: cdr.receiverTowerId,
        call_time: cdr.callStartTime,
        duration: cdr.durationSec,
        direction: cdr.direction
      } AS call
      ORDER BY cdr.callStartTime DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        victimId,
      });

      const calls = records.map((r) => convertNeo4jIntegers(r.get('call')));

      // Step 2: Extract unique tower IDs
      const towerIds = [
        ...new Set(
          calls
            .flatMap((c) => [c.caller_tower_id, c.receiver_tower_id])
            .filter(Boolean),
        ),
      ];

      // Step 3: Fetch tower coordinates from Supabase
      const towers = await this.supabaseService.getTowersByIds(towerIds);
      const towerMap = new Map(towers.map((t) => [t.cell_id, t]));

      // Step 4: Enrich calls with tower coordinates
      const enrichedCalls: VictimCallerConnection[] = calls.map((call) => {
        const callerTower = towerMap.get(call.caller_tower_id);
        const receiverTower = towerMap.get(call.receiver_tower_id);

        return {
          callId: call.call_id,
          caller: call.caller,
          victim: call.victim,
          callerPosition: {
            lat: callerTower?.lat || 0,
            lon: callerTower?.lon || 0,
            towerId: call.caller_tower_id,
            towerName: callerTower?.name,
          },
          victimPosition: {
            lat: receiverTower?.lat || 0,
            lon: receiverTower?.lon || 0,
            towerId: call.receiver_tower_id,
            towerName: receiverTower?.name,
          },
          distance_km: 0,
          callTime: call.call_time,
          duration: call.duration || 0,
          direction: call.direction || 'INCOMING',
          riskLevel: 'MEDIUM',
        };
      });

      // Step 5: Optional range filtering
      if (rangeKm && enrichedCalls.length > 0) {
        const victimPos = enrichedCalls[0].victimPosition;

        const filtered = await this.supabaseService.filterPointsInRange(
          victimPos.lat,
          victimPos.lon,
          rangeKm,
          enrichedCalls.map((c) => ({
            ...c,
            lat: c.callerPosition.lat,
            lon: c.callerPosition.lon,
          })),
        );

        this.logger.success(
          `Filtered to ${filtered.length} calls within ${rangeKm}km`,
          'GeolocationService',
        );

        return filtered as unknown as VictimCallerConnection[];
      }

      this.logger.success(
        `Retrieved ${enrichedCalls.length} victim-caller connections`,
        'GeolocationService',
      );

      return enrichedCalls;
    } catch (error) {
      this.logger.error(
        `Failed to get victim-caller map: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }

  /**
   * Triangulate suspect location using PostGIS
   * NOW WITH PHANTOM TOWER DETECTION
   */
  async triangulateLocation(
    investigationId: string,
    suspectId: string,
  ): Promise<TriangulationResult | null> {
    this.logger.log(
      `Triangulating location for suspect ${suspectId}`,
      'GeolocationService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(suspect:Suspect {id: $suspectId})
      OPTIONAL MATCH (suspect)-[cdr:CDR_CALL]->()
      
      WHERE cdr.callerTowerId IS NOT NULL
      
      WITH suspect, collect(DISTINCT cdr.callerTowerId) AS tower_ids
      
      RETURN {
        suspect_id: suspect.id,
        suspect_name: suspect.name,
        tower_ids: tower_ids
      } AS result
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        suspectId,
      });

      if (records.length === 0) {
        return null;
      }

      const result = convertNeo4jIntegers(records[0].get('result'));
      const allTowerIds = result.tower_ids || [];

      if (allTowerIds.length === 0) {
        return null;
      }

      this.logger.log(
        `[TRIANGULATION DEBUG] Suspect ${suspectId}: Found ${allTowerIds.length} towers from CDR records`,
        'GeolocationService',
      );
      this.logger.log(
        `[TRIANGULATION DEBUG] Tower IDs from Neo4j: ${allTowerIds.join(', ')}`,
        'GeolocationService',
      );

      // ✅ VALIDATE: Check which towers actually exist in Supabase
      const supabaseTowers =
        await this.supabaseService.getTowersByIds(allTowerIds);
      const validTowerIds = supabaseTowers.map((t) => t.cell_id);
      const phantomTowerIds = allTowerIds.filter(
        (id) => !validTowerIds.includes(id),
      );

      this.logger.log(
        `[TRIANGULATION DEBUG] Towers in Supabase: ${validTowerIds.length} / ${allTowerIds.length}`,
        'GeolocationService',
      );
      this.logger.log(
        `[TRIANGULATION DEBUG] ✅ Valid towers: ${validTowerIds.join(', ')}`,
        'GeolocationService',
      );

      if (phantomTowerIds.length > 0) {
        this.logger.warn(
          `[TRIANGULATION DEBUG] ❌ PHANTOM TOWERS (missing from Supabase): ${phantomTowerIds.join(', ')}`,
          'GeolocationService',
        );
      }

      // ⚠️ CRITICAL: Use only valid towers for triangulation
      if (validTowerIds.length === 0) {
        this.logger.error(
          `[TRIANGULATION DEBUG] ❌ NO VALID TOWERS - All ${allTowerIds.length} towers are phantoms!`,
          'GeolocationService',
        );
        return null;
      }

      this.logger.log(
        `[TRIANGULATION DEBUG] Using ${validTowerIds.length} valid towers (excluding ${phantomTowerIds.length} phantoms)`,
        'GeolocationService',
      );

      // Log tower coordinates for debugging
      supabaseTowers.forEach((tower) => {
        this.logger.log(
          `[TRIANGULATION DEBUG] Tower ${tower.cell_id}: (${tower.lat}, ${tower.lon})`,
          'GeolocationService',
        );
      });

      const triangulated =
        await this.supabaseService.triangulatePosition(validTowerIds);

      if (!triangulated) {
        this.logger.error(
          `[TRIANGULATION DEBUG] Triangulation failed (no result from RPC)`,
          'GeolocationService',
        );
        return null;
      }

      this.logger.log(
        `[TRIANGULATION DEBUG] Triangulation result: (${triangulated.lat}, ${triangulated.lon}), accuracy: ${triangulated.accuracy_m}m`,
        'GeolocationService',
      );

      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (triangulated.tower_count >= 3) {
        confidence = 'HIGH';
      } else if (triangulated.tower_count === 2) {
        confidence = 'MEDIUM';
      }

      const triangulationResult: TriangulationResult = {
        suspectId: result.suspect_id,
        suspectName: result.suspect_name,
        estimatedLocation: {
          lat: triangulated.lat,
          lon: triangulated.lon,
        },
        accuracyMeters: triangulated.accuracy_m,
        towerCount: triangulated.tower_count,
        towersUsed: validTowerIds,
        phantomTowers: phantomTowerIds, // 🆕 Report phantom towers
        confidence,
        timestamp: new Date(),
      };

      this.logger.success(
        `Triangulated location with ${confidence} confidence (${validTowerIds.length} valid towers)`,
        'GeolocationService',
      );

      return triangulationResult;
    } catch (error) {
      this.logger.error(
        `Failed to triangulate location: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }

  /**
   * Get map markers filtered by range
   */
  async getMarkersInRange(
    investigationId: string,
    centerLat: number,
    centerLon: number,
    rangeKm: number,
  ): Promise<MapMarker[]> {
    try {
      const allMarkers = await this.getMapMarkers(investigationId);

      const filtered = await this.supabaseService.filterPointsInRange(
        centerLat,
        centerLon,
        rangeKm,
        allMarkers.map((m) => ({
          ...m,
          lat: m.caller_position.lat,
          lon: m.caller_position.lon,
        })),
      );

      return filtered as unknown as MapMarker[];
    } catch (error) {
      this.logger.error(
        `Failed to filter markers by range: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }
}
