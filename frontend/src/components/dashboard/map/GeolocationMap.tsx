"use client";

import React, { useState, useCallback, useMemo } from "react";
import Map, {
  Marker,
  Popup,
  Source,
  Layer,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// Helper to safely convert Neo4j Integer objects ({low, high}) to regular JS numbers
const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "low" in value) {
    return (value as { low: number; high: number }).low;
  }
  return Number(value) || 0;
};

// Format phone number for readability
const formatPhone = (phone: string | undefined): string => {
  if (!phone) return "Unknown";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

// Format duration for readability
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
};

export interface MapMarker {
  call_id: string;
  caller: { id: string; name: string; phone: string };
  receiver: { id: string; name: string; phone: string };
  caller_position: { lat: number; lon: number; accuracy_m: number };
  receiver_position: { lat: number; lon: number };
  tower: { id: string; location: string };
  proximity_pattern: string;
  distance_km: number;
  call_duration: number;
  call_time: string;
  risk_level: string;
}

export interface CellTower {
  tower_id: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface ConvergencePoint {
  victim_id: string;
  victim_name: string;
  convergence_lat: number;
  convergence_lon: number;
  unique_callers: number;
  caller_names: string[];
  total_interactions: number;
  zone_severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

// Restricted Zone from Supabase PostGIS
export interface RestrictedZone {
  id: string;
  name: string;
  type: "AIRPORT" | "MILITARY" | "GOVERNMENT" | "BORDER" | "NUCLEAR" | "OTHER";
  polygon: number[][]; // Array of [lng, lat] coordinates
  threat_level: "CRITICAL" | "HIGH" | "MEDIUM";
}

interface GeolocationMapProps {
  markers?: MapMarker[];
  cellTowers?: CellTower[];
  center?: [number, number];
  zoom?: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Get severity/risk colors
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "CRITICAL":
      return "#dc2626";
    case "HIGH":
      return "#ea580c";
    case "MEDIUM":
      return "#eab308";
    default:
      return "#16a34a";
  }
};

const getRiskColor = (risk: string): string => {
  switch (risk) {
    case "HIGH":
      return "#dc2626";
    case "MEDIUM":
      return "#f97316";
    default:
      return "#3b82f6";
  }
};

const GeolocationMap: React.FC<GeolocationMapProps> = ({
  markers = [],
  cellTowers = [],
  center = [28.6139, 77.209],
  zoom = 11,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<{
    type: "caller" | "tower";
    data: MapMarker | CellTower;
    lng: number;
    lat: number;
  } | null>(null);

  // Filter valid data
  const validMarkers = useMemo(() => {
    console.log("[GeolocationMap] markers count:", markers.length);
    const filtered = markers.filter(
      (m) =>
        m.caller_position?.lat != null &&
        m.caller_position?.lon != null &&
        m.caller_position.lat !== 0 &&
        m.caller_position.lon !== 0,
    );
    console.log("[GeolocationMap] valid markers count:", filtered.length);
    if (filtered.length === 0 && markers.length > 0) {
      console.warn(
        "[GeolocationMap] All markers were filtered out! Sample:",
        markers[0],
      );
    }
    return filtered;
  }, [markers]);

  const validTowers = useMemo(
    () =>
      cellTowers.filter(
        (t) =>
          t.latitude != null &&
          t.longitude != null &&
          t.latitude !== 0 &&
          t.longitude !== 0,
      ),
    [cellTowers],
  );

  // Handle map click to reset selection
  const handleMapClick = useCallback(() => {
    setSelectedId(null);
    setPopupInfo(null);
  }, []);

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border relative">
      {/* Token Missing Warning */}
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center p-6 max-w-md bg-card rounded-lg border">
            <p className="text-lg font-semibold mb-2">
              ⚠️ Mapbox Token Missing
            </p>
            <p className="text-muted-foreground text-sm">
              Add{" "}
              <code className="bg-muted px-1 rounded">
                NEXT_PUBLIC_MAPBOX_TOKEN
              </code>{" "}
              to your <code>.env.local</code>
            </p>
          </div>
        </div>
      )}

      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={(e) => {
          const feature = e.features && e.features[0];
          if (feature) {
            const { id } = feature.properties as { id: string };
            const type = feature.layer?.id;

            if (type === "caller-points") {
              const marker = validMarkers.find((m) => m.call_id === id);
              if (marker) {
                setSelectedId(id);
                setPopupInfo({
                  type: "caller",
                  data: marker,
                  lng: e.lngLat.lng,
                  lat: e.lngLat.lat,
                });
              }
            } else if (type === "tower-symbols") {
              const tower = validTowers.find((t) => t.tower_id === id);
              if (tower) {
                setPopupInfo({
                  type: "tower",
                  data: tower,
                  lng: tower.longitude,
                  lat: tower.latitude,
                });
              }
            }
          } else {
            handleMapClick();
          }
        }}
        onMouseMove={(e) => {
          const canvas = e.target.getCanvas();
          if (e.features && e.features.length > 0) {
            canvas.style.cursor = "pointer";
          } else {
            canvas.style.cursor = "";
          }
        }}
        interactiveLayerIds={["caller-points", "tower-symbols"]}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass showZoom />

        {/* Cell Towers Layer */}
        <Source
          id="cell-towers"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: validTowers.map((t) => ({
              type: "Feature",
              properties: { id: t.tower_id, name: t.location },
              geometry: {
                type: "Point",
                coordinates: [t.longitude, t.latitude],
              },
            })),
          }}
        >
          <Layer
            id="tower-symbols"
            type="symbol"
            layout={{
              "icon-image": "communications-tower",
              "icon-size": 1.2,
              "text-field": "📡",
              "text-size": 18,
              "icon-allow-overlap": true,
            }}
            paint={{
              "text-opacity": selectedId === null ? 1 : 0.3,
            }}
          />
        </Source>

        {/* Callers/Suspects Layer */}
        <Source
          id="callers"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: validMarkers.map((m) => ({
              type: "Feature",
              properties: {
                id: m.call_id,
                risk: m.risk_level,
                isHighlighted: true,
              },
              geometry: {
                type: "Point",
                coordinates: [m.caller_position.lon, m.caller_position.lat],
              },
            })),
          }}
        >
          <Layer
            id="caller-points"
            type="circle"
            paint={{
              "circle-radius": [
                "case",
                ["==", ["get", "isHighlighted"], true],
                8,
                5,
              ],
              "circle-color": [
                "case",
                ["==", ["get", "risk"], "HIGH"],
                "#dc2626",
                ["==", ["get", "risk"], "MEDIUM"],
                "#f97316",
                "#3b82f6",
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": [
                "case",
                ["==", ["get", "isHighlighted"], true],
                1,
                0.2,
              ],
            }}
          />
        </Source>

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            closeOnClick={false}
            onClose={() => {
              setPopupInfo(null);
              setSelectedId(null);
            }}
            className="map-popup"
            maxWidth="220px"
          >
            <div className="p-1 min-w-[160px] max-w-[200px] text-xs">
              {/* Caller Popup */}
              {popupInfo.type === "caller" &&
                (() => {
                  const m = popupInfo.data as MapMarker;
                  return (
                    <div className="space-y-1.5">
                      {/* Header with relationship arrow */}
                      <div className="text-center border-b pb-1">
                        <div className="flex items-center justify-center gap-1 text-[9px]">
                          <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded">
                            SUSPECT
                          </span>
                          <span>→</span>
                          <span className="px-1.5 py-0.5 bg-green-600 text-white font-bold rounded">
                            VICTIM
                          </span>
                        </div>
                      </div>

                      {/* Caller (Suspect) */}
                      <div className="bg-red-50 p-1.5 rounded border-l-2 border-red-500">
                        <div className="text-[9px] text-red-600 font-bold">
                          CALLER
                        </div>
                        <div className="font-bold text-[11px] truncate">
                          {m.caller?.name || "Unknown"}
                        </div>
                        <div className="text-[10px] text-gray-600">
                          {formatPhone(m.caller?.phone)}
                        </div>
                      </div>

                      {/* Receiver (Victim) */}
                      <div className="bg-green-50 p-1.5 rounded border-l-2 border-green-500">
                        <div className="text-[9px] text-green-600 font-bold">
                          RECEIVER
                        </div>
                        <div className="font-bold text-[11px] truncate">
                          {m.receiver?.name || "Unknown"}
                        </div>
                        <div className="text-[10px] text-gray-600">
                          {formatPhone(m.receiver?.phone)}
                        </div>
                      </div>

                      {/* Call Details */}
                      <div className="flex justify-between text-[10px] border-t pt-1">
                        <span>{m.distance_km?.toFixed(1) || "?"} km</span>
                        <span>{formatDuration(toNumber(m.call_duration))}</span>
                      </div>

                      {/* Risk Badge */}
                      <div
                        className="text-center py-1 rounded font-bold text-[10px]"
                        style={{
                          backgroundColor: `${getRiskColor(m.risk_level)}20`,
                          color: getRiskColor(m.risk_level),
                        }}
                      >
                        {m.risk_level || "LOW"} RISK
                      </div>
                    </div>
                  );
                })()}

              {/* Tower Popup */}
              {popupInfo.type === "tower" &&
                (() => {
                  const t = popupInfo.data as CellTower;
                  return (
                    <div className="space-y-1">
                      <div className="font-bold text-sm">📡 TOWER</div>
                      <div className="text-xs">
                        <div className="font-medium">{t.location}</div>
                        <div className="text-gray-500">ID: {t.tower_id}</div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-2.5 shadow-lg text-xs space-y-1.5 z-10">
        <div className="font-bold text-sm border-b pb-1">📍 Legend</div>
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <span>CDR Marker</span>
          <span className="ml-auto text-red-500">●</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">📡</span>
          <span>Cell Tower</span>
        </div>
        <div className="border-t pt-1">
          <div className="text-[10px] text-muted-foreground italic">
            Markers show caller locations based on tower data.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationMap;
