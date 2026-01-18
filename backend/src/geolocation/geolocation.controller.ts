import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
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

  /**
   * GET /geolocation/:investigationId/victim-caller-map/:victimId
   * Returns all callers who contacted a specific victim with tower coordinates
   */
  @Get(':investigationId/victim-caller-map/:victimId')
  async getVictimCallerMap(
    @Param('investigationId') investigationId: string,
    @Param('victimId') victimId: string,
    @Query('rangeKm') rangeKm?: number,
  ) {
    this.logger.log(
      `Fetching victim-caller map for victim ${victimId} in investigation: ${investigationId}`,
      'GeolocationController',
    );

    try {
      const connections = await this.geolocationService.getVictimCallerMap(
        investigationId,
        victimId,
        rangeKm ? parseFloat(rangeKm.toString()) : undefined,
      );

      this.logger.success(
        `Retrieved ${connections.length} caller connections for victim ${victimId}`,
        'GeolocationController',
      );

      return {
        success: true,
        data: {
          connections,
          totalConnections: connections.length,
          rangeKm: rangeKm || 'all',
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch victim-caller map for ${victimId}`,
        'GeolocationController',
      );
      throw error;
    }
  }

  /**
   * GET /geolocation/:investigationId/triangulate/:suspectId
   * Triangulates suspect location using PostGIS and multiple tower pings
   */
  @Get(':investigationId/triangulate/:suspectId')
  async triangulateLocation(
    @Param('investigationId') investigationId: string,
    @Param('suspectId') suspectId: string,
  ) {
    this.logger.log(
      `Triangulating location for suspect ${suspectId} in investigation: ${investigationId}`,
      'GeolocationController',
    );

    try {
      const result = await this.geolocationService.triangulateLocation(
        investigationId,
        suspectId,
      );

      if (result) {
        this.logger.success(
          `Triangulated location for ${suspectId} with ${result.confidence} confidence (${result.towerCount} towers)`,
          'GeolocationController',
        );
      } else {
        this.logger.warn(
          `Unable to triangulate location for suspect ${suspectId} - insufficient data`,
          'GeolocationController',
        );
      }

      return {
        success: true,
        data: {
          triangulation: result,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Triangulation failed for suspect ${suspectId}`,
        'GeolocationController',
      );
      throw error;
    }
  }

  /**
   * GET /geolocation/:investigationId/markers-in-range
   * Returns map markers filtered by distance from a center point
   */
  @Get(':investigationId/markers-in-range')
  async getMarkersInRange(
    @Param('investigationId') investigationId: string,
    @Query('centerLat') centerLat: number,
    @Query('centerLon') centerLon: number,
    @Query('rangeKm') rangeKm: number,
  ) {
    this.logger.log(
      `Fetching markers within ${rangeKm}km of (${centerLat}, ${centerLon})`,
      'GeolocationController',
    );

    try {
      const markers = await this.geolocationService.getMarkersInRange(
        investigationId,
        parseFloat(centerLat.toString()),
        parseFloat(centerLon.toString()),
        parseFloat(rangeKm.toString()),
      );

      this.logger.success(
        `Retrieved ${markers.length} markers within ${rangeKm}km range`,
        'GeolocationController',
      );

      return {
        success: true,
        data: {
          markers,
          totalMarkers: markers.length,
          center: { lat: centerLat, lon: centerLon },
          rangeKm,
        },
      };
    } catch (error) {
      this.logger.failed(
        `Failed to fetch markers in range`,
        'GeolocationController',
      );
      throw error;
    }
  }
}
