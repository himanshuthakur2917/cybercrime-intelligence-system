import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoggerService } from '../common/logger/logger.service';
import * as bcrypt from 'bcrypt';

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
  // User table fields
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  department?: string;

  // Officer fields
  badge_number: string;
  rank?: string;
  station?: string;
  role?: 'ADMIN' | 'SENIOR_OFFICER' | 'OFFICER' | 'TRAINEE';

  // Admin tracking
  created_by: string;
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
   * Create a new officer by inserting into users table
   * Database trigger automatically creates officer record
   */
  async createOfficer(dto: CreateOfficerDto): Promise<Officer> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    // Check for duplicate username
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('username', dto.username)
      .single();

    if (existingUser) {
      throw new Error(`Username ${dto.username} already exists`);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Insert into users table
    const { data: userData, error: userError } = await client
      .from('users')
      .insert({
        username: dto.username,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role: 'officer',
        department: dto.department || 'Cyber Crime',
        created_by: dto.created_by,
      })
      .select()
      .single();

    if (userError) {
      this.logger.error(
        `Failed to create user: ${userError.message}`,
        'OfficersService',
      );
      throw userError;
    }

    // Wait briefly for trigger to execute
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fetch the auto-created officer record
    const { data: officerData, error: officerError } = await client
      .from('officers')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (officerError) {
      this.logger.error(
        `Failed to fetch officer: ${officerError.message}`,
        'OfficersService',
      );
      throw officerError;
    }

    this.logger.success(`Created officer: ${dto.name}`, 'OfficersService');
    return officerData;
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
