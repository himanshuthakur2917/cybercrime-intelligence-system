import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { LoggerService } from '../common/logger/logger.service';
import { parse } from 'csv-parse';

export interface Suspect {
  phone: string;
  name: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alias: string;
  network_role: string;
  alt_phones?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARRESTED';
  last_activity?: string;
  known_associates?: string[];
  total_victim_contacts?: number;
}

export interface UploadResult {
  total: number;
  created: number;
  updated: number;
  errors: string[];
}

@Injectable()
export class SuspectsService {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Upload suspects from CSV file
   */
  async uploadSuspectsCSV(
    fileBuffer: Buffer,
    userId: string,
  ): Promise<UploadResult> {
    const result: UploadResult = {
      total: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    try {
      // Parse CSV using promise wrapper
      const records = await new Promise<any[]>((resolve, reject) => {
        parse(
          fileBuffer,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          },
          (error, output) => {
            if (error) reject(error);
            else resolve(output);
          },
        );
      });

      result.total = records.length;
      this.logger.log(
        `Parsing ${records.length} suspects from CSV`,
        'SuspectsService',
      );

      // Validate and prepare suspects
      const suspects: Suspect[] = [];
      for (const record of records) {
        try {
          const suspect = this.validateAndParseSuspect(record);
          suspects.push(suspect);
        } catch (err) {
          result.errors.push(
            `Row ${suspects.length + 1}: ${err instanceof Error ? err.message : 'Invalid data'}`,
          );
        }
      }

      // Process in batches of 100
      const batchSize = 100;
      for (let i = 0; i < suspects.length; i += batchSize) {
        const batch = suspects.slice(i, i + batchSize);
        const batchResult = await this.createOrUpdateSuspectsBatch(batch);
        result.created += batchResult.created;
        result.updated += batchResult.updated;
      }

      this.logger.success(
        `Uploaded ${result.created + result.updated} suspects (${result.created} new, ${result.updated} updated)`,
        'SuspectsService',
      );
    } catch (err) {
      this.logger.error(
        `Failed to upload suspects: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'SuspectsService',
      );
      throw err;
    }

    return result;
  }

  /**
   * Validate and parse suspect from CSV record
   */
  private validateAndParseSuspect(record: any): Suspect {
    if (!record.phone || !record.name) {
      throw new Error('Phone and name are required');
    }

    return {
      phone: record.phone.trim(),
      name: record.name.trim(),
      risk: (record.risk?.toUpperCase() || 'MEDIUM') as Suspect['risk'],
      alias: record.alias?.trim() || '',
      network_role: record.network_role?.toUpperCase() || 'UNKNOWN',
      alt_phones: record.alt_phones
        ? record.alt_phones.split('|').map((p: string) => p.trim())
        : [],
      status: (record.status?.toUpperCase() || 'ACTIVE') as Suspect['status'],
      last_activity: record.last_activity || null,
      known_associates: record.known_associates
        ? record.known_associates.split('|').map((p: string) => p.trim())
        : [],
      total_victim_contacts: parseInt(record.total_victim_contacts) || 0,
    };
  }

  /**
   * Create or update suspects in batch using Neo4j UNWIND
   */
  private async createOrUpdateSuspectsBatch(suspects: Suspect[]): Promise<{
    created: number;
    updated: number;
  }> {
    const session = this.neo4j.getSession();

    try {
      const query = `
        UNWIND $suspects as suspect
        MERGE (s:Suspect {phone: suspect.phone})
        ON CREATE SET
          s.name = suspect.name,
          s.risk = suspect.risk,
          s.alias = suspect.alias,
          s.network_role = suspect.network_role,
          s.alt_phones = suspect.alt_phones,
          s.status = suspect.status,
          s.last_activity = suspect.last_activity,
          s.known_associates = suspect.known_associates,
          s.total_victim_contacts = suspect.total_victim_contacts,
          s.created_at = datetime(),
          s.updated_at = datetime(),
          s.created = true
        ON MATCH SET
          s.name = suspect.name,
          s.risk = suspect.risk,
          s.alias = suspect.alias,
          s.network_role = suspect.network_role,
          s.alt_phones = suspect.alt_phones,
          s.status = suspect.status,
          s.last_activity = suspect.last_activity,
          s.known_associates = suspect.known_associates,
          s.total_victim_contacts = suspect.total_victim_contacts,
          s.updated_at = datetime(),
          s.created = false
        RETURN s.phone, s.created
      `;

      const result = await session.run(query, { suspects });

      const created = result.records.filter((r) => r.get('s.created')).length;
      const updated = result.records.length - created;

      return { created, updated };
    } finally {
      await session.close();
    }
  }

  /**
   * Get all suspects with optional filters
   */
  async getSuspects(filters?: {
    risk?: string;
    status?: string;
    network_role?: string;
  }): Promise<Suspect[]> {
    const session = this.neo4j.getSession();

    try {
      let query = 'MATCH (s:Suspect) WHERE 1=1';
      const params: any = {};

      if (filters?.risk) {
        query += ' AND s.risk = $risk';
        params.risk = filters.risk;
      }
      if (filters?.status) {
        query += ' AND s.status = $status';
        params.status = filters.status;
      }
      if (filters?.network_role) {
        query += ' AND s.network_role = $network_role';
        params.network_role = filters.network_role;
      }

      query +=
        ' RETURN s ORDER BY s.risk DESC, s.total_victim_contacts DESC LIMIT 1000';

      const result = await session.run(query, params);

      return result.records.map((record) => {
        const s = record.get('s').properties;
        return {
          phone: s.phone,
          name: s.name,
          risk: s.risk,
          alias: s.alias,
          network_role: s.network_role,
          alt_phones: s.alt_phones || [],
          status: s.status,
          last_activity: s.last_activity,
          known_associates: s.known_associates || [],
          total_victim_contacts: s.total_victim_contacts || 0,
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get suspect by phone number
   */
  async getSuspect(phone: string): Promise<Suspect | null> {
    const session = this.neo4j.getSession();

    try {
      const result = await session.run(
        'MATCH (s:Suspect {phone: $phone}) RETURN s',
        { phone },
      );

      if (result.records.length === 0) {
        return null;
      }

      const s = result.records[0].get('s').properties;
      return {
        phone: s.phone,
        name: s.name,
        risk: s.risk,
        alias: s.alias,
        network_role: s.network_role,
        alt_phones: s.alt_phones || [],
        status: s.status,
        last_activity: s.last_activity,
        known_associates: s.known_associates || [],
        total_victim_contacts: s.total_victim_contacts || 0,
      };
    } finally {
      await session.close();
    }
  }
}
