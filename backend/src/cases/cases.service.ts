import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoggerService } from '../common/logger/logger.service';

export type CaseStatus =
  | 'pending'
  | 'assigned'
  | 'under_investigation'
  | 'verified'
  | 'closed'
  | 'archived';

export type CasePriority = 'critical' | 'high' | 'medium' | 'low';

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  status: CaseStatus;
  priority: CasePriority;
  created_by: string;
  assigned_to?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseNote {
  id: string;
  case_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CaseWithNotes extends Case {
  notes: CaseNote[];
  created_by_name?: string;
  assigned_to_name?: string;
}

export interface CreateCaseDto {
  title: string;
  description?: string;
  priority?: CasePriority;
  created_by: string;
}

export interface UpdateCaseDto {
  title?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  assigned_to?: string;
}

export interface AssignCaseDto {
  officer_id: string;
}

export interface AddNoteDto {
  user_id: string;
  content: string;
}

@Injectable()
export class CasesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  async getCases(status?: CaseStatus, createdBy?: string): Promise<Case[]> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    let query = client
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(
        `Failed to fetch cases: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    this.logger.log(`Fetched ${data?.length || 0} cases`, 'CasesService');
    return data || [];
  }

  async getCase(id: string): Promise<CaseWithNotes | null> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    // Fetch case with user details
    const { data: caseData, error: caseError } = await client
      .from('cases')
      .select(
        `
        *,
        created_by_user:users!cases_created_by_fkey(name),
        assigned_to_user:users!cases_assigned_to_fkey(name)
      `,
      )
      .eq('id', id)
      .single();

    if (caseError) {
      if (caseError.code === 'PGRST116') {
        return null;
      }
      this.logger.error(
        `Failed to fetch case: ${caseError.message}`,
        'CasesService',
      );
      throw caseError;
    }

    // Fetch notes
    const { data: notes, error: notesError } = await client
      .from('case_notes')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: true });

    if (notesError) {
      this.logger.error(
        `Failed to fetch case notes: ${notesError.message}`,
        'CasesService',
      );
      throw notesError;
    }

    return {
      ...caseData,
      notes: notes || [],
      created_by_name: caseData.created_by_user?.name,
      assigned_to_name: caseData.assigned_to_user?.name,
    };
  }

  async createCase(dto: CreateCaseDto): Promise<Case> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    // Generate case number using database function
    const { data: caseNumberData, error: caseNumberError } = await client.rpc(
      'generate_case_number',
    );

    if (caseNumberError) {
      this.logger.error(
        `Failed to generate case number: ${caseNumberError.message}`,
        'CasesService',
      );
      throw caseNumberError;
    }

    const caseNumber = caseNumberData;

    const newCase = {
      case_number: caseNumber,
      title: dto.title,
      description: dto.description || null,
      priority: dto.priority || 'medium',
      status: 'pending',
      created_by: dto.created_by,
      is_verified: false,
    };

    const { data, error } = await client
      .from('cases')
      .insert(newCase)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to create case: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    this.logger.success(
      `Created case: ${caseNumber} - ${dto.title}`,
      'CasesService',
    );
    return data;
  }

  async updateCase(id: string, dto: UpdateCaseDto): Promise<Case> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('cases')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to update case: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    this.logger.log(`Updated case: ${id}`, 'CasesService');
    return data;
  }

  async assignCase(id: string, officerId: string): Promise<Case> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('cases')
      .update({
        assigned_to: officerId,
        status: 'assigned',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to assign case: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    this.logger.log(
      `Assigned case ${id} to officer ${officerId}`,
      'CasesService',
    );
    return data;
  }

  async verifyCase(id: string, userId: string): Promise<Case> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('cases')
      .update({
        is_verified: true,
        verified_by: userId,
        verified_at: new Date().toISOString(),
        status: 'verified',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to verify case: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    this.logger.success(`Verified case: ${id}`, 'CasesService');
    return data;
  }

  async deleteCase(id: string): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { error } = await client.from('cases').delete().eq('id', id);

    if (error) {
      this.logger.error(
        `Failed to delete case: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    this.logger.warn(`Deleted case: ${id}`, 'CasesService');
  }

  async addNote(
    caseId: string,
    userId: string,
    content: string,
  ): Promise<CaseNote> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('case_notes')
      .insert({
        case_id: caseId,
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to add note: ${error.message}`, 'CasesService');
      throw error;
    }

    this.logger.log(`Added note to case: ${caseId}`, 'CasesService');
    return data;
  }

  async getNotes(caseId: string): Promise<CaseNote[]> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new Error('Supabase not connected');
    }

    const { data, error } = await client
      .from('case_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(
        `Failed to fetch notes: ${error.message}`,
        'CasesService',
      );
      throw error;
    }

    return data || [];
  }
}
