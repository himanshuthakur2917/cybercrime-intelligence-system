import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  InvestigationsService,
  GraphNode,
  GraphEdge,
} from './investigations.service';
import type { Request } from 'express';
import type { csvData } from './interfaces/investigation.interface';

@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigationService: InvestigationsService) {}

  @Post('create')
  async createInvestigation() {
    // TODO: require auth middleware - requirePermissions('investigations:create')
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
    @Body() csvData: csvData,
  ) {
    // TODO: require auth middleware - requirePermissions('data:upload')

    try {
      const result = await this.investigationService.ingestData(
        investigationId,
        csvData,
      );

      return { message: 'Data ingested successfully', data: result };
    } catch (error) {
      console.error('Error in uploadData controller:', error);
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

    try {
      const result =
        await this.investigationService.runAnalysis(investigationId);

      return { message: 'Analysis completed successfully', data: result };
    } catch (error) {
      console.error('Error in analyzeInvestigation controller:', error);
      throw error;
    }
  }
}
