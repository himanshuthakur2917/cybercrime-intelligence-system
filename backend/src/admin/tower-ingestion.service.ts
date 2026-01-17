import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoggerService } from '../common/logger/logger.service';
import * as fs from 'fs';
import * as readline from 'readline';

interface CellTowerRow {
  cell_id: string;
  name: string;
  lat: number;
  lon: number;
  range_km: number;
  state?: string;
  city?: string;
  tower_type?: string;
  provider?: string;
}

interface RestrictedZoneRow {
  name: string;
  polygon_wkt: string;
}

@Injectable()
export class TowerIngestionService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Ingest cell towers from CSV file into Supabase (PostGIS)
   * Supports streaming for large files (850K+ records)
   */
  async ingestCellTowersFromFile(
    filePath: string,
  ): Promise<{ success: number; errors: number }> {
    if (!this.supabase.isConnected()) {
      throw new Error('Supabase not connected');
    }

    this.logger.log(
      `Starting cell tower ingestion from: ${filePath}`,
      'TowerIngestionService',
    );
    const startTime = Date.now();

    const stats = { success: 0, errors: 0 };
    const batchSize = 1000;
    let batch: CellTowerRow[] = [];
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
        const row = this.mapToTowerRow(headers, values);
        batch.push(row);

        if (batch.length >= batchSize) {
          const result = await this.insertBatch(batch);
          stats.success += result.success;
          stats.errors += result.errors;
          batch = [];

          if (stats.success % 10000 === 0) {
            this.logger.log(
              `Progress: ${stats.success.toLocaleString()} towers ingested`,
              'TowerIngestionService',
            );
          }
        }
      } catch (error) {
        stats.errors++;
        this.logger.warn(`Parse error: ${error}`, 'TowerIngestionService');
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const result = await this.insertBatch(batch);
      stats.success += result.success;
      stats.errors += result.errors;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    this.logger.success(
      `Ingestion complete: ${stats.success.toLocaleString()} towers in ${elapsed.toFixed(1)}s`,
      'TowerIngestionService',
    );

    return stats;
  }

  /**
   * Ingest cell towers from parsed CSV array
   */
  async ingestCellTowers(
    towers: CellTowerRow[],
  ): Promise<{ success: number; errors: number }> {
    if (!this.supabase.isConnected()) {
      throw new Error('Supabase not connected');
    }

    this.logger.log(
      `Ingesting ${towers.length} cell towers`,
      'TowerIngestionService',
    );
    const stats = { success: 0, errors: 0 };
    const batchSize = 100;

    for (let i = 0; i < towers.length; i += batchSize) {
      const batch = towers.slice(i, i + batchSize);
      const result = await this.insertBatch(batch);
      stats.success += result.success;
      stats.errors += result.errors;
    }

    this.logger.success(
      `Ingested ${stats.success} towers, ${stats.errors} errors`,
      'TowerIngestionService',
    );
    return stats;
  }

  /**
   * Ingest restricted zones from CSV file into Supabase (PostGIS)
   */
  async ingestRestrictedZonesFromFile(
    filePath: string,
  ): Promise<{ success: number; errors: number }> {
    if (!this.supabase.isConnected()) {
      throw new Error('Supabase not connected');
    }

    this.logger.log(
      `Starting restricted zones ingestion from: ${filePath}`,
      'TowerIngestionService',
    );
    const stats = { success: 0, errors: 0 };

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

    const zones: RestrictedZoneRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        zones.push({
          name: values[headers.indexOf('name')] || '',
          polygon_wkt: values[headers.indexOf('polygon_wkt')] || '',
        });
      } catch (error) {
        stats.errors++;
      }
    }

    try {
      const count = await this.supabase.insertRestrictedZones(zones);
      stats.success = count;
      this.logger.success(
        `Ingested ${count} restricted zones`,
        'TowerIngestionService',
      );
    } catch (error) {
      this.logger.error(
        `Zones ingestion error: ${error}`,
        'TowerIngestionService',
      );
      stats.errors = zones.length;
    }

    return stats;
  }

  /**
   * Insert a batch of towers into Supabase
   */
  private async insertBatch(
    batch: CellTowerRow[],
  ): Promise<{ success: number; errors: number }> {
    try {
      const count = await this.supabase.insertCellTowers(batch);
      return { success: count, errors: 0 };
    } catch (error) {
      this.logger.error(
        `Batch insert error: ${error}`,
        'TowerIngestionService',
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
   * Map parsed values to tower row object
   */
  private mapToTowerRow(headers: string[], values: string[]): CellTowerRow {
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? values[idx] : '';
    };

    return {
      cell_id: get('cell_id'),
      name: get('name'),
      lat: parseFloat(get('lat')) || 0,
      lon: parseFloat(get('lon')) || 0,
      range_km: parseFloat(get('range_km')) || 2.0,
      state: get('state') || undefined,
      city: get('city') || undefined,
      tower_type: get('tower_type') || undefined,
      provider: get('provider') || undefined,
    };
  }
}
