"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  IconUser,
  IconMapPin,
  IconAccessPoint,
  IconFilter,
} from "@tabler/icons-react";

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

type FilterType = "all" | "known" | "unknown";

export default function MapPage() {
  const [data, setData] = useState<{
    markers: any[];
    cellTowers: any[];
    convergencePoints: any[];
  }>({ markers: [], cellTowers: [], convergencePoints: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [currentTimeIdx, setCurrentTimeIdx] = useState(0);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedInvId, setSelectedInvId] = useState("default");

  useEffect(() => {
    const fetchInvList = async () => {
      try {
        const list = await api.getInvestigations();
        setInvestigations(list || []);
        if (list?.length && selectedInvId === "default") {
          setSelectedInvId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch investigations", err);
      }
    };
    fetchInvList();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedInvId) return;
      setLoading(true);
      try {
        const [mapData, convergenceData] = await Promise.all([
          api.getMapData(selectedInvId),
          api.getVictimMapping(selectedInvId),
        ]);

        setData({
          markers: mapData.markers || [],
          cellTowers: mapData.cellTowers || [],
          convergencePoints: convergenceData.convergencePoints || [],
        });

        // Reset slider to max when data loads
        if (mapData.markers?.length) {
          setCurrentTimeIdx(mapData.markers.length - 1);
        } else {
          setCurrentTimeIdx(0);
        }
      } catch (err) {
        console.error("Failed to fetch map data", err);
        toast.error("Failed to load map data for " + selectedInvId);
        setData({ markers: [], cellTowers: [], convergencePoints: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedInvId]);

  // Sort and process markers for timeline
  const sortedMarkers = useMemo(() => {
    return [...data.markers].sort(
      (a, b) =>
        new Date(a.call_time).getTime() - new Date(b.call_time).getTime()
    );
  }, [data.markers]);

  const timeRange = useMemo(() => {
    if (!sortedMarkers.length)
      return { startLabel: "N/A", endLabel: "N/A", total: 0 };
    return {
      startLabel: new Date(sortedMarkers[0].call_time).toLocaleString(),
      endLabel: new Date(
        sortedMarkers[sortedMarkers.length - 1].call_time
      ).toLocaleString(),
      total: sortedMarkers.length,
    };
  }, [sortedMarkers]);

  const currentTimeLabel = useMemo(() => {
    if (!sortedMarkers[currentTimeIdx]) return "No Event Selected";
    return new Date(sortedMarkers[currentTimeIdx].call_time).toLocaleString();
  }, [sortedMarkers, currentTimeIdx]);

  // Filter markers based on known/unknown status
  const filteredMarkers = useMemo(() => {
    if (filter === "all") return data.markers;

    return data.markers.filter((m: any) => {
      const callerKnown = m.caller?.name && m.caller.name !== "Unknown";
      const receiverKnown = m.receiver?.name && m.receiver.name !== "Unknown";
      const hasKnownName = callerKnown || receiverKnown;

      return filter === "known" ? hasKnownName : !hasKnownName;
    });
  }, [data.markers, filter]);

  // Apply temporal filtering (show all events up to the selected point)
  const temporalFilteredMarkers = useMemo(() => {
    const maxTime = sortedMarkers[currentTimeIdx]?.call_time;
    if (!maxTime) return filteredMarkers;
    const maxDate = new Date(maxTime).getTime();

    return filteredMarkers.filter(
      (m: any) => new Date(m.call_time).getTime() <= maxDate
    );
  }, [filteredMarkers, sortedMarkers, currentTimeIdx]);

  // Filter convergence points based on known/unknown
  const filteredConvergence = useMemo(() => {
    if (filter === "all") return data.convergencePoints;

    return data.convergencePoints.filter((p: any) => {
      const victimKnown =
        p.victim_name &&
        p.victim_name !== "Unknown" &&
        p.victim_name !== "Unknown Victim";
      return filter === "known" ? victimKnown : !victimKnown;
    });
  }, [data.convergencePoints, filter]);

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
    <div className="flex flex-col gap-4 p-6">
      {/* Filter & Timeline Bar */}
      <div className="flex flex-col gap-4 bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <IconFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Filter:</span>
            <div className="flex gap-1">
              {(["all", "known", "unknown"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${
                    filter === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f === "all" ? "All" : f === "known" ? "Verified" : "Unknown"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Investigation:
            </span>
            <select
              value={selectedInvId}
              onChange={(e) => setSelectedInvId(e.target.value)}
              className="bg-muted text-[10px] font-mono font-bold px-2 py-1 rounded border-none focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="default">Default</option>
              {investigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.id})
                </option>
              ))}
            </select>
            <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded ml-2">
              {filteredMarkers.length} EVENTS
            </div>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              Timeline Analysis
            </span>
            <span className="text-[11px] font-mono text-primary font-bold">
              {currentTimeLabel}
            </span>
          </div>
          <div className="relative h-6 flex items-center">
            <input
              type="range"
              min={0}
              max={timeRange.total - 1}
              value={currentTimeIdx}
              onChange={(e) => setCurrentTimeIdx(parseInt(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>{timeRange.startLabel}</span>
            <span>{timeRange.endLabel}</span>
          </div>
        </div>
      </div>

      {/* Map Component */}
      <GeolocationMap
        markers={temporalFilteredMarkers}
        cellTowers={data.cellTowers}
        convergencePoints={filteredConvergence}
        center={[28.6139, 77.209]}
        zoom={11}
      />

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

      {/* Info Panel */}
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <strong>📍 Triangulation Accuracy:</strong> Urban Dense: ±200m | Urban:
        ±300m | Suburban: ±400m | Rural: ±500m
      </div>
    </div>
  );
}
