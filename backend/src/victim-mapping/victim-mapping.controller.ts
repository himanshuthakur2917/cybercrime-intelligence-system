import { Controller, Get, Param } from '@nestjs/common';
import { VictimMappingService } from './victim-mapping.service';

@Controller('victim-mapping')
export class VictimMappingController {
  constructor(private readonly victimMappingService: VictimMappingService) {}

  /**
   * GET /victim-mapping/:investigationId
   * Returns all caller-victim relationships with risk levels
   */
  @Get(':investigationId')
  async getVictimMapping(@Param('investigationId') investigationId: string) {
    const relationships =
      await this.victimMappingService.getVictimMappingGraph(investigationId);
    const convergencePoints =
      await this.victimMappingService.findConvergencePoints(investigationId);

    return {
      success: true,
      data: {
        relationships,
        convergencePoints,
        summary: {
          totalRelationships: relationships.length,
          convergenceZones: convergencePoints.length,
          criticalCases: relationships.filter(
            (r) => r.risk_level === 'CRITICAL',
          ).length,
          highRiskCases: relationships.filter((r) => r.risk_level === 'HIGH')
            .length,
        },
      },
    };
  }

  /**
   * GET /victim-mapping/:investigationId/patterns
   * Returns detected harassment patterns
   */
  @Get(':investigationId/patterns')
  async getPatterns(@Param('investigationId') investigationId: string) {
    const harassmentPatterns =
      await this.victimMappingService.detectHarassmentPatterns(investigationId);
    const collaborativeCalls =
      await this.victimMappingService.findCollaborativeCalls(investigationId);

    return {
      success: true,
      data: {
        harassmentPatterns,
        collaborativeCalls,
        summary: {
          totalPatterns: harassmentPatterns.length + collaborativeCalls.length,
          critical: harassmentPatterns.filter(
            (p) => p.harassment_severity === 'CRITICAL',
          ).length,
          high: harassmentPatterns.filter(
            (p) => p.harassment_severity === 'HIGH',
          ).length,
        },
      },
    };
  }

  /**
   * GET /victim-mapping/:investigationId/trajectory/:suspectId
   * Returns movement trajectory for a suspect
   */
  @Get(':investigationId/trajectory/:suspectId')
  async getTrajectory(
    @Param('investigationId') investigationId: string,
    @Param('suspectId') suspectId: string,
  ) {
    const trajectory = await this.victimMappingService.trackMovementTrajectory(
      investigationId,
      suspectId,
    );

    return {
      success: true,
      data: {
        trajectory,
        pointCount: trajectory.length,
      },
    };
  }

  /**
   * GET /victim-mapping/:investigationId/convergence
   * Returns convergence zones where multiple suspects interact
   */
  @Get(':investigationId/convergence')
  async getConvergenceZones(@Param('investigationId') investigationId: string) {
    const convergencePoints =
      await this.victimMappingService.findConvergencePoints(investigationId);

    return {
      success: true,
      data: {
        convergencePoints,
        totalZones: convergencePoints.length,
        criticalZones: convergencePoints.filter(
          (p) => p.zone_severity === 'CRITICAL',
        ).length,
      },
    };
  }
}
