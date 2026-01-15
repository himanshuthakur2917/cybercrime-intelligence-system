import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoggerService } from '../common/logger/logger.service';

export interface Officer {
  id?: string;
  badge_number: string;
  name: string;
  email: string;
  phone?: string;
  rank: string;
  department: string;
  station?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'RETIRED';
  role: 'ADMIN' | 'SENIOR_OFFICER' | 'OFFICER' | 'TRAINEE';
  permissions?: string[];
  current_cases_count?: number;
  max_cases_allowed?: number;
  joined_date?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  deactivated_at?: string;
  deactivation_reason?: string;
}

export interface CreateOfficerDto {
  badge_number: string;
  name: string;
  email: string;
  phone?: string;
  rank?: string;
  department?: string;
  station?: string;
  role?: 'ADMIN' | 'SENIOR_OFFICER' | 'OFFICER' | 'TRAINEE';
  permissions?: string[];
}

export interface UpdateOfficerDto {
  name?: string;
  email?: string;
  phone?: string;
  rank?: string;
  department?: string;
  station?: string;
  role?: string;
  permissions?: string[];
  max_cases_allowed?: number;
}

@Injectable()
export class OfficersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get all officers with optional status filter
   */
  async getOfficers(status?: string): Promise<Officer[]> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    let query = client.from('officers').select('*').order('name');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(
        `Failed to fetch officers: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    this.logger.log(`Fetched ${data?.length || 0} officers`, 'OfficersService');
    return data || [];
  }

  /**
   * Get a single officer by ID
   */
  async getOfficer(id: string): Promise<Officer | null> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('officers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.logger.error(
        `Failed to fetch officer: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    return data;
  }

  /**
   * Get officer by badge number
   */
  async getOfficerByBadge(badgeNumber: string): Promise<Officer | null> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('officers')
      .select('*')
      .eq('badge_number', badgeNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Create a new officer
   */
  async createOfficer(dto: CreateOfficerDto): Promise<Officer> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    // Check for duplicate badge number
    const existing = await this.getOfficerByBadge(dto.badge_number);
    if (existing) {
      throw new Error(`Officer with badge ${dto.badge_number} already exists`);
    }

    const officer = {
      badge_number: dto.badge_number,
      name: dto.name,
      email: dto.email,
      phone: dto.phone || null,
      rank: dto.rank || 'Constable',
      department: dto.department || 'Cyber Crime',
      station: dto.station || null,
      role: dto.role || 'OFFICER',
      status: 'ACTIVE',
      permissions: dto.permissions || ['view_cases', 'upload_data'],
    };

    const { data, error } = await client
      .from('officers')
      .insert(officer)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to create officer: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    this.logger.success(
      `Created officer: ${dto.name} (${dto.badge_number})`,
      'OfficersService',
    );
    return data;
  }

  /**
   * Update an officer
   */
  async updateOfficer(id: string, dto: UpdateOfficerDto): Promise<Officer> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('officers')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to update officer: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    this.logger.log(`Updated officer: ${id}`, 'OfficersService');
    return data;
  }

  /**
   * Deactivate an officer
   */
  async deactivateOfficer(id: string, reason: string): Promise<Officer> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('officers')
      .update({
        status: 'INACTIVE',
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to deactivate officer: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    this.logger.warn(
      `Deactivated officer: ${id} - Reason: ${reason}`,
      'OfficersService',
    );
    return data;
  }

  /**
   * Reactivate an officer
   */
  async reactivateOfficer(id: string): Promise<Officer> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('officers')
      .update({
        status: 'ACTIVE',
        deactivated_at: null,
        deactivation_reason: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to reactivate officer: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    this.logger.success(`Reactivated officer: ${id}`, 'OfficersService');
    return data;
  }

  /**
   * Delete an officer (hard delete - use with caution)
   */
  async deleteOfficer(id: string): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { error } = await client.from('officers').delete().eq('id', id);

    if (error) {
      this.logger.error(
        `Failed to delete officer: ${error.message}`,
        'OfficersService',
      );
      throw error;
    }

    this.logger.warn(`Deleted officer: ${id}`, 'OfficersService');
  }

  /**
   * Get officer statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    const officers = await this.getOfficers();

    const stats = {
      total: officers.length,
      active: officers.filter((o) => o.status === 'ACTIVE').length,
      inactive: officers.filter((o) => o.status !== 'ACTIVE').length,
      byRole: {} as Record<string, number>,
    };

    for (const officer of officers) {
      stats.byRole[officer.role] = (stats.byRole[officer.role] || 0) + 1;
    }

    return stats;
  }
}
