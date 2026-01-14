"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues with Leaflet
const GeolocationMap = dynamic(
  () => import("@/components/dashboard/map/GeolocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-lg">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    ),
  }
);

// Mock data for demonstration - replace with API calls
const mockMarkers = [
  {
    call_id: "CALL_001",
    caller: { id: "S1", name: "Rajesh Kumar", phone: "+91 98765 43210" },
    receiver: { id: "S4", name: "Vikram Patel", phone: "+91 76543 21098" },
    caller_position: { lat: 28.6139, lon: 77.209, accuracy_m: 300 },
    receiver_position: { lat: 28.65, lon: 77.23 },
    tower: { id: "DL001", location: "Connaught Place, Delhi" },
    proximity_pattern: "NEAR",
    distance_km: 4.5,
    call_duration: 720,
    call_time: "2025-02-10 09:15:00",
    risk_level: "HIGH",
  },
  {
    call_id: "CALL_002",
    caller: { id: "S2", name: "Amit Singh", phone: "+91 98765 43211" },
    receiver: { id: "S4", name: "Vikram Patel", phone: "+91 76543 21098" },
    caller_position: { lat: 28.59, lon: 77.18, accuracy_m: 250 },
    receiver_position: { lat: 28.65, lon: 77.23 },
    tower: { id: "DL002", location: "South Delhi" },
    proximity_pattern: "MEDIUM",
    distance_km: 8.2,
    call_duration: 450,
    call_time: "2025-02-11 14:30:00",
    risk_level: "MEDIUM",
  },
];

const mockTowers = [
  {
    tower_id: "DL001",
    location: "Connaught Place, Delhi",
    latitude: 28.6328,
    longitude: 77.2197,
  },
  {
    tower_id: "DL002",
    location: "South Delhi",
    latitude: 28.5494,
    longitude: 77.2001,
  },
  {
    tower_id: "DL003",
    location: "Noida Sector 18",
    latitude: 28.5706,
    longitude: 77.3218,
  },
];

const mockConvergence = [
  {
    victim_id: "V001",
    victim_name: "Sarah Johnson",
    convergence_lat: 28.62,
    convergence_lon: 77.215,
    unique_callers: 4,
    caller_names: ["Rajesh Kumar", "Amit Singh", "Priya Sharma", "Unknown"],
    total_interactions: 87,
    zone_severity: "CRITICAL" as const,
  },
];

export default function MapPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🗺️ Geolocation Map</h1>
          <p className="text-muted-foreground">
            Real-time tracking with triangulation accuracy ±300m
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            📥 Export Data
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">23</div>
          <div className="text-sm text-muted-foreground">Critical Patterns</div>
        </div>
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="text-2xl font-bold text-orange-600">47</div>
          <div className="text-sm text-muted-foreground">High Risk Calls</div>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-600">134</div>
          <div className="text-sm text-muted-foreground">Total Markers</div>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-sm text-muted-foreground">Convergence Zones</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <span>Caller Position</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">📡</span>
          <span>Cell Tower</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-red-500 rounded"></span>
          <span>Proximity Call (&lt;5km)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-orange-500 rounded"></span>
          <span>Long Call (&gt;10min)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-green-500 rounded"></span>
          <span>Normal Call</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔴</span>
          <span>Critical Zone</span>
        </div>
      </div>

      {/* Map */}
      <GeolocationMap
        markers={mockMarkers}
        cellTowers={mockTowers}
        convergencePoints={mockConvergence}
        center={[28.6139, 77.209]}
        zoom={11}
      />

      {/* Info Panel */}
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <strong>📍 Triangulation Accuracy:</strong> Urban Dense: ±200m | Urban:
        ±300m | Suburban: ±400m | Rural: ±500m
      </div>
    </div>
  );
}
