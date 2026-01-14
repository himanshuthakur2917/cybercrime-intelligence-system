import { Controller, Get, Param } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';

@Controller('geolocation')
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  /**
   * GET /geolocation/:investigationId/map-data
   * Returns all data needed for map visualization
   */
  @Get(':investigationId/map-data')
  async getMapData(@Param('investigationId') investigationId: string) {
    const markers =
      await this.geolocationService.getMapMarkers(investigationId);
    const cellTowers =
      await this.geolocationService.getCellTowers(investigationId);

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
  }

  /**
   * GET /geolocation/:investigationId/clusters
   * Returns geographic clusters of suspicious activity
   */
  @Get(':investigationId/clusters')
  async getClusters(@Param('investigationId') investigationId: string) {
    const clusters =
      await this.geolocationService.findDistanceBasedClusters(investigationId);

    return {
      success: true,
      data: {
        clusters,
        totalClusters: clusters.length,
      },
    };
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
    const prediction = await this.geolocationService.predictCurrentLocation(
      investigationId,
      suspectId,
    );

    return {
      success: true,
      data: {
        currentLocationPrediction: prediction,
      },
    };
  }

  /**
   * GET /geolocation/:investigationId/towers
   * Returns all cell towers for the investigation
   */
  @Get(':investigationId/towers')
  async getCellTowers(@Param('investigationId') investigationId: string) {
    const towers = await this.geolocationService.getCellTowers(investigationId);

    return {
      success: true,
      data: {
        towers,
        totalTowers: towers.length,
      },
    };
  }
}
