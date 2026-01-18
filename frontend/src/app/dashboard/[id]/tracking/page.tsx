"use client";
import React, { useState, useEffect } from "react";
import { IconTarget } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import SuspectTrackingMap from "@/components/dashboard/map/SuspectTrackingMap";

export default function TrackingPage() {
  const params = useParams();
  const caseId = params?.id as string;

  const [suspects, setSuspects] = useState<any[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState("");
  const [trajectory, setTrajectory] = useState<any[]>([]);
  const [triangulation, setTriangulation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncingTowers, setSyncingTowers] = useState(false);
  const [towersSynced, setTowersSynced] = useState(false);

  // Sync towers on mount (runs once)
  useEffect(() => {
    const syncTowers = async () => {
      if (!caseId || towersSynced) return;

      setSyncingTowers(true);
      try {
        console.log("Syncing cell towers from Supabase to Neo4j...");
        const result = await api.syncTowers(caseId);
        console.log("Tower sync result:", result);

        const count = result?.towerCount || result?.data?.towerCount || 0;
        if (count > 0) {
          toast.success(`Synced ${count} cell towers successfully`);
        }

        setTowersSynced(true);
      } catch (error) {
        console.error("Failed to sync towers:", error);
        // Don't block the UI if sync fails - trajectory might still work
        toast.warning("Tower sync failed, but continuing...");
        setTowersSynced(true); // Mark as attempted
      } finally {
        setSyncingTowers(false);
      }
    };

    syncTowers();
  }, [caseId, towersSynced]);

  // Fetch suspects list after towers are synced
  useEffect(() => {
    const fetchSuspects = async () => {
      if (!caseId || !towersSynced) return;

      try {
        // Rajendra Kumar Agarwal's phone from case/victim.csv
        const victimPhone = "9876543210";

        const data = await api.getSuspectsForVictim(caseId, victimPhone);
        console.log("Suspects for victim response:", data);

        const suspects = data?.suspects || data?.data?.suspects || [];

        const suspectList = suspects.map((s: any) => ({
          id: s.suspect_id,
          name: s.suspect_name || "Unknown",
          phone: s.suspect_phone || "N/A",
          connectionType: s.connection_type || "UNKNOWN",
          interactionCount: s.interaction_count || 0,
          riskLevel: s.risk_level || "UNKNOWN",
        }));

        console.log(
          `Found ${suspectList.length} suspects who called victim ${victimPhone}`,
        );

        setSuspects(suspectList);
        if (suspectList.length > 0 && !selectedSuspect) {
          setSelectedSuspect(suspectList[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch suspects for victim", error);
        toast.error("Failed to load suspects list");
        setSuspects([]);
        setLoading(false);
      }
    };

    fetchSuspects();
  }, [caseId, towersSynced]);

  // Fetch tracking data when suspect changes
  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!caseId || !selectedSuspect) return;
      try {
        const [trajResponse, triResponse] = await Promise.all([
          api.getTrajectory(caseId, selectedSuspect),
          api.triangulateSuspectLocation(caseId, selectedSuspect),
        ]);

        console.log("Raw trajectory response:", trajResponse);
        console.log("Raw triangulation response:", triResponse);

        // Backend returns: { data: { trajectory: [...], pointCount: N } }
        const trajData =
          trajResponse?.data?.trajectory || trajResponse?.trajectory || [];

        // Backend returns: { data: { triangulation: {...} } }
        const triData =
          triResponse?.data?.triangulation ||
          triResponse?.triangulation ||
          null;

        console.log("Extracted trajectory:", trajData);
        console.log("Extracted triangulation:", triData);

        setTrajectory(Array.isArray(trajData) ? trajData : []);
        setTriangulation(triData);
      } catch (error) {
        console.error("Failed to fetch tracking data", error);
        setTrajectory([]);
        setTriangulation(null);
      }
    };

    fetchTrackingData();
  }, [caseId, selectedSuspect]);

  if (syncingTowers) {
    return (
      <div className="p-6 flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        <span>Syncing cell towers...</span>
      </div>
    );
  }

  if (loading && suspects.length === 0) {
    return (
      <div className="p-6 flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        <span>Loading tracking system...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-w-full mx-auto">
      {/* Simplified Header */}
      <div className="flex flex-col md:flex-row md:items-center  w-full justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <IconTarget className="h-7 w-7 text-primary" />
            Suspect Tracking
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualizing suspect movement based on tower pings
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <label className="text-xs font-bold text-muted-foreground px-2 uppercase">
            Suspect
          </label>
          <select
            value={selectedSuspect}
            onChange={(e) => setSelectedSuspect(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-background text-sm font-medium focus:ring-2 focus:ring-primary outline-none min-w-[200px]"
          >
            {suspects.map((suspect) => (
              <option key={suspect.id} value={suspect.id}>
                {suspect.name} ({suspect.phone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simplified Main Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-semibold text-muted-foreground">
            {trajectory.length} TOWER PINGS DETECTED
          </span>
          {triangulation && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
              ESTIMATED RADIUS: {Math.round(triangulation.accuracyMeters)}m
            </span>
          )}
        </div>

        <div className="border rounded-2xl overflow-hidden shadow-sm">
          <SuspectTrackingMap
            trajectory={trajectory}
            triangulation={triangulation}
            selectedSuspectName={
              suspects.find((s) => s.id === selectedSuspect)?.name
            }
          />
        </div>
      </div>
    </div>
  );
}
