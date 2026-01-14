"use client";

import React, { useState, useEffect } from "react";
import {
  IconAlertTriangle,
  IconPhone,
  IconUsers,
  IconShield,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "CRITICAL":
      return "bg-red-500 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MEDIUM":
      return "bg-yellow-500 text-black";
    default:
      return "bg-gray-500 text-white";
  }
};

const getRiskBorder = (risk: string) => {
  switch (risk) {
    case "CRITICAL":
      return "border-l-red-500";
    case "HIGH":
      return "border-l-orange-500";
    case "MEDIUM":
      return "border-l-yellow-500";
    default:
      return "border-l-gray-500";
  }
};

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patternsData, mappingData] = await Promise.all([
          api.getPatterns("default"),
          api.getVictimMapping("default"),
        ]);

        setPatterns(patternsData.harassmentPatterns || []);
        setRelationships(mappingData.relationships || []);
      } catch (err) {
        console.error("Failed to fetch patterns", err);
        toast.error("Failed to load pattern analysis.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Analyzing patterns...</p>
        </div>
      </div>
    );
  }

  // Stats
  const totalCalls = relationships.reduce(
    (acc, r) => acc + (r.call_count || 0),
    0
  );
  const uniqueVictims = new Set(relationships.map((r) => r.victim_id)).size;
  const criticalPatterns = patterns.filter(
    (p) =>
      p.harassment_severity === "CRITICAL" || p.harassment_severity === "HIGH"
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <IconShield className="h-7 w-7 text-primary" />
          Pattern Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Harassment patterns detected from call data
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <IconPhone className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-xl font-bold">{totalCalls}</div>
            <div className="text-xs text-muted-foreground">Total Calls</div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <IconUsers className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="text-xl font-bold">{uniqueVictims}</div>
            <div className="text-xs text-muted-foreground">Victims</div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <IconAlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="text-xl font-bold">{patterns.length}</div>
            <div className="text-xs text-muted-foreground">Patterns</div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <IconAlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <div className="text-xl font-bold">{criticalPatterns}</div>
            <div className="text-xs text-muted-foreground">High Risk</div>
          </div>
        </div>
      </div>

      {/* Patterns List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Detected Patterns</h2>
        {patterns.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <IconShield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No harassment patterns detected.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {patterns.slice(0, 20).map((p: any, idx: number) => (
              <div
                key={`${p.caller_id}-${p.victim_id}-${idx}`}
                className={`bg-card border border-l-4 ${getRiskBorder(
                  p.harassment_severity
                )} rounded-lg p-4 flex items-center justify-between`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {p.caller_name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium truncate">
                      {p.victim_name || "Unknown"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {p.evidence_count || 0} calls detected
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(
                    p.harassment_severity
                  )}`}
                >
                  {p.harassment_severity || "UNKNOWN"}
                </span>
              </div>
            ))}
            {patterns.length > 20 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                +{patterns.length - 20} more patterns
              </p>
            )}
          </div>
        )}
      </div>

      {/* Relationships Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Caller-Victim Links</h2>
        {relationships.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No relationships found.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Caller</th>
                  <th className="px-4 py-3 text-left font-medium">Victim</th>
                  <th className="px-4 py-3 text-left font-medium">Calls</th>
                  <th className="px-4 py-3 text-left font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {relationships.slice(0, 15).map((rel: any, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {rel.caller_name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rel.caller_phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {rel.victim_name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rel.victim_phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {rel.call_count || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(
                          rel.risk_level
                        )}`}
                      >
                        {rel.risk_level || "LOW"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {relationships.length > 15 && (
              <div className="px-4 py-2 text-sm text-muted-foreground text-center border-t">
                Showing 15 of {relationships.length} relationships
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
