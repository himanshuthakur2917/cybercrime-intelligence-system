/**
 * Map Control Panel for Victim-Caller Analysis
 * Allows officers to select victims and view triangulation
 */

"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  IconMapPin,
  IconTarget,
  IconUsers,
  IconRefresh,
} from "@tabler/icons-react";

interface MapControlPanelProps {
  suspects: Array<{ id: string; name: string; phone: string }>;
  selectedVictimId?: string;
  selectedSuspectId?: string;
  onSelectVictim: (victimId: string | undefined) => void;
  onSelectSuspect: (suspectId: string | undefined) => void;
  onTriangulate: () => void;
  showConnections: boolean;
  onToggleConnections: (show: boolean) => void;
  triangulationLoading?: boolean;
  connectionCount?: number;
}

export const MapControlPanel: React.FC<MapControlPanelProps> = ({
  suspects,
  selectedVictimId,
  selectedSuspectId,
  onSelectVictim,
  onSelectSuspect,
  onTriangulate,
  showConnections,
  onToggleConnections,
  triangulationLoading = false,
  connectionCount = 0,
}) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Map Controls</h3>
        <IconMapPin className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Victim Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Select Victim to Analyze
        </Label>
        <select
          value={selectedVictimId || ""}
          onChange={(e) => onSelectVictim(e.target.value || undefined)}
          className="w-full bg-muted text-sm px-3 py-2 rounded border-none focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">-- Select Victim --</option>
          {suspects.map((suspect) => (
            <option key={suspect.id} value={suspect.id}>
              {suspect.name} ({suspect.phone})
            </option>
          ))}
        </select>
      </div>

      {/* Show Connections Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground flex items-center gap-2">
          <IconUsers className="h-3 w-3" />
          Show Call Connections
        </Label>
        <button
          onClick={() => onToggleConnections(!showConnections)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            showConnections ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showConnections ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {selectedVictimId && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          📞 {connectionCount} call{connectionCount !== 1 ? "s" : ""} found
        </div>
      )}

      <div className="border-t pt-3">
        {/* Suspect Selection for Triangulation */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Select Suspect for Triangulation
          </Label>
          <select
            value={selectedSuspectId || ""}
            onChange={(e) => onSelectSuspect(e.target.value || undefined)}
            className="w-full bg-muted text-sm px-3 py-2 rounded border-none focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">-- Select Suspect --</option>
            {suspects.map((suspect) => (
              <option key={suspect.id} value={suspect.id}>
                {suspect.name} ({suspect.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Triangulate Button */}
        <Button
          onClick={onTriangulate}
          disabled={!selectedSuspectId || triangulationLoading}
          className="w-full mt-3"
          size="sm"
        >
          {triangulationLoading ? (
            <>
              <IconRefresh className="h-3 w-3 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <IconTarget className="h-3 w-3 mr-2" />
              Triangulate Position
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
        <strong>💡 Tip:</strong> Triangulation uses multiple cell towers to
        estimate suspect location. More towers = higher accuracy.
      </div>
    </Card>
  );
};

export default MapControlPanel;
