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
        const row: SuspectRow = {
          phone: values[headers.indexOf('phone')] || '',
          name: values[headers.indexOf('name')] || '',
          risk: values[headers.indexOf('risk')] || 'MEDIUM',
          alias: values[headers.indexOf('alias')] || undefined,
          network_role: values[headers.indexOf('network_role')] || undefined,
        };
        batch.push(row);

        if (batch.length >= batchSize) {
          const result = await this.insertSuspectBatch(batch);
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];
        }
      } catch (error) {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertSuspectBatch(batch);
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
        const row: VictimRow = {
          phone: values[headers.indexOf('phone')] || '',
          name: values[headers.indexOf('name')] || '',
          reported_loss:
            parseFloat(values[headers.indexOf('reported_loss')]) || 0,
          complaint_date: values[headers.indexOf('complaint_date')] || '',
        };
        batch.push(row);

        if (batch.length >= batchSize) {
          const result = await this.insertVictimBatch(batch);
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];
        }
      } catch (error) {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertVictimBatch(batch);
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
        const row: CDRRow = {
          caller_phone: values[headers.indexOf('caller_phone')] || '',
          callee_phone: values[headers.indexOf('callee_phone')] || '',
          timestamp: values[headers.indexOf('timestamp')] || '',
          duration_sec: parseInt(values[headers.indexOf('duration_sec')]) || 0,
          lat: parseFloat(values[headers.indexOf('lat')]) || 0,
          lon: parseFloat(values[headers.indexOf('lon')]) || 0,
          cell_tower_id: values[headers.indexOf('cell_tower_id')] || '',
        };
        batch.push(row);

        if (batch.length >= batchSize) {
          const result = await this.insertCDRBatch(batch);
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
      } catch (error) {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertCDRBatch(batch);
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
        const row: TransactionRow = {
          from_phone: values[headers.indexOf('from_phone')] || '',
          to_phone: values[headers.indexOf('to_phone')] || '',
          amount: parseFloat(values[headers.indexOf('amount')]) || 0,
          timestamp: values[headers.indexOf('timestamp')] || '',
          type: values[headers.indexOf('type')] || 'UPI',
          suspicious_score:
            parseFloat(values[headers.indexOf('suspicious_score')]) || 0,
        };
        batch.push(row);

        if (batch.length >= batchSize) {
          const result = await this.insertTransactionBatch(batch);
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
      } catch (error) {
        stats.errors++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertTransactionBatch(batch);
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
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (s:GlobalSuspect {phone: row.phone})
        SET s.name = row.name,
            s.risk = row.risk,
            s.alias = row.alias,
            s.network_role = row.network_role,
            s.updatedAt = datetime()
        `,
        { batch },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Suspect batch error: ${error}`,
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
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (v:Victim {phone: row.phone})
        SET v.name = row.name,
            v.reported_loss = row.reported_loss,
            v.complaint_date = row.complaint_date,
            v.updatedAt = datetime()
        `,
        { batch },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Victim batch error: ${error}`,
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
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (caller:Phone {number: row.caller_phone})
        MERGE (callee:Phone {number: row.callee_phone})
        CREATE (caller)-[r:CALLED {
          timestamp: datetime(row.timestamp),
          duration_sec: row.duration_sec,
          location: point({latitude: row.lat, longitude: row.lon}),
          cell_tower_id: row.cell_tower_id
        }]->(callee)
        `,
        { batch },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(`CDR batch error: ${error}`, 'SuspectIngestionService');
      return { success: 0, errors: batch.length };
    }
  }

  /**
   * Insert batch of transactions into Neo4j
   * Creates Account nodes and TRANSFERRED relationships
   */
  private async insertTransactionBatch(
    batch: TransactionRow[],
  ): Promise<{ success: number; errors: number }> {
    try {
      await this.neo4j.writeCypher(
        `
        UNWIND $batch AS row
        MERGE (from:Account {phone: row.from_phone})
        MERGE (to:Account {phone: row.to_phone})
        CREATE (from)-[r:TRANSFERRED {
          amount: row.amount,
          timestamp: datetime(row.timestamp),
          type: row.type,
          suspicious_score: row.suspicious_score
        }]->(to)
        `,
        { batch },
      );
      return { success: batch.length, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Transaction batch error: ${error}`,
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
}
