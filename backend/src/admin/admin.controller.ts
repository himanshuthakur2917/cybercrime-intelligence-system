import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TowerIngestionService } from './tower-ingestion.service';
import { SuspectIngestionService } from './suspect-ingestion.service';
import { LoggerService } from '../common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface IngestionResult {
  success: number;
  errors: number;
  message: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly towerIngestion: TowerIngestionService,
    private readonly suspectIngestion: SuspectIngestionService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * POST /admin/ingest/towers
   * Upload cell towers CSV to Supabase (PostGIS)
   */
  @Post('ingest/towers')
  @UseInterceptors(FileInterceptor('file'))
  async ingestTowers(
    @UploadedFile() file: Express.Multer.File,
    @Body('filePath') filePath?: string,
  ): Promise<IngestionResult> {
    this.logger.log('Tower ingestion request received', 'AdminController');

    try {
      let csvPath: string;
      let tempCreated = false;

      if (file) {
        // File uploaded via multipart
        csvPath = path.join(os.tmpdir(), `towers_${Date.now()}.csv`);
        fs.writeFileSync(csvPath, file.buffer);
        tempCreated = true;
      } else if (filePath) {
        // File path provided (for local ingestion)
        csvPath = filePath;
      } else {
        throw new HttpException(
          'No file or filePath provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result =
        await this.towerIngestion.ingestCellTowersFromFile(csvPath);

      // Cleanup temp file
      if (tempCreated) {
        fs.unlinkSync(csvPath);
      }

      return {
        ...result,
        message: `Successfully ingested ${result.success.toLocaleString()} towers with ${result.errors} errors`,
      };
    } catch (error) {
      this.logger.error(`Tower ingestion failed: ${error}`, 'AdminController');
      throw new HttpException(
        `Ingestion failed: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /admin/ingest/zones
   * Upload restricted zones CSV to Supabase (PostGIS)
   */
  @Post('ingest/zones')
  @UseInterceptors(FileInterceptor('file'))
  async ingestZones(
    @UploadedFile() file: Express.Multer.File,
    @Body('filePath') filePath?: string,
  ): Promise<IngestionResult> {
    this.logger.log('Zones ingestion request received', 'AdminController');

    try {
      let csvPath: string;
      let tempCreated = false;

      if (file) {
        csvPath = path.join(os.tmpdir(), `zones_${Date.now()}.csv`);
        fs.writeFileSync(csvPath, file.buffer);
        tempCreated = true;
      } else if (filePath) {
        csvPath = filePath;
      } else {
        throw new HttpException(
          'No file or filePath provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result =
        await this.towerIngestion.ingestRestrictedZonesFromFile(csvPath);

      if (tempCreated) {
        fs.unlinkSync(csvPath);
      }

      return {
        ...result,
        message: `Successfully ingested ${result.success} restricted zones`,
      };
    } catch (error) {
      this.logger.error(`Zones ingestion failed: ${error}`, 'AdminController');
      throw new HttpException(
        `Ingestion failed: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /admin/ingest/suspects
   * Upload suspects CSV to Neo4j
   */
  @Post('ingest/suspects')
  @UseInterceptors(FileInterceptor('file'))
  async ingestSuspects(
    @UploadedFile() file: Express.Multer.File,
    @Body('filePath') filePath?: string,
    @Body('investigationId') investigationId?: string,
  ): Promise<IngestionResult> {
    this.logger.log('Suspects ingestion request received', 'AdminController');

    try {
      let csvPath: string;
      let tempCreated = false;

      if (file) {
        csvPath = path.join(os.tmpdir(), `suspects_${Date.now()}.csv`);
        fs.writeFileSync(csvPath, file.buffer);
        tempCreated = true;
      } else if (filePath) {
        csvPath = filePath;
      } else {
        throw new HttpException(
          'No file or filePath provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.suspectIngestion.ingestSuspectsFromFile(
        csvPath,
        investigationId,
      );

      if (tempCreated) {
        fs.unlinkSync(csvPath);
      }

      return {
        ...result,
        message: `Successfully ingested ${result.success} suspects`,
      };
    } catch (error) {
      this.logger.error(
        `Suspects ingestion failed: ${error}`,
        'AdminController',
      );
      throw new HttpException(
        `Ingestion failed: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /admin/ingest/victims
   * Upload victims CSV to Neo4j
   */
  @Post('ingest/victims')
  @UseInterceptors(FileInterceptor('file'))
  async ingestVictims(
    @UploadedFile() file: Express.Multer.File,
    @Body('filePath') filePath?: string,
    @Body('investigationId') investigationId?: string,
  ): Promise<IngestionResult> {
    this.logger.log('Victims ingestion request received', 'AdminController');

    try {
      let csvPath: string;
      let tempCreated = false;

      if (file) {
        csvPath = path.join(os.tmpdir(), `victims_${Date.now()}.csv`);
        fs.writeFileSync(csvPath, file.buffer);
        tempCreated = true;
      } else if (filePath) {
        csvPath = filePath;
      } else {
        throw new HttpException(
          'No file or filePath provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.suspectIngestion.ingestVictimsFromFile(
        csvPath,
        investigationId,
      );

      if (tempCreated) {
        fs.unlinkSync(csvPath);
      }

      return {
        ...result,
        message: `Successfully ingested ${result.success} victims`,
      };
    } catch (error) {
      this.logger.error(
        `Victims ingestion failed: ${error}`,
        'AdminController',
      );
      throw new HttpException(
        `Ingestion failed: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /admin/ingest/cdr
   * Upload CDR CSV to Neo4j
   */
  @Post('ingest/cdr')
  @UseInterceptors(FileInterceptor('file'))
  async ingestCDR(
    @UploadedFile() file: Express.Multer.File,
    @Body('filePath') filePath?: string,
    @Body('investigationId') investigationId?: string,
  ): Promise<IngestionResult> {
    this.logger.log('CDR ingestion request received', 'AdminController');

    try {
      let csvPath: string;
      let tempCreated = false;

      if (file) {
        csvPath = path.join(os.tmpdir(), `cdr_${Date.now()}.csv`);
        fs.writeFileSync(csvPath, file.buffer);
        tempCreated = true;
      } else if (filePath) {
        csvPath = filePath;
      } else {
        throw new HttpException(
          'No file or filePath provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.suspectIngestion.ingestCDRFromFile(
        csvPath,
        investigationId,
      );

      if (tempCreated) {
        fs.unlinkSync(csvPath);
      }

      return {
        ...result,
        message: `Successfully ingested ${result.success.toLocaleString()} CDR records`,
      };
    } catch (error) {
      this.logger.error(`CDR ingestion failed: ${error}`, 'AdminController');
      throw new HttpException(
        `Ingestion failed: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /admin/ingest/transactions
   * Upload transactions CSV to Neo4j
   */
  @Post('ingest/transactions')
  @UseInterceptors(FileInterceptor('file'))
  async ingestTransactions(
    @UploadedFile() file: Express.Multer.File,
    @Body('filePath') filePath?: string,
    @Body('investigationId') investigationId?: string,
  ): Promise<IngestionResult> {
    this.logger.log(
      'Transactions ingestion request received',
      'AdminController',
    );

    try {
      let csvPath: string;
      let tempCreated = false;

      if (file) {
        csvPath = path.join(os.tmpdir(), `transactions_${Date.now()}.csv`);
        fs.writeFileSync(csvPath, file.buffer);
        tempCreated = true;
      } else if (filePath) {
        csvPath = filePath;
      } else {
        throw new HttpException(
          'No file or filePath provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.suspectIngestion.ingestTransactionsFromFile(
        csvPath,
        investigationId,
      );

      if (tempCreated) {
        fs.unlinkSync(csvPath);
      }

      return {
        ...result,
        message: `Successfully ingested ${result.success.toLocaleString()} transactions`,
      };
    } catch (error) {
      this.logger.error(
        `Transactions ingestion failed: ${error}`,
        'AdminController',
      );
      throw new HttpException(
        `Ingestion failed: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /admin/ingest/v3
   * Ingest all v3 mock data files at once
   */
  @Post('ingest/v3')
  async ingestV3MockData(@Body('basePath') basePath?: string): Promise<{
    towers: IngestionResult;
    zones: IngestionResult;
    suspects: IngestionResult;
    victims: IngestionResult;
    cdr: IngestionResult;
    transactions: IngestionResult;
  }> {
    const dataPath =
      basePath || path.resolve(__dirname, '../../../mock-data/v3');
    this.logger.log(
      `Starting v3 mock data ingestion from: ${dataPath}`,
      'AdminController',
    );

    const results = {
      towers: { success: 0, errors: 0, message: '' },
      zones: { success: 0, errors: 0, message: '' },
      suspects: { success: 0, errors: 0, message: '' },
      victims: { success: 0, errors: 0, message: '' },
      cdr: { success: 0, errors: 0, message: '' },
      transactions: { success: 0, errors: 0, message: '' },
    };

    // Ingest cell towers (850K)
    try {
      const r = await this.towerIngestion.ingestCellTowersFromFile(
        path.join(dataPath, 'cell_towers.csv'),
      );
      results.towers = {
        ...r,
        message: `Ingested ${r.success.toLocaleString()} towers`,
      };
    } catch (error) {
      results.towers.message = `Failed: ${error}`;
    }

    // Ingest restricted zones
    try {
      const r = await this.towerIngestion.ingestRestrictedZonesFromFile(
        path.join(dataPath, 'restricted_zones.csv'),
      );
      results.zones = { ...r, message: `Ingested ${r.success} zones` };
    } catch (error) {
      results.zones.message = `Failed: ${error}`;
    }

    // Ingest suspects
    try {
      const r = await this.suspectIngestion.ingestSuspectsFromFile(
        path.join(dataPath, 'suspects.csv'),
      );
      results.suspects = { ...r, message: `Ingested ${r.success} suspects` };
    } catch (error) {
      results.suspects.message = `Failed: ${error}`;
    }

    // Ingest victims
    try {
      const r = await this.suspectIngestion.ingestVictimsFromFile(
        path.join(dataPath, 'victims.csv'),
      );
      results.victims = { ...r, message: `Ingested ${r.success} victims` };
    } catch (error) {
      results.victims.message = `Failed: ${error}`;
    }

    // Ingest CDR
    try {
      const r = await this.suspectIngestion.ingestCDRFromFile(
        path.join(dataPath, 'cdr.csv'),
      );
      results.cdr = {
        ...r,
        message: `Ingested ${r.success.toLocaleString()} CDR records`,
      };
    } catch (error) {
      results.cdr.message = `Failed: ${error}`;
    }

    // Ingest transactions
    try {
      const r = await this.suspectIngestion.ingestTransactionsFromFile(
        path.join(dataPath, 'transactions.csv'),
      );
      results.transactions = {
        ...r,
        message: `Ingested ${r.success.toLocaleString()} transactions`,
      };
    } catch (error) {
      results.transactions.message = `Failed: ${error}`;
    }

    this.logger.success('V3 mock data ingestion complete', 'AdminController');
    return results;
  }
}
