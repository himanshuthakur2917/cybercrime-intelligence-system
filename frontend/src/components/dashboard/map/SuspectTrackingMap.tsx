"use client";

import React, { useMemo, useState } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  Popup,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  IconTower,
  IconUserBolt,
  IconMapPin,
  IconX,
} from "@tabler/icons-react";
import { Feature } from "geojson";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface TrajectoryPoint {
  call_id: string;
  timestamp: string;
  position: {
    latitude: number;
    longitude: number;
    tower_id: string;
  };
  range_km?: number;
  tower_location: string;
}

interface SuspectTrackingMapProps {
  trajectory: TrajectoryPoint[];
  triangulation: {
    estimatedLocation: { lat: number; lon: number };
    accuracyMeters: number;
    confidence: string;
    towersUsed?: string[];
  } | null;
  selectedSuspectName?: string;
}

const SuspectTrackingMap: React.FC<SuspectTrackingMapProps> = ({
  trajectory,
  triangulation,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<TrajectoryPoint | null>(
    null,
  );

  // Calculate center of map based on markers
  const center = useMemo(() => {
    if (triangulation?.estimatedLocation.lat) {
      return {
        latitude: triangulation.estimatedLocation.lat,
        longitude: triangulation.estimatedLocation.lon,
      };
    }

    if (trajectory.length === 1) {
      // Single marker: center on it
      return {
        latitude: trajectory[0].position.latitude,
        longitude: trajectory[0].position.longitude,
      };
    }

    if (trajectory.length > 1) {
      // Multiple markers: calculate centroid (average position)
      const sumLat = trajectory.reduce(
        (sum, p) => sum + p.position.latitude,
        0,
      );
      const sumLon = trajectory.reduce(
        (sum, p) => sum + p.position.longitude,
        0,
      );
      return {
        latitude: sumLat / trajectory.length,
        longitude: sumLon / trajectory.length,
      };
    }

    return { latitude: 28.6139, longitude: 77.209 }; // Delhi Default
  }, [trajectory, triangulation]);

  // Create GeoJSON for the trajectory line
  const lineData: Feature = useMemo(() => {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: trajectory.map((p) => [
          p.position.longitude,
          p.position.latitude,
        ]),
      },
    };
  }, [trajectory]);

  // Create GeoJSON for trajectory points
  const pointsData = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: trajectory.map((p) => ({
        type: "Feature",
        properties: {
          call_id: p.call_id,
          timestamp: p.timestamp,
          tower_location: p.tower_location,
          range_km: p.range_km || 2,
          isSelected: selectedPoint?.call_id === p.call_id,
        },
        geometry: {
          type: "Point",
          coordinates: [p.position.longitude, p.position.latitude],
        },
      })),
    };
  }, [trajectory, selectedPoint]);

  // Create GeoJSON for the selected point's radius
  const selectedPointRadiusData = useMemo(() => {
    if (!selectedPoint) return null;

    const points = 64;
    const coords = {
      latitude: selectedPoint.position.latitude,
      longitude: selectedPoint.position.longitude,
    };
    const km = selectedPoint.range_km || 2;
    const ret: number[][] = [];
    const distanceX =
      km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ret],
      },
      properties: {},
    } as Feature;
  }, [selectedPoint]);

  // Create GeoJSON for the accuracy circle
  const accuracyCircleData = useMemo(() => {
    if (!triangulation) return null;

    const points = 64;
    const coords = {
      latitude: triangulation.estimatedLocation.lat,
      longitude: triangulation.estimatedLocation.lon,
    };
    const km = triangulation.accuracyMeters / 1000;
    const ret: number[][] = [];
    const distanceX =
      km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ret],
      },
      properties: {},
    } as Feature;
  }, [triangulation]);

  // Create GeoJSON for towers used in triangulation
  const triangulationTowersData = useMemo(() => {
    if (!triangulation?.towersUsed || triangulation.towersUsed.length === 0) {
      return null;
    }

    // Find trajectory points that match the towers used in triangulation
    const towerPoints = trajectory.filter((p) =>
      triangulation.towersUsed?.includes(p.position.tower_id),
    );

    return {
      type: "FeatureCollection",
      features: towerPoints.map((p) => ({
        type: "Feature",
        properties: {
          tower_id: p.position.tower_id,
          tower_location: p.tower_location,
          range_km: p.range_km || 2,
        },
        geometry: {
          type: "Point",
          coordinates: [p.position.longitude, p.position.latitude],
        },
      })),
    };
  }, [triangulation, trajectory]);

  // Create coverage circles for triangulation towers
  const triangulationTowerCircles = useMemo(() => {
    if (!triangulation?.towersUsed || triangulation.towersUsed.length === 0) {
      return [];
    }

    const towerPoints = trajectory.filter((p) =>
      triangulation.towersUsed?.includes(p.position.tower_id),
    );

    return towerPoints.map((point) => {
      const points = 64;
      const coords = {
        latitude: point.position.latitude,
        longitude: point.position.longitude,
      };
      const km = point.range_km || 2;
      const ret: number[][] = [];
      const distanceX =
        km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
      const distanceY = km / 110.574;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
      }
      ret.push(ret[0]);

      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ret],
        },
        properties: {
          tower_id: point.position.tower_id,
        },
      } as Feature;
    });
  }, [triangulation, trajectory]);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border shadow-inner font-sans">
      <Map
        initialViewState={{
          latitude: center?.latitude,
          longitude: center?.longitude,
          zoom: 14,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        onClick={(e) => {
          const feature = e.features && e.features[0];
          if (feature && feature.layer?.id === "trajectory-points") {
            const callId = feature.properties?.call_id;
            const point = trajectory.find((p) => p.call_id === callId);
            if (point) {
              setSelectedPoint(point);
            }
          } else {
            setSelectedPoint(null);
          }
        }}
        onMouseMove={(e) => {
          const canvas = e.target.getCanvas();
          if (e.features && e.features.length > 0) {
            // Hovering over an interactive feature (marker)
            canvas.style.cursor = "pointer";
          } else {
            // Hovering over map background
            canvas.style.cursor = "grab";
          }
        }}
        onMouseDown={(e) => {
          const canvas = e.target.getCanvas();
          if (!e.features || e.features.length === 0) {
            // Only change to grabbing when dragging the map, not markers
            canvas.style.cursor = "grabbing";
          }
        }}
        onMouseUp={(e) => {
          const canvas = e.target.getCanvas();
          // Reset based on whether hovering over features
          if (e.features && e.features.length > 0) {
            canvas.style.cursor = "pointer";
          } else {
            canvas.style.cursor = "grab";
          }
        }}
        interactiveLayerIds={["trajectory-points"]}
      >
        <NavigationControl position="top-right" />

        {/* Trajectory Line */}
        {trajectory.length > 1 && (
          <Source id="trajectory" type="geojson" data={lineData}>
            <Layer
              id="trajectory-line"
              type="line"
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
              paint={{
                "line-color": "#3b82f6",
                "line-width": 3,
                "line-dasharray": [2, 1],
              }}
            />
          </Source>
        )}

        {/* Trajectory Points */}
        <Source id="trajectory-points-source" type="geojson" data={pointsData}>
          <Layer
            id="trajectory-points"
            type="circle"
            paint={{
              "circle-radius": ["case", ["get", "isSelected"], 12, 8],
              "circle-color": [
                "case",
                ["get", "isSelected"],
                "#facc15",
                "#3b82f6",
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.9,
            }}
          />
          {/* Tower icon layer */}
          <Layer
            id="trajectory-towers"
            type="symbol"
            layout={{
              "text-field": "📡",
              "text-size": 14,
              "text-offset": [-1, -1],
              "text-allow-overlap": true,
            }}
            paint={{
              "text-opacity": 0.7,
            }}
          />
        </Source>

        {/* Visibility Radius for Selected Point */}
        {selectedPointRadiusData && (
          <Source
            id="selected-radius"
            type="geojson"
            data={selectedPointRadiusData}
          >
            <Layer
              id="selected-radius-fill"
              type="fill"
              paint={{
                "fill-color": "#3b82f6",
                "fill-opacity": 0.1,
              }}
            />
            <Layer
              id="selected-radius-outline"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 1,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        )}

        {/* Accuracy Circle for Triangulation */}
        {accuracyCircleData && (
          <Source id="accuracy-circle" type="geojson" data={accuracyCircleData}>
            <Layer
              id="accuracy-circle-fill"
              type="fill"
              paint={{
                "fill-color": "#ef4444",
                "fill-opacity": 0.15,
              }}
            />
            <Layer
              id="accuracy-circle-outline"
              type="line"
              paint={{
                "line-color": "#ef4444",
                "line-width": 1,
                "line-dasharray": [4, 4],
              }}
            />
          </Source>
        )}

        {/* Triangulation Tower Coverage Circles */}
        {triangulationTowerCircles.map((circle, idx) => (
          <Source
            key={`tri-tower-circle-${idx}`}
            id={`tri-tower-circle-${idx}`}
            type="geojson"
            data={circle}
          >
            <Layer
              id={`tri-tower-circle-fill-${idx}`}
              type="fill"
              paint={{
                "fill-color": "#f97316",
                "fill-opacity": 0.08,
              }}
            />
            <Layer
              id={`tri-tower-circle-outline-${idx}`}
              type="line"
              paint={{
                "line-color": "#f97316",
                "line-width": 2,
                "line-dasharray": [3, 3],
              }}
            />
          </Source>
        ))}

        {/* Triangulation Tower Markers */}
        {triangulationTowersData && (
          <Source
            id="triangulation-towers"
            type="geojson"
            data={triangulationTowersData}
          >
            {/* Large tower marker */}
            <Layer
              id="triangulation-tower-base"
              type="circle"
              paint={{
                "circle-radius": 14,
                "circle-color": "#f97316",
                "circle-stroke-width": 3,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 0.95,
              }}
            />
            {/* Tower icon */}
            <Layer
              id="triangulation-tower-icon"
              type="symbol"
              layout={{
                "text-field": "📡",
                "text-size": 20,
                "text-allow-overlap": true,
              }}
            />
          </Source>
        )}

        {/* Coordinate Popup */}
        {selectedPoint && (
          <Popup
            longitude={selectedPoint.position.longitude}
            latitude={selectedPoint.position.latitude}
            anchor="bottom"
            offset={20}
            closeOnClick={false}
            onClose={() => setSelectedPoint(null)}
            className="map-popup"
          >
            <div className="p-3 min-w-[220px] text-xs">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-primary" />
                  Ping Location
                </h3>
              </div>

              <div className="space-y-2">
                <div className="bg-muted/50 p-2 rounded-lg">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                    Coordinates
                  </div>
                  <div className="text-xs font-mono">
                    {selectedPoint.position.latitude.toFixed(6)},{" "}
                    {selectedPoint.position.longitude.toFixed(6)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 p-2 rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                      Time
                    </div>
                    <div className="text-[11px] font-semibold">
                      {new Date(selectedPoint.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                      Coverage
                    </div>
                    <div className="text-[11px] font-semibold">
                      ~{selectedPoint.range_km || 2} km
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground italic border-t pt-2 flex items-center gap-2">
                  <IconTower className="h-3 w-3" />
                  Tower: {selectedPoint.tower_location}
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* Triangulated Position */}
        {triangulation && (
          <Source
            id="triangulation-point"
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [
                  triangulation.estimatedLocation.lon,
                  triangulation.estimatedLocation.lat,
                ],
              },
            }}
          >
            <Layer
              id="triangulation-pulse"
              type="circle"
              paint={{
                "circle-radius": 20,
                "circle-color": "#ef4444",
                "circle-opacity": 0.3,
              }}
            />
            <Layer
              id="triangulation-marker"
              type="circle"
              paint={{
                "circle-radius": 10,
                "circle-color": "#dc2626",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
            <Layer
              id="triangulation-icon"
              type="symbol"
              layout={{
                "text-field": "⚡",
                "text-size": 16,
                "text-allow-overlap": true,
              }}
            />
          </Source>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur border rounded-lg p-3 shadow-xl text-xs space-y-2 z-20">
          <div className="font-bold border-b pb-1 mb-1">Forensic Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <span>Movement Log (Ping)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">📡</span>
            <span>Associated Tower</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-blue-500 border-t border-dashed"></div>
            <span>Trajectory Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
            <span>Triangulated Origin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
              📡
            </div>
            <span>Triangulation Tower</span>
          </div>
        </div>
      </Map>
    </div>
  );
};

export default SuspectTrackingMap;
