"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

// Custom marker icons
const getCallerIcon = (riskLevel: string) => {
  const color =
    riskLevel === "HIGH" ? "red" : riskLevel === "MEDIUM" ? "orange" : "blue";
  return L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));">📍</div>`,
    iconSize: [24, 24],
    className: `caller-marker-${color}`,
  });
};

const getTowerIcon = () => {
  return L.divIcon({
    html: `<div style="font-size: 20px; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));">📡</div>`,
    iconSize: [20, 20],
    className: "tower-marker",
  });
};

const getConvergenceIcon = (severity: string) => {
  const emoji =
    severity === "CRITICAL"
      ? "🔴"
      : severity === "HIGH"
      ? "🟠"
      : severity === "MEDIUM"
      ? "🟡"
      : "🟢";
  return L.divIcon({
    html: `<div style="font-size: 28px; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));">${emoji}</div>`,
    iconSize: [28, 28],
    className: "convergence-marker",
  });
};

const getLineColor = (proximityPattern: string, duration: number) => {
  if (proximityPattern === "NEAR") return "#ef4444"; // Red
  if (duration > 600) return "#f97316"; // Orange for long calls
  return "#22c55e"; // Green
};

const GeolocationMap: React.FC<GeolocationMapProps> = ({
  markers = [],
  cellTowers = [],
  convergencePoints = [],
  center = [28.6139, 77.209], // Delhi, India
  zoom = 11,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-lg">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Cell Towers - filter out invalid coordinates */}
        {cellTowers
          .filter(
            (tower) =>
              tower.latitude != null &&
              tower.longitude != null &&
              tower.latitude !== 0 &&
              tower.longitude !== 0
          )
          .map((tower, idx) => (
            <Marker
              key={tower.tower_id || `tower-${idx}`}
              position={[tower.latitude, tower.longitude]}
              icon={getTowerIcon()}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="text-base">📡 {tower.location}</strong>
                  <br />
                  <span className="text-muted-foreground">
                    ID: {tower.tower_id}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Call Markers with Accuracy Circles - filter out invalid coordinates */}
        {markers
          .filter(
            (marker) =>
              marker.caller_position?.lat != null &&
              marker.caller_position?.lon != null &&
              marker.caller_position.lat !== 0 &&
              marker.caller_position.lon !== 0
          )
          .map((marker, idx) => (
            <React.Fragment key={marker.call_id || `marker-${idx}`}>
              {/* Caller Position */}
              <Marker
                position={[
                  marker.caller_position.lat,
                  marker.caller_position.lon,
                ]}
                icon={getCallerIcon(marker.risk_level)}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <strong className="text-base">
                      📞 Call: {marker.call_id || "Unknown"}
                    </strong>
                    <br />
                    <span>
                      <strong>Caller:</strong>{" "}
                      {marker.caller?.name || "Unknown"}
                    </span>
                    <br />
                    <span>
                      <strong>Phone:</strong> {marker.caller?.phone || "N/A"}
                    </span>
                    <br />
                    <span>
                      <strong>Receiver:</strong>{" "}
                      {marker.receiver?.name || "Unknown"}
                    </span>
                    <br />
                    <span>
                      <strong>Distance:</strong>{" "}
                      {marker.distance_km?.toFixed(2) || "N/A"} km
                    </span>
                    <br />
                    <span>
                      <strong>Duration:</strong> {marker.call_duration || 0}s
                    </span>
                    <br />
                    <span>
                      <strong>Accuracy:</strong> ±
                      {marker.caller_position?.accuracy_m || "N/A"}m
                    </span>
                    <br />
                    <span
                      className={`font-semibold ${
                        marker.risk_level === "HIGH"
                          ? "text-red-600"
                          : marker.risk_level === "MEDIUM"
                          ? "text-orange-500"
                          : "text-green-600"
                      }`}
                    >
                      Risk: {marker.risk_level || "LOW"}
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Accuracy Circle */}
              {marker.caller_position?.accuracy_m && (
                <Circle
                  center={[
                    marker.caller_position.lat,
                    marker.caller_position.lon,
                  ]}
                  radius={marker.caller_position.accuracy_m}
                  pathOptions={{
                    color: marker.risk_level === "HIGH" ? "#ef4444" : "#3b82f6",
                    fillColor:
                      marker.risk_level === "HIGH" ? "#fca5a5" : "#93c5fd",
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              )}

              {/* Connection Line to Receiver - only if receiver has valid coords */}
              {marker.receiver_position?.lat != null &&
                marker.receiver_position?.lon != null &&
                marker.receiver_position.lat !== 0 &&
                marker.receiver_position.lon !== 0 && (
                  <Polyline
                    positions={[
                      [marker.caller_position.lat, marker.caller_position.lon],
                      [
                        marker.receiver_position.lat,
                        marker.receiver_position.lon,
                      ],
                    ]}
                    pathOptions={{
                      color: getLineColor(
                        marker.proximity_pattern,
                        marker.call_duration || 0
                      ),
                      weight: Math.min(
                        4,
                        Math.max(1, (marker.call_duration || 0) / 300)
                      ),
                      opacity: 0.6,
                    }}
                  />
                )}
            </React.Fragment>
          ))}

        {/* Convergence Zones - filter out invalid coordinates */}
        {convergencePoints
          .filter(
            (point) =>
              point.convergence_lat != null &&
              point.convergence_lon != null &&
              point.convergence_lat !== 0 &&
              point.convergence_lon !== 0
          )
          .map((point, idx) => (
            <React.Fragment key={point.victim_id || `convergence-${idx}`}>
              <Marker
                position={[point.convergence_lat, point.convergence_lon]}
                icon={getConvergenceIcon(point.zone_severity)}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <strong className="text-base">🚨 Convergence Zone</strong>
                    <br />
                    <span>
                      <strong>Victim:</strong> {point.victim_name || "Unknown"}
                    </span>
                    <br />
                    <span>
                      <strong>Callers:</strong> {point.unique_callers || 0}
                    </span>
                    <br />
                    <span>
                      <strong>Interactions:</strong>{" "}
                      {point.total_interactions || 0}
                    </span>
                    <br />
                    <span
                      className={`font-semibold ${
                        point.zone_severity === "CRITICAL"
                          ? "text-red-600"
                          : point.zone_severity === "HIGH"
                          ? "text-orange-500"
                          : point.zone_severity === "MEDIUM"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      Severity: {point.zone_severity || "LOW"}
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Danger Zone Circle */}
              <Circle
                center={[point.convergence_lat, point.convergence_lon]}
                radius={500}
                pathOptions={{
                  color:
                    point.zone_severity === "CRITICAL"
                      ? "#dc2626"
                      : point.zone_severity === "HIGH"
                      ? "#ea580c"
                      : point.zone_severity === "MEDIUM"
                      ? "#eab308"
                      : "#16a34a",
                  fillOpacity: 0.15,
                  weight: 3,
                }}
              />
            </React.Fragment>
          ))}
      </MapContainer>
    </div>
  );
};

export default GeolocationMap;
