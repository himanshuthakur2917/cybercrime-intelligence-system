"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { IconFilter } from "@tabler/icons-react";
import MapControlPanel from "@/components/dashboard/map/MapControlPanel";
import RangeControl from "@/components/dashboard/map/RangeControl";

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
  },
);

type FilterType = "all" | "known" | "unknown";

export default function MapPage() {
  const params = useParams();
  const caseId = params.id as string; // Extract case ID from URL

  const [data, setData] = useState<{
    markers: any[];
    cellTowers: any[];
  }>({ markers: [], cellTowers: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [rangeKm, setRangeKm] = useState<number>(10);
  const [selectedVictimId, setSelectedVictimId] = useState<
    string | undefined
  >();
  const [selectedSuspectId, setSelectedSuspectId] = useState<
    string | undefined
  >();
  const [showConnections, setShowConnections] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [triangulation, setTriangulation] = useState<any | null>(null);
  const [triangulationLoading, setTriangulationLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!caseId) return;
      setLoading(true);
      try {
        const [mapData] = await Promise.all([api.getMapData(caseId)]);
        console.log("[MapPage] mapData received:", mapData);

        setData({
          markers: mapData.markers || [],
          cellTowers: mapData.cellTowers || [],
        });
      } catch (err) {
        console.error("Failed to fetch map data", err);
        toast.error("Failed to load map data");
        setData({ markers: [], cellTowers: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [caseId]);

  // Fetch victim-caller connections when victim is selected
  useEffect(() => {
    if (!selectedVictimId || !caseId) {
      setConnections([]);
      return;
    }

    const fetchConnections = async () => {
      try {
        const response = await api.getVictimCallerMap(
          caseId,
          selectedVictimId,
          rangeKm,
        );
        setConnections(response.connections || []);
        toast.success(
          `Found ${response.connections?.length || 0} call connections`,
        );
      } catch (err) {
        console.error("Failed to fetch connections:", err);
        toast.error("Failed to load victim-caller connections");
        setConnections([]);
      }
    };

    fetchConnections();
  }, [selectedVictimId, caseId, rangeKm]);

  // Triangulate suspect location
  const handleTriangulate = async () => {
    if (!selectedSuspectId || !caseId) return;

    setTriangulationLoading(true);
    try {
      const response = await api.triangulateSuspectLocation(
        caseId,
        selectedSuspectId,
      );
      setTriangulation(response.triangulation);
      toast.success(
        `Location estimated with ${response.triangulation.confidence} confidence`,
      );
    } catch (err) {
      console.error("Triangulation failed:", err);
      toast.error("Failed to triangulate suspect location");
    } finally {
      setTriangulationLoading(false);
    }
  };

  // Handle range change
  const handleRangeChange = (range: number, unit: "meters" | "km") => {
    const rangeInKm = unit === "meters" ? range / 1000 : range;
    setRangeKm(rangeInKm);
  };

  // Sort and process markers for timeline

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

  // Applied temporal filtering (identity for now)
  const temporalFilteredMarkers = filteredMarkers;

  // Get unique suspects for selection (must be before conditional returns)
  const suspects = useMemo(() => {
    const suspectMap = new Map();
    data.markers.forEach((marker: any) => {
      if (marker.caller?.id && !suspectMap.has(marker.caller.id)) {
        suspectMap.set(marker.caller.id, {
          id: marker.caller.id,
          name: marker.caller.name,
          phone: marker.caller.phone,
        });
      }
      if (marker.receiver?.id && !suspectMap.has(marker.receiver.id)) {
        suspectMap.set(marker.receiver.id, {
          id: marker.receiver.id,
          name: marker.receiver.name,
          phone: marker.receiver.phone,
        });
      }
    });
    return Array.from(suspectMap.values());
  }, [data.markers]);

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
    <div className="flex gap-4 p-6">
      {/* Left Sidebar - Controls */}
      <div className="w-80 space-y-4 flex-shrink-0">
        <MapControlPanel
          suspects={suspects}
          selectedVictimId={selectedVictimId}
          selectedSuspectId={selectedSuspectId}
          onSelectVictim={setSelectedVictimId}
          onSelectSuspect={setSelectedSuspectId}
          onTriangulate={handleTriangulate}
          showConnections={showConnections}
          onToggleConnections={setShowConnections}
          triangulationLoading={triangulationLoading}
          connectionCount={connections.length}
        />

        <RangeControl
          onRangeChange={handleRangeChange}
          defaultRange={10}
          defaultUnit="km"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
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
                    {f === "all"
                      ? "All"
                      : f === "known"
                        ? "Verified"
                        : "Unknown"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                Case ID:
              </span>
              <div className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-muted">
                {caseId}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded ml-2">
                {filteredMarkers.length} EVENTS
              </div>
            </div>
          </div>
        </div>

        {/* Map Component */}
        <GeolocationMap
          markers={temporalFilteredMarkers}
          cellTowers={data.cellTowers}
          center={[28.6139, 77.209]}
          zoom={11}
        />
      </div>
    </div>
  );
}
