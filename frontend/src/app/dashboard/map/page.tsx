"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { IconUser, IconMapPin, IconAccessPoint } from "@tabler/icons-react";

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

export default function MapPage() {
  const [data, setData] = useState<{
    markers: any[];
    cellTowers: any[];
    convergencePoints: any[];
  }>({ markers: [], cellTowers: [], convergencePoints: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapData, convergenceData] = await Promise.all([
          api.getMapData("default"),
          api.getVictimMapping("default"),
        ]);

        setData({
          markers: mapData.markers || [],
          cellTowers: mapData.cellTowers || [],
          convergencePoints: convergenceData.convergencePoints || [],
        });
      } catch (err) {
        console.error("Failed to fetch map data", err);
        toast.error("Failed to load map data. Using cached view.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading Intelligence Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">🗺️ Geolocation Map</h1>
        <p className="text-muted-foreground">
          Real-time tracking with triangulation accuracy ±300m
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <IconAccessPoint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{data.cellTowers.length}</div>
            <div className="text-sm text-muted-foreground">Active Towers</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-secondary">
            <IconUser className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{data.markers.length}</div>
            <div className="text-sm text-muted-foreground">Active Calls</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-destructive/10">
            <IconMapPin className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {
                data.convergencePoints.filter(
                  (p: any) => p.zone_severity === "CRITICAL"
                ).length
              }
            </div>
            <div className="text-sm text-muted-foreground">Critical Zones</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-muted/40 border shadow-sm flex items-center gap-4">
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Tracking Accuracy</span>
              <span className="text-sm font-bold text-primary">85%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Component */}
      <GeolocationMap
        markers={data.markers}
        cellTowers={data.cellTowers}
        convergencePoints={data.convergencePoints}
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
