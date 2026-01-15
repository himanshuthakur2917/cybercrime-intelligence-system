"use client";

import React, { useState, useCallback, useMemo } from "react";
import Map, {
  Marker,
  Popup,
  Source,
  Layer,
  NavigationControl,
} from "react-map-gl";
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

interface GeolocationMapProps {
  markers?: MapMarker[];
  cellTowers?: CellTower[];
  convergencePoints?: ConvergencePoint[];
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
  convergencePoints = [],
  center = [28.6139, 77.209],
  zoom = 11,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<{
    type: "caller" | "tower" | "convergence";
    data: MapMarker | CellTower | ConvergencePoint;
    lng: number;
    lat: number;
  } | null>(null);

  // Filter valid data
  const validMarkers = useMemo(
    () =>
      markers.filter(
        (m) =>
          m.caller_position?.lat != null &&
          m.caller_position?.lon != null &&
          m.caller_position.lat !== 0 &&
          m.caller_position.lon !== 0
      ),
    [markers]
  );

  const validTowers = useMemo(
    () =>
      cellTowers.filter(
        (t) =>
          t.latitude != null &&
          t.longitude != null &&
          t.latitude !== 0 &&
          t.longitude !== 0
      ),
    [cellTowers]
  );

  const validConvergence = useMemo(
    () =>
      convergencePoints.filter(
        (p) =>
          p.convergence_lat != null &&
          p.convergence_lon != null &&
          p.convergence_lat !== 0 &&
          p.convergence_lon !== 0
      ),
    [convergencePoints]
  );

  // Build connection lines GeoJSON
  const linesGeoJson = useMemo(() => {
    const features = validMarkers
      .filter(
        (m) =>
          m.receiver_position?.lat != null &&
          m.receiver_position?.lon != null &&
          m.receiver_position.lat !== 0 &&
          m.receiver_position.lon !== 0
      )
      .map((m) => ({
        type: "Feature" as const,
        properties: {
          call_id: m.call_id,
          risk_level: m.risk_level,
          isHighlighted: selectedId === m.call_id || selectedId === null,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [m.caller_position.lon, m.caller_position.lat],
            [m.receiver_position.lon, m.receiver_position.lat],
          ],
        },
      }));
    return { type: "FeatureCollection" as const, features };
  }, [validMarkers, selectedId]);

  // Get callers for a victim
  const getCallersForVictim = useCallback(
    (victimId: string): MapMarker[] => {
      return validMarkers.filter((m) => m.receiver?.id === victimId);
    },
    [validMarkers]
  );

  // Check if caller is connected to selected convergence
  const isConnectedToSelected = useCallback(
    (callId: string): boolean => {
      if (!selectedId?.startsWith("conv-"))
        return selectedId === callId || selectedId === null;
      const victimId = selectedId.replace("conv-", "");
      const marker = validMarkers.find((m) => m.call_id === callId);
      return marker?.receiver?.id === victimId;
    },
    [selectedId, validMarkers]
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
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />

        {/* Connection Lines */}
        <Source id="connections" type="geojson" data={linesGeoJson}>
          <Layer
            id="connection-lines"
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["get", "risk_level"], "HIGH"],
                "#ef4444",
                ["==", ["get", "risk_level"], "MEDIUM"],
                "#f97316",
                "#22c55e",
              ],
              "line-width": 2,
              "line-opacity": [
                "case",
                ["==", ["get", "isHighlighted"], true],
                0.8,
                0.15,
              ],
            }}
          />
        </Source>

        {/* Cell Towers */}
        {validTowers.map((tower, idx) => (
          <Marker
            key={tower.tower_id || `tower-${idx}`}
            longitude={tower.longitude}
            latitude={tower.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo({
                type: "tower",
                data: tower,
                lng: tower.longitude,
                lat: tower.latitude,
              });
            }}
          >
            <div
              className="text-xl cursor-pointer hover:scale-110 transition-transform"
              style={{ opacity: selectedId === null ? 1 : 0.3 }}
            >
              📡
            </div>
          </Marker>
        ))}

        {/* Caller Markers */}
        {validMarkers.map((marker, idx) => {
          const isHighlighted = isConnectedToSelected(marker.call_id);
          return (
            <Marker
              key={marker.call_id || `marker-${idx}`}
              longitude={marker.caller_position.lon}
              latitude={marker.caller_position.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedId(marker.call_id);
                setPopupInfo({
                  type: "caller",
                  data: marker,
                  lng: marker.caller_position.lon,
                  lat: marker.caller_position.lat,
                });
              }}
            >
              <div
                className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                style={{
                  opacity: isHighlighted ? 1 : 0.2,
                  filter: `drop-shadow(0 2px 3px ${getRiskColor(
                    marker.risk_level
                  )})`,
                }}
              >
                📍
              </div>
            </Marker>
          );
        })}

        {/* Convergence Points (Victims) */}
        {validConvergence.map((point, idx) => {
          const isHighlighted =
            selectedId === `conv-${point.victim_id}` || selectedId === null;
          return (
            <Marker
              key={point.victim_id || `conv-${idx}`}
              longitude={point.convergence_lon}
              latitude={point.convergence_lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedId(`conv-${point.victim_id}`);
                setPopupInfo({
                  type: "convergence",
                  data: point,
                  lng: point.convergence_lon,
                  lat: point.convergence_lat,
                });
              }}
            >
              <div
                className="cursor-pointer hover:scale-110 transition-transform"
                style={{ opacity: isHighlighted ? 1 : 0.2 }}
              >
                <div
                  className="w-8 h-8 rounded-full border-3 flex items-center justify-center text-sm"
                  style={{
                    borderColor: getSeverityColor(point.zone_severity),
                    backgroundColor: `${getSeverityColor(
                      point.zone_severity
                    )}30`,
                    borderWidth: 3,
                  }}
                >
                  {point.zone_severity === "CRITICAL"
                    ? "🚨"
                    : point.zone_severity === "HIGH"
                    ? "⚠️"
                    : "👤"}
                </div>
              </div>
            </Marker>
          );
        })}

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
          >
            <div className="p-1 min-w-[180px] max-w-[260px]">
              {/* Caller Popup */}
              {popupInfo.type === "caller" &&
                (() => {
                  const m = popupInfo.data as MapMarker;
                  return (
                    <div className="space-y-1.5">
                      <div className="font-bold text-sm border-b pb-1 flex items-center gap-1">
                        📞 <span>CALL</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-10">From:</span>
                          <div>
                            <div className="font-medium">
                              {m.caller?.name || "Unknown"}
                            </div>
                            <div className="text-gray-500">
                              {formatPhone(m.caller?.phone)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t pt-1">
                          <span className="text-gray-500 w-10">To:</span>
                          <div>
                            <div className="font-medium">
                              {m.receiver?.name || "Unknown"}
                            </div>
                            <div className="text-gray-500">
                              {formatPhone(m.receiver?.phone)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span>📍 {m.distance_km?.toFixed(1) || "?"} km</span>
                          <span>
                            ⏱️ {formatDuration(toNumber(m.call_duration))}
                          </span>
                        </div>
                        <div
                          className="text-center py-1 rounded font-bold"
                          style={{
                            backgroundColor: `${getRiskColor(m.risk_level)}20`,
                            color: getRiskColor(m.risk_level),
                          }}
                        >
                          {m.risk_level === "HIGH"
                            ? "⚠️ HIGH RISK"
                            : m.risk_level === "MEDIUM"
                            ? "⚡ MEDIUM"
                            : "✓ LOW"}
                        </div>
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

              {/* Convergence/Victim Popup */}
              {popupInfo.type === "convergence" &&
                (() => {
                  const p = popupInfo.data as ConvergencePoint;
                  const callers = getCallersForVictim(p.victim_id);
                  return (
                    <div className="space-y-1.5">
                      <div
                        className="font-bold text-sm border-b pb-1"
                        style={{ color: getSeverityColor(p.zone_severity) }}
                      >
                        {p.zone_severity === "CRITICAL"
                          ? "🚨 CRITICAL"
                          : p.zone_severity === "HIGH"
                          ? "⚠️ HIGH RISK"
                          : "👤 VICTIM"}
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">
                          {p.victim_name || "Unknown Victim"}
                        </div>
                        <div className="border-t pt-1">
                          <span className="text-gray-500">Called by:</span>
                          <ul className="mt-0.5 space-y-0.5 max-h-20 overflow-y-auto">
                            {callers.length > 0 ? (
                              callers.slice(0, 4).map((c, i) => (
                                <li key={i} className="text-gray-700">
                                  • {c.caller?.name || "Unknown"} (
                                  {formatPhone(c.caller?.phone)})
                                </li>
                              ))
                            ) : p.caller_names?.length > 0 ? (
                              p.caller_names
                                .slice(0, 4)
                                .map((name, i) => <li key={i}>• {name}</li>)
                            ) : (
                              <li className="text-gray-500 italic">
                                No caller data
                              </li>
                            )}
                            {(callers.length > 4 ||
                              (p.caller_names?.length || 0) > 4) && (
                              <li className="text-gray-500">
                                ...+
                                {Math.max(
                                  callers.length,
                                  p.caller_names?.length || 0
                                ) - 4}{" "}
                                more
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="border-t pt-1 flex justify-between">
                          <span>{toNumber(p.total_interactions)} calls</span>
                          <span
                            className="font-bold"
                            style={{ color: getSeverityColor(p.zone_severity) }}
                          >
                            {p.zone_severity}
                          </span>
                        </div>
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
          <span>Caller</span>
          <span className="ml-auto text-red-500">●</span>
          <span className="text-[10px] text-gray-500">High</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">📡</span>
          <span>Tower</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-green-600 bg-green-600/20 flex items-center justify-center text-[8px]">
            👤
          </div>
          <span>Victim</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-red-600/20 flex items-center justify-center text-[8px]">
            🚨
          </div>
          <span>Critical Zone</span>
        </div>
        <div className="border-t pt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-red-500"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-green-500"></div>
            <span>Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationMap;
