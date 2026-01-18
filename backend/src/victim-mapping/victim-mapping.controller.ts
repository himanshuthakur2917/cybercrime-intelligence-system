import { Controller, Get, Param } from '@nestjs/common';
import { VictimMappingService } from './victim-mapping.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Controller('victim-mapping')
export class VictimMappingController {
  constructor(
    private readonly victimMappingService: VictimMappingService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * GET /victim-mapping/:investigationId/victim/:victimPhone/suspects
   * Returns suspects who called or contacted a specific victim
   * NOTE: More specific routes must come FIRST to avoid route matching conflicts
   */
  @Get(':investigationId/victim/:victimPhone/suspects')
  async getSuspectsForVictim(
    @Param('investigationId') investigationId: string,
    @Param('victimPhone') victimPhone: string,
  ) {
    this.logger.log(
      `Finding suspects for victim ${victimPhone} in investigation: ${investigationId}`,
      'VictimMappingController',
    );

    try {
      const suspects = await this.victimMappingService.getSuspectsForVictim(
        investigationId,
        victimPhone,
      );

      this.logger.success(
        `Found ${suspects.length} suspects connected to victim ${victimPhone}`,
        'VictimMappingController',
      );

      return {
        success: true,
        data: {
          victimPhone,
          suspects,
          count: suspects.length,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to find suspects for victim ${victimPhone}`,
        'VictimMappingController',
      );
      throw error;
    }
  }

  /**
   * GET /victim-mapping/:investigationId/patterns
   * Returns detected harassment patterns
   */
  @Get(':investigationId/patterns')
  async getPatterns(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Detecting harassment patterns for investigation: ${investigationId}`,
      'VictimMappingController',
    );

    try {
      const harassmentPatterns =
        await this.victimMappingService.detectHarassmentPatterns(
          investigationId,
        );
      const collaborativeCalls =
        await this.victimMappingService.findCollaborativeCalls(investigationId);

      const criticalCount = harassmentPatterns.filter(
        (p) => p.harassment_severity === 'CRITICAL',
      ).length;
      const highCount = harassmentPatterns.filter(
        (p) => p.harassment_severity === 'HIGH',
      ).length;

      this.logger.success(
        `Pattern detection complete: ${harassmentPatterns.length} harassment patterns, ${collaborativeCalls.length} collaborative calls`,
        'VictimMappingController',
      );

      if (criticalCount > 0) {
        this.logger.warn(
          `⚠️ ${criticalCount} CRITICAL harassment patterns detected!`,
          'VictimMappingController',
        );
      }

      return {
        success: true,
        data: {
          harassmentPatterns,
          collaborativeCalls,
          summary: {
            totalPatterns:
              harassmentPatterns.length + collaborativeCalls.length,
            critical: criticalCount,
            high: highCount,
          },
        },
      };
    } catch (error) {
      this.logger.failed(
        `Pattern detection failed for ${investigationId}`,
        'VictimMappingController',
      );
      throw error;
    }
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
    this.logger.log(
      `Tracking trajectory for suspect ${suspectId} in investigation: ${investigationId}`,
      'VictimMappingController',
    );

    try {
      const trajectory =
        await this.victimMappingService.trackMovementTrajectory(
          investigationId,
          suspectId,
        );

      this.logger.success(
        `Trajectory retrieved: ${trajectory.length} points for suspect ${suspectId}`,
        'VictimMappingController',
      );

      return {
        success: true,
        data: {
          trajectory,
          pointCount: trajectory.length,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Trajectory tracking failed for ${suspectId}`,
        'VictimMappingController',
      );
      throw error;
    }
  }

  /**
   * GET /victim-mapping/:investigationId/convergence
   * Returns convergence zones where multiple suspects interact
   */
  @Get(':investigationId/convergence')
  async getConvergenceZones(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Finding convergence zones for investigation: ${investigationId}`,
      'VictimMappingController',
    );

    try {
      const convergencePoints =
        await this.victimMappingService.findConvergencePoints(investigationId);

      const criticalZones = convergencePoints.filter(
        (p) => p.zone_severity === 'CRITICAL',
      ).length;

      this.logger.success(
        `Found ${convergencePoints.length} convergence zones, ${criticalZones} critical`,
        'VictimMappingController',
      );

      return {
        success: true,
        data: {
          convergencePoints,
          totalZones: convergencePoints.length,
          criticalZones,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to find convergence zones for ${investigationId}`,
        'VictimMappingController',
      );
      throw error;
    }
  }

  /**
   * GET /victim-mapping/:investigationId
   * Returns all caller-victim relationships with risk levels
   */
  @Get(':investigationId')
  async getVictimMapping(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Fetching victim mapping for investigation: ${investigationId}`,
      'VictimMappingController',
    );

    try {
      const relationships =
        await this.victimMappingService.getVictimMappingGraph(investigationId);
      const convergencePoints =
        await this.victimMappingService.findConvergencePoints(investigationId);

      const criticalCount = relationships.filter(
        (r) => r.risk_level === 'CRITICAL',
      ).length;
      const highRiskCount = relationships.filter(
        (r) => r.risk_level === 'HIGH',
      ).length;

      this.logger.success(
        `Victim mapping complete: ${relationships.length} relationships, ${criticalCount} critical, ${highRiskCount} high-risk`,
        'VictimMappingController',
      );

      return {
        success: true,
        data: {
          relationships,
          convergencePoints,
          summary: {
            totalRelationships: relationships.length,
            convergenceZones: convergencePoints.length,
            criticalCases: criticalCount,
            highRiskCases: highRiskCount,
          },
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch victim mapping for ${investigationId}`,
        'VictimMappingController',
      );
      throw error;
    }
  }
}
