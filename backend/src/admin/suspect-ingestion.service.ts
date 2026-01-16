import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { LoggerService } from '../common/logger/logger.service';
import * as fs from 'fs';
import * as readline from 'readline';

interface SuspectRow {
  phone: string;
  name: string;
  risk: string;
  alias?: string;
  network_role?: string;
}

interface VictimRow {
  phone: string;
  name: string;
  reported_loss: number;
  complaint_date: string;
}

interface CDRRow {
  caller_phone: string;
  callee_phone: string;
  timestamp: string;
  duration_sec: number;
  lat: number;
  lon: number;
  cell_tower_id: string;
}

interface TransactionRow {
  from_phone: string;
  to_phone: string;
  amount: number;
  timestamp: string;
  type: string;
  suspicious_score: number;
}

@Injectable()
export class SuspectIngestionService {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Ingest suspects from CSV file into Neo4j
   */
  async ingestSuspectsFromFile(
    filePath: string,
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    this.logger.log(
      `Starting suspect ingestion from: ${filePath}`,
      'SuspectIngestionService',
    );
    const startTime = Date.now();

    const stats = { success: 0, errors: 0 };
    const batchSize = 100;
    let batch: SuspectRow[] = [];
    let isHeader = true;
    let headers: string[] = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (isHeader) {
        headers = line.split(',').map((h) => h.trim());
        isHeader = false;
        continue;
      }

      try {
        const values = this.parseCSVLine(line);
        const get = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.indexOf(k);
            if (idx >= 0) return values[idx];
          }
          return '';
        };

        const row: SuspectRow = {
          phone: get(['phone', 'phone_number', 'mobile']),
          name: get(['name', 'suspect_name', 'full_name']),
          risk: get(['risk', 'risk_level', 'threat_score']) || 'MEDIUM',
          alias: get(['alias', 'alias_name']) || undefined,
          network_role: get(['network_role', 'role']) || undefined,
        };

        if (row.phone) {
          batch.push(row);
        }

        if (batch.length >= batchSize) {
          const result = await this.insertSuspectBatch(batch, investigationId);
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];
        }
      } catch {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertSuspectBatch(batch, investigationId);
      stats.success += result.success;
      stats.errors += result.errors;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    this.logger.success(
      `Suspect ingestion complete: ${stats.success} suspects in ${elapsed.toFixed(1)}s`,
      'SuspectIngestionService',
    );

    return stats;
  }

  /**
   * Ingest victims from CSV file into Neo4j
   */
  async ingestVictimsFromFile(
    filePath: string,
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    this.logger.log(
      `Starting victim ingestion from: ${filePath}`,
      'SuspectIngestionService',
    );
    const startTime = Date.now();

    const stats = { success: 0, errors: 0 };
    const batchSize = 100;
    let batch: VictimRow[] = [];
    let isHeader = true;
    let headers: string[] = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (isHeader) {
        headers = line.split(',').map((h) => h.trim());
        isHeader = false;
        continue;
      }

      try {
        const values = this.parseCSVLine(line);
        const get = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.indexOf(k);
            if (idx >= 0) return values[idx];
          }
          return '';
        };

        const row: VictimRow = {
          phone: get(['phone', 'phone_number', 'victim_phone']),
          name: get(['name', 'victim_name', 'full_name']),
          reported_loss:
            parseFloat(get(['reported_loss', 'loss', 'amount'])) || 0,
          complaint_date: get(['complaint_date', 'date', 'fir_date']),
        };

        if (row.phone) {
          batch.push(row);
        }

        if (batch.length >= batchSize) {
          const result = await this.insertVictimBatch(batch, investigationId);
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];
        }
      } catch {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertVictimBatch(batch, investigationId);
      stats.success += result.success;
      stats.errors += result.errors;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    this.logger.success(
      `Victim ingestion complete: ${stats.success} victims in ${elapsed.toFixed(1)}s`,
      'SuspectIngestionService',
    );

    return stats;
  }

  /**
   * Ingest CDR records from CSV file into Neo4j
   * Creates relationships between phone numbers
   */
  async ingestCDRFromFile(
    filePath: string,
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    this.logger.log(
      `Starting CDR ingestion from: ${filePath}`,
      'SuspectIngestionService',
    );
    const startTime = Date.now();

    const stats = { success: 0, errors: 0 };
    const batchSize = 500;
    let batch: CDRRow[] = [];
    let isHeader = true;
    let headers: string[] = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (isHeader) {
        headers = line.split(',').map((h) => h.trim());
        isHeader = false;
        continue;
      }

      try {
        const values = this.parseCSVLine(line);
        const get = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.indexOf(k);
            if (idx >= 0) return values[idx];
          }
          return '';
        };

        const timestamp = this.extractTimestamp(headers, values);

        const row: CDRRow = {
          caller_phone: get(['caller_phone', 'caller', 'from_phone']),
          callee_phone: get(['callee_phone', 'callee', 'to_phone']),
          timestamp: timestamp,
          duration_sec: parseInt(get(['duration_sec', 'duration', 'sec'])) || 0,
          lat: parseFloat(get(['lat', 'latitude'])) || 0,
          lon: parseFloat(get(['lon', 'longitude'])) || 0,
          cell_tower_id: get(['cell_tower_id', 'tower_id', 'cid']),
        };

        if (row.caller_phone && row.callee_phone) {
          batch.push(row);
        }

        if (batch.length >= batchSize) {
          const result = await this.insertCDRBatch(batch, investigationId);
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];

          if (stats.success % 10000 === 0) {
            this.logger.log(
              `CDR Progress: ${stats.success.toLocaleString()} records`,
              'SuspectIngestionService',
            );
          }
        }
      } catch {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertCDRBatch(batch, investigationId);
      stats.success += result.success;
      stats.errors += result.errors;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    this.logger.success(
      `CDR ingestion complete: ${stats.success.toLocaleString()} records in ${elapsed.toFixed(1)}s`,
      'SuspectIngestionService',
    );

    return stats;
  }

  /**
   * Ingest transactions from CSV file into Neo4j
   */
  async ingestTransactionsFromFile(
    filePath: string,
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    this.logger.log(
      `Starting transaction ingestion from: ${filePath}`,
      'SuspectIngestionService',
    );
    const startTime = Date.now();

    const stats = { success: 0, errors: 0 };
    const batchSize = 500;
    let batch: TransactionRow[] = [];
    let isHeader = true;
    let headers: string[] = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (isHeader) {
        headers = line.split(',').map((h) => h.trim());
        isHeader = false;
        continue;
      }

      try {
        const values = this.parseCSVLine(line);
        const get = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.indexOf(k);
            if (idx >= 0) return values[idx];
          }
          return '';
        };

        const timestamp = this.extractTimestamp(headers, values);

        const row: TransactionRow = {
          from_phone: get([
            'from_phone',
            'victim_account',
            'sender_account',
            'from_account',
          ]),
          to_phone: get([
            'to_phone',
            'beneficiary_account',
            'receiver_account',
            'to_account',
          ]),
          amount: parseFloat(get(['amount', 'txn_amount', 'value'])) || 0,
          timestamp: timestamp,
          type: get(['type', 'mode', 'txn_type']) || 'UPI',
          suspicious_score:
            parseFloat(get(['suspicious_score', 'risk_score'])) ||
            (get(['fraud_flag', 'is_fraud']) === 'TRUE' ? 1.0 : 0.1),
        };

        if (row.from_phone && row.to_phone) {
          batch.push(row);
        }

        if (batch.length >= batchSize) {
          const result = await this.insertTransactionBatch(
            batch,
            investigationId,
          );
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];

          if (stats.success % 10000 === 0) {
            this.logger.log(
              `Transaction Progress: ${stats.success.toLocaleString()} records`,
              'SuspectIngestionService',
            );
          }
        }
      } catch {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertTransactionBatch(batch, investigationId);
      stats.success += result.success;
      stats.errors += result.errors;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    this.logger.success(
      `Transaction ingestion complete: ${stats.success.toLocaleString()} records in ${elapsed.toFixed(1)}s`,
      'SuspectIngestionService',
    );

    return stats;
  }

  /**
   * Insert batch of suspects into Neo4j
   */
  private async insertSuspectBatch(
    batch: SuspectRow[],
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (s:Suspect {id: 'suspect_' + row.phone})
        SET s.phone = row.phone,
            s.name = row.name,
            s.riskScore = row.risk,
            s.aliasNames = row.alias,
            s.networkRole = row.network_role,
            s.status = 'ACTIVE',
            s.updatedAt = datetime()
        
        // Ensure GlobalSuspect label for cross-investigation tracking
        SET s:GlobalSuspect
        
        // Link to Phone node
        MERGE (p:Phone {number: row.phone})
        MERGE (s)-[:HAS_PHONE]->(p)
        
        WITH s, row
        WHERE $investigationId IS NOT NULL
        MERGE (i:Investigation {id: $investigationId})
        MERGE (i)-[:CONTAINS]->(s)
        `,
        { batch, investigationId: investigationId || null },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Suspect batch error: ${String(error instanceof Error ? error.message : error)}`,
        'SuspectIngestionService',
      );
      return { success: 0, errors: batch.length };
    }
  }

  /**
   * Insert batch of victims into Neo4j
   */
  private async insertVictimBatch(
    batch: VictimRow[],
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (v:Victim {victimId: 'victim_' + row.phone})
        SET v.phone = row.phone,
            v.name = row.name,
            v.totalAmountLost = row.reported_loss,
            v.complaint_date = row.complaint_date,
            v.updatedAt = datetime()
        
        // Link to Phone node
        MERGE (p:Phone {number: row.phone})
        MERGE (v)-[:HAS_PHONE]->(p)
        
        // Create a mirror Suspect node for relationship analysis
        MERGE (s:Suspect {id: 'suspect_' + row.phone})
        SET s.phone = row.phone,
            s.name = row.name,
            s.status = 'VICTIM',
            s.isVictim = true
        MERGE (s)-[:HAS_PHONE]->(p)
        
        WITH v, s, row
        WHERE $investigationId IS NOT NULL
        MERGE (i:Investigation {id: $investigationId})
        MERGE (i)-[:HAS_VICTIM]->(v)
        MERGE (i)-[:CONTAINS]->(s)
        `,
        { batch, investigationId: investigationId || null },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Victim batch error: ${String(error instanceof Error ? error.message : error)}`,
        'SuspectIngestionService',
      );
      return { success: 0, errors: batch.length };
    }
  }

  /**
   * Insert batch of CDR records into Neo4j
   * Creates Phone nodes and CALLED relationships with location data
   */
  private async insertCDRBatch(
    batch: CDRRow[],
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (caller_p:Phone {number: row.caller_phone})
        MERGE (callee_p:Phone {number: row.callee_phone})
        
        // Link Phone nodes to Phone nodes with CALLED relationship
        CREATE (caller_p)-[r:CALLED {
          timestamp: CASE WHEN row.timestamp <> "" THEN datetime(row.timestamp) ELSE datetime() END,
          duration_sec: row.duration_sec,
          location: point({latitude: row.lat, longitude: row.lon}),
          cell_tower_id: row.cell_tower_id
        }]->(callee_p)
        
        // Also find related suspects and create CDR_CALL for map visualization
        WITH caller_p, callee_p, row, r
        OPTIONAL MATCH (s_caller:Suspect)-[:HAS_PHONE]->(caller_p)
        OPTIONAL MATCH (s_callee:Suspect)-[:HAS_PHONE]->(callee_p)
        
        WITH s_caller, s_callee, row, r, caller_p, callee_p
        WHERE s_caller IS NOT NULL AND s_callee IS NOT NULL
        CREATE (s_caller)-[cdr:CDR_CALL {
          callId: 'cdr_' + toString(id(r)),
          callerTowerId: row.cell_tower_id,
          callStartTime: toString(r.timestamp),
          duration: row.duration_sec,
          approximateDistanceKm: 0.5, // Mock distance
          proximityPattern: 'NEAR'
        }]->(s_callee)
        
        WITH caller_p, callee_p, row
        WHERE $investigationId IS NOT NULL
        MERGE (i:Investigation {id: $investigationId})
        MERGE (i)-[:HAS_PHONE]->(caller_p)
        MERGE (i)-[:HAS_PHONE]->(callee_p)
        `,
        { batch, investigationId: investigationId || null },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `CDR batch error: ${String(error instanceof Error ? error.message : error)}`,
        'SuspectIngestionService',
      );
      return { success: 0, errors: batch.length };
    }
  }

  /**
   * Insert batch of transactions into Neo4j
   * Creates Account nodes and TRANSFERRED relationships
   */
  private async insertTransactionBatch(
    batch: TransactionRow[],
    investigationId?: string,
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (from_a:Account {phone: row.from_phone})
        MERGE (to_a:Account {phone: row.to_phone})
        
        // Relationship between accounts
        CREATE (from_a)-[r:TRANSFERRED {
          amount: row.amount,
          timestamp: CASE WHEN row.timestamp <> "" THEN datetime(row.timestamp) ELSE datetime() END,
          type: row.type,
          suspicious_score: row.suspicious_score
        }]->(to_a)
        
        // Find suspects/victims linked to these phones
        WITH from_a, to_a, row, r
        OPTIONAL MATCH (s_from:Suspect {phone: row.from_phone})
        OPTIONAL MATCH (s_to:Suspect {phone: row.to_phone})
        
        WITH s_from, s_to, row, r, from_a, to_a
        WHERE s_from IS NOT NULL AND s_to IS NOT NULL
        CREATE (s_from)-[t:TRANSACTION {
          amount: row.amount,
          date: toString(r.timestamp),
          suspiciousScore: row.suspicious_score,
          transactionType: row.type
        }]->(s_to)
        
        WITH from_a, to_a, row
        WHERE $investigationId IS NOT NULL
        MERGE (i:Investigation {id: $investigationId})
        MERGE (i)-[:HAS_ACCOUNT]->(from_a)
        MERGE (i)-[:HAS_ACCOUNT]->(to_a)
        MERGE (i)-[:CONTAINS]->(from_a)
        MERGE (i)-[:CONTAINS]->(to_a)
        `,
        { batch, investigationId: investigationId || null },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Transaction batch error: ${String(error instanceof Error ? error.message : error)}`,
        'SuspectIngestionService',
      );
      return { success: 0, errors: batch.length };
    }
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Helper to extract timestamp from various CSV column formats
   */
  private extractTimestamp(headers: string[], values: string[]): string {
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? values[idx].trim() : '';
    };

    // 1. Direct timestamp
    const ts = get('timestamp') || get('datetime');
    if (ts) return ts;

    // 2. Date and Time separately
    const date = get('date');
    const time = get('time');
    if (date && time) {
      // Handle "2025-12-17" and "14:23:45"
      return `${date}T${time}`;
    }
    if (date) return date;

    return '';
  }
}
