import { Controller, Get, Param } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Controller('geolocation')
export class GeolocationController {
  constructor(
    private readonly geolocationService: GeolocationService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * GET /geolocation/:investigationId/map-data
   * Returns all data needed for map visualization
   */
  @Get(':investigationId/map-data')
  async getMapData(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Fetching map data for investigation: ${investigationId}`,
      'GeolocationController',
    );

    try {
      const markers =
        await this.geolocationService.getMapMarkers(investigationId);
      const cellTowers =
        await this.geolocationService.getCellTowers(investigationId);

      this.logger.success(
        `Map data retrieved: ${markers.length} markers, ${cellTowers.length} towers`,
        'GeolocationController',
      );

      return {
        success: true,
        data: {
          markers,
          cellTowers,
          summary: {
            totalMarkers: markers.length,
            totalTowers: cellTowers.length,
          },
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch map data for ${investigationId}`,
        'GeolocationController',
      );
      throw error;
    }
  }

  /**
   * GET /geolocation/:investigationId/clusters
   * Returns geographic clusters of suspicious activity
   */
  @Get(':investigationId/clusters')
  async getClusters(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Fetching clusters for investigation: ${investigationId}`,
      'GeolocationController',
    );

    try {
      const clusters =
        await this.geolocationService.findDistanceBasedClusters(
          investigationId,
        );

      this.logger.success(
        `Found ${clusters.length} clusters`,
        'GeolocationController',
      );

      return {
        success: true,
        data: {
          clusters,
          totalClusters: clusters.length,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch clusters for ${investigationId}`,
        'GeolocationController',
      );
      throw error;
    }
  }

  /**
   * GET /geolocation/:investigationId/trajectory/:suspectId
   * Returns movement trajectory and location prediction for a suspect
   */
  @Get(':investigationId/trajectory/:suspectId')
  async getTrajectory(
    @Param('investigationId') investigationId: string,
    @Param('suspectId') suspectId: string,
  ) {
    this.logger.log(
      `Predicting location for suspect ${suspectId} in investigation: ${investigationId}`,
      'GeolocationController',
    );

    try {
      const prediction = await this.geolocationService.predictCurrentLocation(
        investigationId,
        suspectId,
      );

      if (prediction) {
        this.logger.success(
          `Location prediction complete for ${suspectId}: ${prediction.confidence_level} confidence`,
          'GeolocationController',
        );
      } else {
        this.logger.warn(
          `No location data available for suspect ${suspectId}`,
          'GeolocationController',
        );
      }

      return {
        success: true,
        data: {
          currentLocationPrediction: prediction,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Location prediction failed for ${suspectId}`,
        'GeolocationController',
      );
      throw error;
    }
  }

  /**
   * GET /geolocation/:investigationId/towers
   * Returns all cell towers for the investigation
   */
  @Get(':investigationId/towers')
  async getCellTowers(@Param('investigationId') investigationId: string) {
    this.logger.log(
      `Fetching cell towers for investigation: ${investigationId}`,
      'GeolocationController',
    );

    try {
      const towers =
        await this.geolocationService.getCellTowers(investigationId);

      this.logger.success(
        `Retrieved ${towers.length} cell towers`,
        'GeolocationController',
      );

      return {
        success: true,
        data: {
          towers,
          totalTowers: towers.length,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch cell towers for ${investigationId}`,
        'GeolocationController',
      );
      throw error;
    }
  }
}
