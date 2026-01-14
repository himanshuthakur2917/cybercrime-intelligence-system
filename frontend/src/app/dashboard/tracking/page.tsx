"use client";
import React, { useState, useEffect } from "react";
import {
  IconMapPin,
  IconClock,
  IconPhone,
  IconTarget,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Mock data removed in favor of API

export default function TrackingPage() {
  const [suspects, setSuspects] = useState<any[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState("");
  const [trajectory, setTrajectory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch suspects list on mount (derived from victim relationships)
  useEffect(() => {
    const fetchSuspects = async () => {
      try {
        const data = await api.getVictimMapping("default");
        const uniqueSuspects = new Map();

        // Extract suspects from new victim relationships structure
        data.relationships?.forEach((rel: any) => {
          // Handle new structure with connected_suspects array
          if (rel.connected_suspects && Array.isArray(rel.connected_suspects)) {
            rel.connected_suspects.forEach((suspect: any) => {
              if (
                suspect.suspect_id &&
                !uniqueSuspects.has(suspect.suspect_id)
              ) {
                uniqueSuspects.set(suspect.suspect_id, {
                  id: suspect.suspect_id,
                  name: suspect.suspect_name || "Unknown",
                  phone: suspect.suspect_phone || "N/A",
                });
              }
            });
          }
          // Fallback for old structure with caller_id
          else if (rel.caller_id && !uniqueSuspects.has(rel.caller_id)) {
            uniqueSuspects.set(rel.caller_id, {
              id: rel.caller_id,
              name: rel.caller_name || "Unknown",
              phone: rel.caller_phone || "N/A",
            });
          }
        });

        const suspectList = Array.from(uniqueSuspects.values());
        setSuspects(suspectList);
        if (suspectList.length > 0) {
          setSelectedSuspect(suspectList[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch suspects", error);
        toast.error("Failed to load suspects list");
        setLoading(false);
      }
    };
    fetchSuspects();
  }, []);

  // Fetch trajectory when suspect changes
  useEffect(() => {
    if (!selectedSuspect) return;

    const fetchTrackingData = async () => {
      try {
        const [trajData, predData] = await Promise.all([
          api.getTrajectory("default", selectedSuspect),
          api.getPrediction("default", selectedSuspect),
        ]);

        setTrajectory(trajData.trajectory || []);
        setPrediction(predData.currentLocationPrediction);
      } catch (error) {
        console.error("Failed to fetch tracking data", error);
      }
    };

    fetchTrackingData();
  }, [selectedSuspect]);

  if (loading && suspects.length === 0) {
    return <div className="p-6">Loading tracking system...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎯 Suspect Tracking</h1>
          <p className="text-muted-foreground">
            Real-time movement tracking with triangulated positions
          </p>
        </div>
      </div>

      {/* Suspect Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Select Suspect:</label>
        <select
          value={selectedSuspect}
          onChange={(e) => setSelectedSuspect(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background"
        >
          {suspects.map((suspect) => (
            <option key={suspect.id} value={suspect.id}>
              {suspect.name} ({suspect.phone})
            </option>
          ))}
        </select>
      </div>

      {/* Current/Predicted Location */}
      {prediction ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card border shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
              <IconMapPin className="h-5 w-5 text-primary" />
              Last Known Position
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                <strong className="text-foreground">Location:</strong>{" "}
                {prediction.last_known_position?.latitude?.toFixed?.(4) ??
                  "N/A"}
                °N,{" "}
                {prediction.last_known_position?.longitude?.toFixed?.(4) ??
                  "N/A"}
                °E
              </p>
              <p>
                <strong className="text-foreground">Accuracy:</strong> ±
                {prediction.last_known_position?.accuracy_m ??
                  prediction.last_known_position?.tower_id ??
                  "N/A"}
                m
              </p>
              <p>
                <strong className="text-foreground">Timestamp:</strong>{" "}
                {prediction.last_known_position?.timestamp ?? "Unknown"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
              <IconTarget className="h-5 w-5 text-primary" />
              Predicted Location
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                <strong className="text-foreground">Area:</strong>{" "}
                {prediction.predicted_location}
              </p>
              <p>
                <strong className="text-foreground">Confidence:</strong>{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    prediction.confidence_level === "HIGH"
                      ? "bg-primary text-primary-foreground"
                      : prediction.confidence_level === "MEDIUM"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {prediction.confidence_level}
                </span>
              </p>
              <p>
                <strong className="text-foreground">Pattern:</strong>{" "}
                {prediction.movement_pattern?.join(" → ")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed rounded-xl bg-muted/30 text-center text-muted-foreground">
          Select a suspect to view AI prediction analysis.
        </div>
      )}

      {/* Movement Trajectory */}
      <div>
        <h2 className="text-xl font-semibold mb-4">📍 Movement Trajectory</h2>
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-4">
            {trajectory.map((point, idx) => (
              <div key={idx} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 w-4 h-4 rounded-full border-2 border-background z-10 ${
                    idx === 0
                      ? "bg-primary ring-2 ring-primary/20"
                      : "bg-muted-foreground"
                  }`}
                ></div>

                {/* Card */}
                <div className="p-4 rounded-xl bg-card border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">
                      Position {idx + 1}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground flex items-center gap-1">
                      <IconClock className="h-3 w-3" />
                      {point.timestamp}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
                        Tower Location
                      </p>
                      <p className="font-medium text-foreground">
                        {point.tower_location}
                      </p>
                      <p className="text-xs text-muted-foreground/80 font-mono mt-0.5">
                        ID: {point.tower_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
                        Coordinates
                      </p>
                      <p className="font-medium text-foreground">
                        {point.position?.latitude?.toFixed?.(4) ?? "N/A"}°N,{" "}
                        {point.position?.longitude?.toFixed?.(4) ?? "N/A"}°E
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        Tower: {point.position?.tower_id ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
                        Recipient
                      </p>
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        <IconPhone className="h-3.5 w-3.5 text-primary" />
                        {point.receiver_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
                        Call Duration
                      </p>
                      <p className="font-medium text-foreground">
                        {Math.floor(point.duration_seconds / 60)}m{" "}
                        {point.duration_seconds % 60}s
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          📥 Export Trajectory (JSON)
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
          🗺️ Export KML (Google Earth)
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
          🖨️ Print Report
        </button>
      </div>
    </div>
  );
}
