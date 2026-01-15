"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconDatabase,
  IconUpload,
  IconMapPin,
  IconShield,
  IconCheck,
  IconX,
  IconLoader,
} from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface UploadResult {
  success: number;
  errors: number;
  message: string;
}

export default function AdminUploadPage() {
  const [towerFile, setTowerFile] = useState<File | null>(null);
  const [zoneFile, setZoneFile] = useState<File | null>(null);
  const [towerResult, setTowerResult] = useState<UploadResult | null>(null);
  const [zoneResult, setZoneResult] = useState<UploadResult | null>(null);
  const [towerLoading, setTowerLoading] = useState(false);
  const [zoneLoading, setZoneLoading] = useState(false);

  const handleTowerUpload = async () => {
    if (!towerFile) return;
    setTowerLoading(true);
    setTowerResult(null);

    const formData = new FormData();
    formData.append("file", towerFile);

    try {
      const res = await fetch(`${API_URL}/admin/upload/towers`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setTowerResult(data);
    } catch {
      setTowerResult({ success: 0, errors: 1, message: "Upload failed" });
    } finally {
      setTowerLoading(false);
    }
  };

  const handleZoneUpload = async () => {
    if (!zoneFile) return;
    setZoneLoading(true);
    setZoneResult(null);

    const formData = new FormData();
    formData.append("file", zoneFile);

    try {
      const res = await fetch(`${API_URL}/admin/upload/zones`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setZoneResult(data);
    } catch {
      setZoneResult({ success: 0, errors: 1, message: "Upload failed" });
    } finally {
      setZoneLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <IconDatabase className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">🏛️ Admin Data Ingestion</h1>
          <p className="text-muted-foreground">
            Upload infrastructure data to Supabase PostGIS
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <IconShield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Admin Only</p>
            <p className="text-muted-foreground mt-1">
              This page is for uploading system-wide infrastructure data. Cell
              towers and restricted zones are stored in Supabase PostGIS for
              geospatial queries.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cell Towers Upload */}
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <IconMapPin className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">Cell Towers</h2>
              <p className="text-xs text-muted-foreground">
                Upload to Supabase PostGIS
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tower-file">cell_towers.csv</Label>
            <Input
              id="tower-file"
              type="file"
              accept=".csv"
              onChange={(e) => setTowerFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Required columns: cell_id, name, lat, lon, range_km
            </p>
          </div>

          <Button
            onClick={handleTowerUpload}
            disabled={!towerFile || towerLoading}
            className="w-full"
          >
            {towerLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" /> Upload Cell Towers
              </>
            )}
          </Button>

          {towerResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                towerResult.success > 0
                  ? "bg-green-500/10 text-green-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {towerResult.success > 0 ? (
                  <IconCheck className="h-4 w-4" />
                ) : (
                  <IconX className="h-4 w-4" />
                )}
                <span>{towerResult.message}</span>
              </div>
              <div className="mt-1 text-xs">
                ✓ {towerResult.success.toLocaleString()} ingested | ✗{" "}
                {towerResult.errors} errors
              </div>
            </div>
          )}
        </div>

        {/* Restricted Zones Upload */}
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <IconShield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold">Restricted Zones</h2>
              <p className="text-xs text-muted-foreground">
                Geofence areas for alerts
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone-file">restricted_zones.csv</Label>
            <Input
              id="zone-file"
              type="file"
              accept=".csv"
              onChange={(e) => setZoneFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Required: zone_id, name, type, threat_level, center_lat,
              center_lon, radius_km
            </p>
          </div>

          <Button
            onClick={handleZoneUpload}
            disabled={!zoneFile || zoneLoading}
            className="w-full"
          >
            {zoneLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" /> Upload Restricted Zones
              </>
            )}
          </Button>

          {zoneResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                zoneResult.success > 0
                  ? "bg-green-500/10 text-green-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {zoneResult.success > 0 ? (
                  <IconCheck className="h-4 w-4" />
                ) : (
                  <IconX className="h-4 w-4" />
                )}
                <span>{zoneResult.message}</span>
              </div>
              <div className="mt-1 text-xs">
                ✓ {zoneResult.success.toLocaleString()} ingested | ✗{" "}
                {zoneResult.errors} errors
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <h3 className="font-semibold mb-2">📋 How It Works</h3>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            • <strong>Cell Towers</strong> are used for CDR location
            triangulation on the map
          </li>
          <li>
            • <strong>Restricted Zones</strong> trigger alerts when suspects
            enter sensitive areas
          </li>
          <li>
            • Data is stored in Supabase PostGIS for fast geospatial queries
          </li>
          <li>
            • Duplicates are automatically skipped based on cell_id/zone_id
          </li>
        </ul>
      </div>
    </div>
  );
}
