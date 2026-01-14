"use client";

import React from "react";
import {
  IconAlertTriangle,
  IconPhone,
  IconUsers,
  IconMapPin,
} from "@tabler/icons-react";

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
      return "bg-red-500/10 border-red-500/50 text-red-700";
    case "HIGH":
      return "bg-orange-500/10 border-orange-500/50 text-orange-700";
    case "MEDIUM":
      return "bg-yellow-500/10 border-yellow-500/50 text-yellow-700";
    default:
      return "bg-green-500/10 border-green-500/50 text-green-700";
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MEDIUM":
      return "bg-yellow-500 text-black";
    default:
      return "bg-green-500 text-white";
  }
};

export default function PatternsPage() {
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
        <div className="p-4 rounded-lg bg-card border flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-500/10">
            <IconPhone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">134</div>
            <div className="text-sm text-muted-foreground">Total Calls</div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-500/10">
            <IconUsers className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">23</div>
            <div className="text-sm text-muted-foreground">Unique Victims</div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border flex items-center gap-4">
          <div className="p-3 rounded-full bg-orange-500/10">
            <IconMapPin className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">45</div>
            <div className="text-sm text-muted-foreground">Proximity Calls</div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-500/10">
            <IconAlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">12</div>
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
          {mockPatterns.map((pattern) => (
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
                <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  👁️ View
                </button>
                <button className="flex-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
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
              {mockRelationships.map((rel, idx) => (
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
