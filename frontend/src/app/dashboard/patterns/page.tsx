"use client";

import React, { useState, useEffect } from "react";
import {
  IconAlertTriangle,
  IconPhone,
  IconUsers,
  IconMapPin,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Mock harassment patterns data
const mockPatterns = [
  {
    caller_id: "S1",
    caller_name: "Rajesh Kumar",
    caller_phone: "+91 98765 43210",
    victim_id: "V001",
    victim_name: "Sarah Johnson",
    victim_phone: "+91 98765 12345",
    evidence_count: 24,
    harassment_severity: "CRITICAL",
    recommended_action: "IMMEDIATE_ARREST",
  },
  {
    caller_id: "S2",
    caller_name: "Amit Singh",
    caller_phone: "+91 98765 43211",
    victim_id: "V001",
    victim_name: "Sarah Johnson",
    victim_phone: "+91 98765 12345",
    evidence_count: 18,
    harassment_severity: "HIGH",
    recommended_action: "URGENT_INVESTIGATION",
  },
  {
    caller_id: "S3",
    caller_name: "Priya Sharma",
    caller_phone: "+91 98765 43212",
    victim_id: "V002",
    victim_name: "Anil Desai",
    victim_phone: "+91 98765 67890",
    evidence_count: 12,
    harassment_severity: "MEDIUM",
    recommended_action: "HEIGHTENED_SURVEILLANCE",
  },
];

const mockRelationships = [
  {
    caller_name: "Rajesh Kumar",
    caller_phone: "+91 98765 43210",
    victim_name: "Vikram Patel",
    victim_phone: "+91 76543 21098",
    call_count: 12,
    total_duration: "45 min",
    pattern_type: "FREQUENT",
    risk_level: "HIGH",
  },
  {
    caller_name: "Amit Singh",
    caller_phone: "+91 98765 43211",
    victim_name: "Vikram Patel",
    victim_phone: "+91 76543 21098",
    call_count: 6,
    total_duration: "22 min",
    pattern_type: "REGULAR",
    risk_level: "MEDIUM",
  },
  {
    caller_name: "Priya Sharma",
    caller_phone: "+91 98765 43212",
    victim_name: "Vikram Patel",
    victim_phone: "+91 76543 21098",
    call_count: 20,
    total_duration: "78 min",
    pattern_type: "FREQUENT",
    risk_level: "CRITICAL",
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "border-destructive bg-destructive/5";
    case "HIGH":
      return "border-destructive/60 bg-destructive/5";
    case "MEDIUM":
      return "border-secondary bg-secondary/10";
    default:
      return "border-muted bg-muted/10";
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-destructive text-destructive-foreground";
    case "HIGH":
      return "bg-destructive/80 text-white";
    case "MEDIUM":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function PatternsPage() {
  const [data, setData] = useState<{
    patterns: any[];
    relationships: any[];
  }>({ patterns: [], relationships: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patternsData, mappingData] = await Promise.all([
          api.getPatterns("default"),
          api.getVictimMapping("default"),
        ]);

        setData({
          patterns: patternsData.harassmentPatterns || [],
          relationships: mappingData.relationships || [],
        });
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
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Analyzing Call Patterns...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCalls = data.relationships.reduce(
    (acc, r) => acc + r.call_count,
    0
  );
  const uniqueVictims = new Set(data.relationships.map((r) => r.victim_id))
    .size;
  // const proximityCalls = data.relationships.reduce((acc, r) => acc + (r.proximity_count || 0), 0); // Need this field in backend
  const highRisk = data.patterns.length; // Approximate

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">🔍 Pattern Analysis</h1>
        <p className="text-muted-foreground">
          Detected harassment patterns and caller-victim relationships
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <IconPhone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <div className="text-sm text-muted-foreground">Total Calls</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-secondary">
            <IconUsers className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{uniqueVictims}</div>
            <div className="text-sm text-muted-foreground">Unique Victims</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-muted">
            <IconMapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-muted-foreground">Proximity Calls</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-destructive/10">
            <IconAlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <div className="text-2xl font-bold">{highRisk}</div>
            <div className="text-sm text-muted-foreground">
              High Risk Patterns
            </div>
          </div>
        </div>
      </div>

      {/* Harassment Patterns */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          🚨 Detected Harassment Patterns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.patterns.map((pattern: any) => (
            <div
              key={`${pattern.caller_id}-${pattern.victim_id}`}
              className={`p-4 rounded-lg border-l-4 ${getSeverityColor(
                pattern.harassment_severity
              )}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">
                    {pattern.caller_name} → {pattern.victim_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Evidence: {pattern.evidence_count} proximity calls
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadge(
                    pattern.harassment_severity
                  )}`}
                >
                  {pattern.harassment_severity}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Caller:</strong> {pattern.caller_phone}
                </p>
                <p>
                  <strong>Victim:</strong> {pattern.victim_phone}
                </p>
                <p>
                  <strong>Action:</strong>{" "}
                  {pattern.recommended_action.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded hover:bg-secondary/80">
                  👁️ View
                </button>
                <button className="flex-1 px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded hover:bg-destructive/90">
                  ⚠️ Escalate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caller-Victim Relationships Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          🔗 Caller-Victim Relationships
        </h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Caller</th>
                <th className="px-4 py-3 text-left font-medium">Victim</th>
                <th className="px-4 py-3 text-left font-medium">Call Count</th>
                <th className="px-4 py-3 text-left font-medium">Duration</th>
                <th className="px-4 py-3 text-left font-medium">Pattern</th>
                <th className="px-4 py-3 text-left font-medium">Risk</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.relationships.map((rel: any, idx: number) => (
                <tr key={idx} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{rel.caller_name}</div>
                    <div className="text-muted-foreground text-xs">
                      {rel.caller_phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{rel.victim_name}</div>
                    <div className="text-muted-foreground text-xs">
                      {rel.victim_phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{rel.call_count}</td>
                  <td className="px-4 py-3">{rel.total_duration}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-700 text-xs">
                      {rel.pattern_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadge(
                        rel.risk_level
                      )}`}
                    >
                      {rel.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-2 py-1 text-xs bg-secondary rounded hover:bg-secondary/80">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
