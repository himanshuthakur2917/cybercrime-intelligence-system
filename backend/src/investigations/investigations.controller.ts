import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  InvestigationsService,
  GraphNode,
  GraphEdge,
} from './investigations.service';
import { LoggerService } from 'src/common/logger/logger.service';
import type { ExtendedCsvData } from './interfaces/investigation.interface';

@Controller('investigations')
export class InvestigationsController {
  constructor(
    private readonly investigationService: InvestigationsService,
    private readonly logger: LoggerService,
  ) {}

  @Post('create')
  async createInvestigation() {
    // TODO: require auth middleware - requirePermissions('investigations:create')
    this.logger.log(
      'Creating new investigation...',
      'InvestigationsController',
    );

    const res = await this.investigationService.createInvestigation({
      id: '',
      caseId: 'case_1',
      name: 'Investigation on Case 1',
      createdBy: 'user_0001',
      createdAt: '',
      status: '',
    });

    return { message: 'Investigation created successfully', data: res };
  }

  @Post(':investigationId/upload')
  async uploadData(
    @Param('investigationId') investigationId: string,
    @Body() csvData: ExtendedCsvData,
  ) {
    // TODO: require auth middleware - requirePermissions('data:upload')
    this.logger.log(
      `Receiving data upload for investigation: ${investigationId}`,
      'InvestigationsController',
    );

    // Log payload summary
    const payloadKeys = Object.keys(csvData);
    const payloadSummary = payloadKeys
      .map((key) => {
        const arr = (csvData as any)[key];
        return Array.isArray(arr) ? `${key}: ${arr.length}` : null;
      })
      .filter(Boolean)
      .join(', ');

    this.logger.verbose(
      `Payload contents: ${payloadSummary}`,
      'InvestigationsController',
    );

    try {
      const result = await this.investigationService.ingestData(
        investigationId,
        csvData,
      );

      this.logger.success(
        `Data upload successful for ${investigationId}`,
        'InvestigationsController',
      );

      return { message: 'Data ingested successfully', data: result };
    } catch (error) {
      this.logger.failed(
        `Data upload failed for ${investigationId}`,
        'InvestigationsController',
      );
      throw error;
    }
  }

  @Post(':investigationId/analyze')
  async analyzeInvestigation(
    @Param('investigationId') investigationId: string,
  ): Promise<{
    message: string;
    data: { nodes: GraphNode[]; edges: GraphEdge[] };
  }> {
    // TODO: require auth middleware - requirePermissions('investigations:analyze')
    this.logger.log(
      `Starting analysis for investigation: ${investigationId}`,
      'InvestigationsController',
    );

    try {
      const result =
        await this.investigationService.runAnalysis(investigationId);

      this.logger.success(
        `Analysis complete for ${investigationId}`,
        'InvestigationsController',
      );

      return { message: 'Analysis completed successfully', data: result };
    } catch (error) {
      this.logger.failed(
        `Analysis failed for ${investigationId}`,
        'InvestigationsController',
      );
      throw error;
    }
  }

  @Post('list')
  async list() {
    const res = await this.investigationService.listInvestigations();
    return { data: res };
  }

  @Post(':investigationId/sync-towers')
  async syncTowers(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Syncing cell towers for investigation: ${investigationId}`,
      'InvestigationsController',
    );

    try {
      const result =
        await this.investigationService.syncTowersToNeo4j(investigationId);

      this.logger.success(
        `Tower sync complete: ${result.towerCount} towers`,
        'InvestigationsController',
      );

      return {
        success: true,
        message: result.message,
        towerCount: result.towerCount,
      };
    } catch (error) {
      this.logger.failed(
        `Tower sync failed for ${investigationId}`,
        'InvestigationsController',
      );
      throw error;
    }
  }

  @Post('get-all')
  async getAll() {
    const res = await this.investigationService.listInvestigations();
    return { data: res };
  }

  @Post(':investigationId/patterns')
  async getCallPatterns(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Fetching call patterns for investigation: ${investigationId}`,
      'InvestigationsController',
    );
    try {
      const result =
        await this.investigationService.getCallPatterns(investigationId);
      return {
        message: 'Call patterns retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch call patterns for ${investigationId}`,
        'InvestigationsController',
      );
      throw error;
    }
  }
}
