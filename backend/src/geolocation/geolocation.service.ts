import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';

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
    accuracy_m: number;
  };
  movement_pattern: string[];
  predicted_location: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MapMarker {
  call_id: string;
  caller: { id: string; name: string; phone: string };
  receiver: { id: string; name: string; phone: string };
  caller_position: { lat: number; lon: number; accuracy_m: number };
  receiver_position: { lat: number; lon: number };
  tower: { id: string; location: string };
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
}

@Injectable()
export class GeolocationService {
  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * Find distance-based harassment clusters
   */
  async findDistanceBasedClusters(
    investigationId: string,
  ): Promise<DistanceCluster[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(c:Suspect)-[call:CALLED]->(v:Suspect)
      WHERE call.approximateDistanceKm IS NOT NULL AND call.approximateDistanceKm < 5
      
      WITH c, v,
           collect({
             distance: call.approximateDistanceKm,
             lat: call.triangulationLat,
             lon: call.triangulationLon
           }) AS call_data,
           count(*) as proximity_call_count
      
      WHERE proximity_call_count > 3
      
      RETURN {
        caller_id: c.id,
        caller_name: c.name,
        victim_id: v.id,
        victim_name: v.name,
        proximity_calls: proximity_call_count,
        avg_distance_km: avg([cd IN call_data | cd.distance]),
        min_distance_km: min([cd IN call_data | cd.distance]),
        cluster_center_lat: avg([cd IN call_data | cd.lat]),
        cluster_center_lon: avg([cd IN call_data | cd.lon])
      } AS cluster
      
      ORDER BY proximity_call_count DESC
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('cluster') as DistanceCluster);
  }

  /**
   * Predict current location based on movement history
   */
  async predictCurrentLocation(
    investigationId: string,
    suspectId: string,
  ): Promise<LocationPrediction | null> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})-[call:CALLED]->()
      WHERE call.triangulationLat IS NOT NULL
      
      WITH s, call
      ORDER BY call.callStartTime DESC
      LIMIT 10
      
      WITH s,
           collect({
             lat: call.triangulationLat,
             lon: call.triangulationLon,
             time: call.callStartTime,
             accuracy: call.triangulationAccuracy,
             location: call.callerTowerLocation
           }) AS recent_positions
      
      RETURN {
        suspect_id: s.id,
        suspect_name: s.name,
        suspect_phone: s.phone,
        last_known_position: {
          latitude: recent_positions[0].lat,
          longitude: recent_positions[0].lon,
          timestamp: recent_positions[0].time,
          accuracy_m: recent_positions[0].accuracy
        },
        movement_pattern: [pos IN recent_positions | pos.location],
        predicted_location: recent_positions[0].location,
        confidence_level: CASE
          WHEN size(recent_positions) >= 5 THEN 'HIGH'
          WHEN size(recent_positions) >= 3 THEN 'MEDIUM'
          ELSE 'LOW'
        END
      } AS prediction
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
      suspectId,
    });

    if (records.length === 0) return null;
    return records[0].get('prediction') as LocationPrediction;
  }

  /**
   * Get all cell towers for map visualization
   */
  async getCellTowers(investigationId: string): Promise<CellTower[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(:Suspect)-[call:CALLED]->()
      WHERE call.callerTowerId IS NOT NULL
      
      WITH DISTINCT call.callerTowerId AS tower_id,
           call.callerTowerLocation AS location,
           call.callerLat AS lat,
           call.callerLon AS lon
      
      RETURN {
        tower_id: tower_id,
        location: location,
        latitude: lat,
        longitude: lon
      } AS tower
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('tower') as CellTower);
  }

  /**
   * Get all geolocation markers for map display
   */
  async getMapMarkers(investigationId: string): Promise<MapMarker[]> {
    const query = `
      MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(caller:Suspect)-[call:CALLED]->(receiver:Suspect)
      WHERE call.triangulationLat IS NOT NULL
      
      RETURN {
        call_id: call.callId,
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
        caller_position: {
          lat: call.triangulationLat,
          lon: call.triangulationLon,
          accuracy_m: call.triangulationAccuracy
        },
        receiver_position: {
          lat: call.receiverLat,
          lon: call.receiverLon
        },
        tower: {
          id: call.callerTowerId,
          location: call.callerTowerLocation
        },
        proximity_pattern: call.proximityPattern,
        distance_km: call.approximateDistanceKm,
        call_duration: call.duration,
        call_time: call.callStartTime,
        risk_level: CASE
          WHEN call.proximityPattern = 'NEAR' AND call.callCount > 10 THEN 'HIGH'
          WHEN call.proximityPattern = 'NEAR' THEN 'MEDIUM'
          ELSE 'LOW'
        END
      } AS marker
    `;

    const records = await this.neo4jService.readCypher(query, {
      invId: investigationId,
    });
    return records.map((r) => r.get('marker') as MapMarker);
  }
}
