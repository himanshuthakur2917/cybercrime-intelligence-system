import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { Integer } from 'neo4j-driver';

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
      `Predicting location for suspect ${suspectId}`,
      'GeolocationService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})
      
      // Get historical CDR positions
      OPTIONAL MATCH (s)-[cdr:CDR_CALL]->()
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(tower:CellTower {towerId: cdr.callerTowerId})
      
      // Get real-time event positions
      OPTIONAL MATCH (s)-[:PINGED]->(e:Event)
      
      WITH s, 
           CASE 
             WHEN e IS NOT NULL THEN {
               lat: e.location.latitude,
               lon: e.location.longitude,
               time: toString(e.timestamp),
               tower_id: e.cell_tower_id,
               location: 'Real-time Event',
               type: 'EVENT'
             }
             WHEN cdr IS NOT NULL AND tower IS NOT NULL THEN {
               lat: tower.latitude,
               lon: tower.longitude,
               time: cdr.callStartTime,
               tower_id: cdr.callerTowerId,
               location: tower.towerLocation,
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
        last_known_position: {
          latitude: recent_positions[0].lat,
          longitude: recent_positions[0].lon,
          timestamp: recent_positions[0].time,
          tower_id: recent_positions[0].tower_id
        },
        movement_pattern: [pos IN recent_positions WHERE pos.location IS NOT NULL | pos.location],
        predicted_location: recent_positions[0].location,
        confidence_level: CASE
          WHEN size(recent_positions) >= 8 THEN 'HIGH'
          WHEN size(recent_positions) >= 4 THEN 'MEDIUM'
          ELSE 'LOW'
        END
      } AS prediction
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
        suspectId,
      });

      if (records.length === 0) {
        this.logger.warn(
          `No location data for suspect ${suspectId}`,
          'GeolocationService',
        );
        return null;
      }
      const prediction = convertNeo4jIntegers(
        records[0].get('prediction'),
      ) as LocationPrediction;
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
   * Get all cell towers for the investigation (from CellTower nodes)
   */
  async getCellTowers(investigationId: string): Promise<CellTower[]> {
    this.logger.log(
      `Fetching cell towers for ${investigationId}`,
      'GeolocationService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:HAS_TOWER]->(t:CellTower)
      
      RETURN {
        tower_id: t.towerId,
        location: t.towerLocation,
        latitude: t.latitude,
        longitude: t.longitude,
        city: t.city,
        state: t.state,
        provider: t.provider,
        high_risk_calls: t.highRiskCalls,
        investigation_priority: t.investigationPriority
      } AS tower
      
      ORDER BY t.highRiskCalls DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const towers = records.map((r) => r.get('tower') as CellTower);
      this.logger.success(
        `Retrieved ${towers.length} cell towers`,
        'GeolocationService',
      );
      return towers;
    } catch (error) {
      this.logger.error(
        `Failed to fetch towers: ${error}`,
        undefined,
        'GeolocationService',
      );
      throw error;
    }
  }

  /**
   * Get all geolocation markers for map display (from CDR_CALL relationships)
   */
  async getMapMarkers(investigationId: string): Promise<MapMarker[]> {
    this.logger.log(
      `Fetching map markers for ${investigationId}`,
      'GeolocationService',
    );

    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(caller:Suspect)
      
      // Part A: CDR Calls
      OPTIONAL MATCH (caller)-[cdr:CDR_CALL]->(receiver:Suspect)
      WHERE (i)-[:CONTAINS]->(receiver)
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(callerTower:CellTower {towerId: cdr.callerTowerId})
      OPTIONAL MATCH (i)-[:HAS_TOWER]->(receiverTower:CellTower {towerId: cdr.receiverTowerId})
      
      // Part B: Real-time Events
      OPTIONAL MATCH (caller)-[:PINGED]->(event:Event)
      
      WITH i, caller, cdr, receiver, callerTower, receiverTower, event
      
      // Combine results
      WITH caller, 
           CASE 
             WHEN event IS NOT NULL THEN {
               call_id: 'event-' + toString(id(event)),
               type: 'EVENT',
               lat: event.location.latitude,
               lon: event.location.longitude,
               time: toString(event.timestamp),
               risk: CASE WHEN 'TRESPASSED' IN labels(event) THEN 'CRITICAL' ELSE 'MEDIUM' END,
               info: 'Real-time Signal'
             }
             WHEN cdr IS NOT NULL AND callerTower IS NOT NULL THEN {
               call_id: cdr.callId,
               type: 'CDR',
               lat: callerTower.latitude,
               lon: callerTower.longitude,
               time: cdr.callStartTime,
               risk: CASE WHEN cdr.proximityPattern = 'NEAR' THEN 'HIGH' ELSE 'LOW' END,
               info: 'Tower: ' + callerTower.towerLocation,
               receiver: { id: receiver.id, name: receiver.name, phone: receiver.phone },
               receiver_pos: { lat: COALESCE(receiverTower.latitude, 0), lon: COALESCE(receiverTower.longitude, 0) }
             }
             ELSE NULL
           END AS m
      
      WHERE m IS NOT NULL
      
      RETURN {
        call_id: m.call_id,
        caller: {
          id: caller.id,
          name: caller.name,
          phone: caller.phone
        },
        receiver: m.receiver,
        caller_position: {
          lat: m.lat,
          lon: m.lon,
          tower_id: m.type
        },
        receiver_position: m.receiver_pos,
        tower: {
          id: m.type,
          location: m.info,
          lat: m.lat,
          lon: m.lon
        },
        proximity_pattern: m.type,
        distance_km: 0,
        call_duration: 0,
        call_time: m.time,
        risk_level: m.risk
      } AS marker
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });
      const markers = records.map((r) => r.get('marker') as MapMarker);
      this.logger.success(
        `Retrieved ${markers.length} map markers`,
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
}
