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

    this.client = createClient(supabaseUrl, supabaseKey);

    try {
      // Test connection
      const { error } = await this.client
        .from('cell_towers')
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
      .from('cell_towers')
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

    const { data, error } = await this.client.from('cell_towers').select('*');

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
}
