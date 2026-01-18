import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logger/logger.service';

interface GeofenceResult {
  zone_name: string;
}

interface CellTowerInput {
  cell_id: string;
  name?: string;
  lat: number;
  lon: number;
  range_km?: number;
}

interface RestrictedZoneInput {
  name: string;
  polygon_wkt: string;
}

interface TowerLocation {
  cell_id: string;
  name: string;
  lat: number;
  lon: number;
  range_km: number;
}

interface TriangulatedPoint {
  lat: number;
  lon: number;
  accuracy_m: number;
  tower_count: number;
}

interface PointWithDistance {
  lat: number;
  lon: number;
  distance_km: number;
  cell_tower_id: string;
  tower_name: string;
}

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'Supabase credentials not configured. Supabase features will be disabled.',
        'SupabaseService',
      );
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      // Test connection
      const { error } = await this.client
        .from('cell_towers_2')
        .select('id')
        .limit(1);
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }
      this.logger.success('Connected to Supabase', 'SupabaseService');
    } catch (error) {
      this.logger.error(
        `Supabase connection test failed: ${error}`,
        'SupabaseService',
      );
    }
  }

  getClient(): SupabaseClient | null {
    return this.client || null;
  }

  isConnected(): boolean {
    return !!this.client;
  }

  /**
   * Check if a point falls within any restricted zone (PostGIS)
   */
  async checkGeofence(lat: number, lon: number): Promise<string[]> {
    if (!this.client) {
      this.logger.warn(
        'Supabase not connected, skipping geofence check',
        'SupabaseService',
      );
      return [];
    }

    const { data, error } = await this.client.rpc('check_geofence', {
      lat,
      lon,
    });

    if (error) {
      this.logger.error(
        `Geofence check error: ${error.message}`,
        'SupabaseService',
      );
      return [];
    }

    return ((data as GeofenceResult[]) || []).map((r) => r.zone_name);
  }

  /**
   * Batch insert cell towers with PostGIS geometry
   */
  async insertCellTowers(towers: CellTowerInput[]): Promise<number> {
    if (!this.client) {
      throw new Error('Supabase not connected');
    }

    // Transform to PostGIS format using raw SQL via RPC or direct insert
    const rows = towers.map((t) => ({
      cell_id: t.cell_id,
      name: t.name || null,
      location: `POINT(${t.lon} ${t.lat})`,
      range_km: t.range_km || null,
    }));

    const { data, error } = await this.client
      .from('cell_towers_2')
      .upsert(rows, { onConflict: 'cell_id' })
      .select('id');

    if (error) {
      this.logger.error(
        `Cell tower insert error: ${error.message}`,
        'SupabaseService',
      );
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Insert restricted zones with PostGIS polygon
   */
  async insertRestrictedZones(zones: RestrictedZoneInput[]): Promise<number> {
    if (!this.client) {
      throw new Error('Supabase not connected');
    }

    const rows = zones.map((z) => ({
      name: z.name,
      boundary: z.polygon_wkt,
    }));

    const { data, error } = await this.client
      .from('restricted_zones')
      .insert(rows)
      .select('id');

    if (error) {
      this.logger.error(
        `Restricted zone insert error: ${error.message}`,
        'SupabaseService',
      );
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Create investigation record (dual-write: SQL side)
   */
  async createInvestigation(id: string, name: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        'Supabase not connected, skipping SQL investigation create',
        'SupabaseService',
      );
      return;
    }

    const { error } = await this.client.from('investigations').insert({
      id,
      name,
    });

    if (error) {
      this.logger.error(
        `Investigation create error: ${error.message}`,
        'SupabaseService',
      );
      throw error;
    }
  }

  /**
   * Add audit log entry
   */
  async addAuditLog(
    action: string,
    entityType?: string,
    entityId?: string,
    userId?: string,
  ): Promise<void> {
    if (!this.client) {
      return;
    }

    const { error } = await this.client.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
    });

    if (error) {
      this.logger.error(`Audit log error: ${error.message}`, 'SupabaseService');
    }
  }

  /**
   * Get all cell towers for map rendering
   */
  async getCellTowers(): Promise<any[]> {
    if (!this.client) {
      return [];
    }

    const { data, error } = await this.client.from('cell_towers_2').select('*');

    if (error) {
      this.logger.error(
        `Get cell towers error: ${error.message}`,
        'SupabaseService',
      );
      return [];
    }

    return data || [];
  }

  /**
   * Get all restricted zones for map rendering
   */
  async getRestrictedZones(): Promise<any[]> {
    if (!this.client) {
      return [];
    }

    const { data, error } = await this.client
      .from('restricted_zones')
      .select('*');

    if (error) {
      this.logger.error(
        `Get restricted zones error: ${error.message}`,
        'SupabaseService',
      );
      return [];
    }

    return data || [];
  }

  /**
   * Get cell tower locations by their IDs (for hybrid Neo4j + Supabase)
   */
  async getTowersByIds(towerIds: string[]): Promise<TowerLocation[]> {
    if (!this.client || !towerIds || towerIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from('cell_towers_2')
      .select('cell_id, name, lat, lon, range_km')
      .in('cell_id', towerIds);

    if (error) {
      this.logger.error(
        `Get towers by IDs error: ${error.message}`,
        'SupabaseService',
      );
      return [];
    }

    return (data || []).map((tower: any) => {
      // Defensive parsing for lat/lon in case generated columns are missing
      let lat = tower.lat;
      let lon = tower.lon;

      if (lat === undefined || lat === null) {
        if (tower.location?.type === 'Point') {
          lat = tower.location.coordinates[1];
          lon = tower.location.coordinates[0];
        } else if (typeof tower.location === 'string') {
          const match = tower.location.match(
            /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i,
          );
          if (match) {
            lon = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          }
        }
      }

      const finalLat = parseFloat(lat) || 0;
      const finalLon = parseFloat(lon) || 0;

      return {
        cell_id: tower.cell_id,
        name: tower.name || tower.cell_id,
        lat: finalLat,
        lon: finalLon,
        latitude: finalLat,
        longitude: finalLon,
        range_km: parseFloat(tower.range_km) || 2.0,
      };
    });
  }

  /**
   * Triangulate position using multiple cell towers (PostGIS RPC)
   */
  async triangulatePosition(
    towerIds: string[],
    ranges?: number[],
  ): Promise<TriangulatedPoint | null> {
    if (!this.client || !towerIds || towerIds.length === 0) {
      return null;
    }

    const { data, error } = await this.client.rpc('triangulate_position', {
      tower_ids: towerIds,
      tower_ranges: ranges || null,
    });

    if (error) {
      this.logger.error(
        `Triangulation error: ${error.message}`,
        'SupabaseService',
      );
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as TriangulatedPoint;
  }

  /**
   * Get callers within range of a point (PostGIS range query)
   */
  async getCallersInRange(
    centerLat: number,
    centerLon: number,
    rangeKm: number,
  ): Promise<PointWithDistance[]> {
    if (!this.client) {
      return [];
    }

    const { data, error } = await this.client.rpc('get_callers_in_range', {
      victim_lat: centerLat,
      victim_lon: centerLon,
      range_km: rangeKm,
    });

    if (error) {
      this.logger.error(
        `Range query error: ${error.message}`,
        'SupabaseService',
      );
      return [];
    }

    return (data || []) as PointWithDistance[];
  }

  /**
   * Calculate distance between two points using PostGIS
   */
  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<number> {
    if (!this.client) {
      return 0;
    }

    const { data, error } = await this.client.rpc('calculate_distance_km', {
      lat1,
      lon1,
      lat2,
      lon2,
    });

    if (error) {
      this.logger.error(
        `Distance calculation error: ${error.message}`,
        'SupabaseService',
      );
      return 0;
    }

    return data || 0;
  }

  /**
   * Filter points within range of center (used for map markers)
   */
  async filterPointsInRange(
    centerLat: number,
    centerLon: number,
    rangeKm: number,
    points: Array<{ lat: number; lon: number; [key: string]: any }>,
  ): Promise<
    Array<{ lat: number; lon: number; distance_km: number; [key: string]: any }>
  > {
    if (!this.client || !points || points.length === 0) {
      return [];
    }

    // Calculate distance for each point
    const enriched = await Promise.all(
      points.map(async (point) => {
        const distance = await this.calculateDistance(
          centerLat,
          centerLon,
          point.lat,
          point.lon,
        );
        return { ...point, distance_km: distance };
      }),
    );

    // Filter by range
    return enriched.filter((p) => p.distance_km <= rangeKm);
  }

  /**
   * Get all cell towers from Supabase (for map display)
   * Uses PostGIS to extract coordinates from geography column
   */
  async getAllCellTowers(): Promise<TowerLocation[]> {
    if (!this.client) {
      return [];
    }

    try {
      // Use RPC to get towers with PostGIS coordinate extraction from cell_towers_2
      const { data, error } = await this.client.rpc('get_all_towers_v2', {
        limit_count: 1000,
      });

      if (error) {
        this.logger.warn(
          `RPC get_all_towers_v2 not available, trying direct query: ${error.message}`,
          'SupabaseService',
        );

        // Fallback: Direct query from cell_towers_2
        const { data: rawData, error: queryError } = await this.client
          .from('cell_towers_2')
          .select('*');

        if (queryError) {
          this.logger.error(
            `Get all cell towers error: ${queryError.message}`,
            'SupabaseService',
          );
          return [];
        }

        // Transform raw PostGIS data
        // When PostGIS geography is returned directly, we need to parse it
        return (rawData || []).map((tower: any) => {
          // Check if location is already in GeoJSON format
          let lon = 0,
            lat = 0;

          if (tower.location?.type === 'Point') {
            // GeoJSON format: {type: 'Point', coordinates: [lon, lat]}
            lon = tower.location.coordinates[0];
            lat = tower.location.coordinates[1];
          } else if (typeof tower.location === 'string') {
            // WKT format: "POINT(lon lat)"
            const match = tower.location.match(
              /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i,
            );
            if (match) {
              lon = parseFloat(match[1]);
              lat = parseFloat(match[2]);
            }
          }

          return {
            cell_id: tower.cell_id,
            name: tower.name || tower.cell_id,
            lon,
            lat,
            range_km: tower.range_km || 2.0,
          };
        });
      }

      // RPC returned successfully - data is already in the right format
      return (data || []).map((tower: any) => ({
        cell_id: tower.cell_id,
        name: tower.name || '',
        lon: tower.lon,
        lat: tower.lat,
        range_km: tower.range_km || 2.0,
      }));
    } catch (err) {
      this.logger.error(
        `Unexpected error in getAllCellTowers: ${err}`,
        'SupabaseService',
      );
      return [];
    }
  }

  /**
   * Get cell towers within a geographic bounding box (for map viewport)
   * More efficient than loading all 850k towers
   */
  async getTowersInBounds(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
  ): Promise<TowerLocation[]> {
    if (!this.client) {
      return [];
    }

    try {
      const { data, error } = await this.client.rpc('get_towers_in_bounds_v2', {
        min_lat: minLat,
        min_lon: minLon,
        max_lat: maxLat,
        max_lon: maxLon,
      });

      if (error) {
        this.logger.error(
          `Get towers in bounds error: ${error.message}`,
          'SupabaseService',
        );
        return [];
      }

      return (data || []).map((tower: any) => ({
        cell_id: tower.cell_id,
        name: tower.name || '',
        lon: tower.lon,
        lat: tower.lat,
        range_km: tower.range_km || 2.0,
      }));
    } catch (err) {
      this.logger.error(
        `Error getting towers in bounds: ${err}`,
        'SupabaseService',
      );
      return [];
    }
  }
}
