import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { LoggerService } from '../common/logger/logger.service';

interface MovementEvent {
  suspectId: string;
  lat: number;
  lon: number;
  timestamp?: Date;
  cellTowerId?: string;
}

interface GeofenceAlert {
  suspectId: string;
  zones: string[];
  lat: number;
  lon: number;
  timestamp: Date;
  previousRisk: string;
  newRisk: string;
}

@Injectable()
export class SuspectTrackingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly neo4j: Neo4jService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Ingest suspect movement with hybrid geofence logic:
   * 1. Check Supabase PostGIS for geofence hit
   * 2. Create Event node in Neo4j with location
   * 3. If zone hit, flag suspect as CRITICAL
   */
  async ingestSuspectMovement(
    event: MovementEvent,
  ): Promise<{ success: boolean; geofenceAlert?: GeofenceAlert }> {
    const { suspectId, lat, lon, timestamp, cellTowerId } = event;
    const eventTime = timestamp || new Date();

    try {
      // Step 1: Check Supabase for geofence hit using PostGIS
      const zones = await this.supabase.checkGeofence(lat, lon);
      const isTrespassing = zones.length > 0;

      if (isTrespassing) {
        this.logger.warn(
          `🚨 GEOFENCE BREACH: Suspect ${suspectId} entered ${zones.join(', ')}`,
          'SuspectTracking',
        );
      }

      // Step 2: Create Event node in Neo4j with spatial point
      const labels = isTrespassing ? ':Event:TRESPASSED' : ':Event';
      await this.neo4j.writeCypher(
        `
        MATCH (s:GlobalSuspect {phone: $suspectId})
        CREATE (e${labels} {
          location: point({latitude: $lat, longitude: $lon}),
          timestamp: datetime($timestamp),
          cell_tower_id: $cellTowerId,
          zones: $zones
        })
        CREATE (s)-[:PINGED {timestamp: datetime($timestamp)}]->(e)
        RETURN e
        `,
        {
          suspectId,
          lat,
          lon,
          timestamp: eventTime.toISOString(),
          cellTowerId: cellTowerId || null,
          zones,
        },
      );

      // Step 3: If zone hit, escalate suspect to CRITICAL
      let previousRisk = 'MEDIUM';
      if (isTrespassing) {
        const result = await this.neo4j.writeCypher(
          `
          MATCH (s:GlobalSuspect {phone: $suspectId})
          WITH s, s.risk as previousRisk
          SET s.risk = 'CRITICAL',
              s.lastGeofenceBreachAt = datetime($timestamp),
              s.lastGeofenceZones = $zones
          RETURN previousRisk
          `,
          {
            suspectId,
            timestamp: eventTime.toISOString(),
            zones,
          },
        );

        if (result.length > 0) {
          previousRisk = result[0].get('previousRisk') || 'MEDIUM';
        }

        // Add audit log in Supabase
        await this.supabase.addAuditLog(
          'GEOFENCE_BREACH',
          'GlobalSuspect',
          suspectId,
        );

        return {
          success: true,
          geofenceAlert: {
            suspectId,
            zones,
            lat,
            lon,
            timestamp: eventTime,
            previousRisk,
            newRisk: 'CRITICAL',
          },
        };
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Movement ingestion failed for ${suspectId}: ${error instanceof Error ? error.message : String(error)}`,
        'SuspectTracking',
      );
      return { success: false };
    }
  }

  /**
   * Get suspect movement history from Neo4j
   */
  async getSuspectMovementHistory(
    suspectId: string,
    limit = 100,
  ): Promise<
    Array<{
      lat: number;
      lon: number;
      timestamp: string;
      isTrespassing: boolean;
    }>
  > {
    const result = await this.neo4j.readCypher(
      `
      MATCH (s:GlobalSuspect {phone: $suspectId})-[:PINGED]->(e:Event)
      RETURN e.location.latitude as lat, 
             e.location.longitude as lon,
             e.timestamp as timestamp,
             e:TRESPASSED as isTrespassing
      ORDER BY e.timestamp DESC
      LIMIT $limit
      `,
      { suspectId, limit },
    );

    return result.map((record) => ({
      lat: record.get('lat'),
      lon: record.get('lon'),
      timestamp: record.get('timestamp')?.toString() || '',
      isTrespassing: record.get('isTrespassing') || false,
    }));
  }

  /**
   * Get all suspects with recent geofence breaches
   */
  async getGeofenceBreaches(hoursBack = 24): Promise<
    Array<{
      suspectId: string;
      name: string;
      zones: string[];
      breachTime: string;
    }>
  > {
    const result = await this.neo4j.readCypher(
      `
      MATCH (s:GlobalSuspect)
      WHERE s.lastGeofenceBreachAt > datetime() - duration({hours: $hoursBack})
      RETURN s.phone as suspectId,
             s.name as name,
             s.lastGeofenceZones as zones,
             s.lastGeofenceBreachAt as breachTime
      ORDER BY s.lastGeofenceBreachAt DESC
      `,
      { hoursBack },
    );

    return result.map((record) => ({
      suspectId: record.get('suspectId'),
      name: record.get('name'),
      zones: record.get('zones') || [],
      breachTime: record.get('breachTime')?.toString() || '',
    }));
  }

  /**
   * Track multiple movement events (batch)
   */
  async ingestBatchMovements(
    events: MovementEvent[],
  ): Promise<{ success: number; failures: number; alerts: GeofenceAlert[] }> {
    const stats = { success: 0, failures: 0, alerts: [] as GeofenceAlert[] };

    for (const event of events) {
      const result = await this.ingestSuspectMovement(event);
      if (result.success) {
        stats.success++;
        if (result.geofenceAlert) {
          stats.alerts.push(result.geofenceAlert);
        }
      } else {
        stats.failures++;
      }
    }

    if (stats.alerts.length > 0) {
      this.logger.warn(
        `🚨 ${stats.alerts.length} geofence breaches detected in batch`,
        'SuspectTracking',
      );
    }

    return stats;
  }
}
