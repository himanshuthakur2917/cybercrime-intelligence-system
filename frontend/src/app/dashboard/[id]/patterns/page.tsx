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

  // Pagination state
  const [patternPage, setPatternPage] = useState(1);
  const [relationPage, setRelationPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
          <>
            <div className="grid gap-3">
              {patterns
                .slice(
                  (patternPage - 1) * ITEMS_PER_PAGE,
                  patternPage * ITEMS_PER_PAGE
                )
                .map((p, idx: number) => (
                  <div
                    key={`${p.caller_id}-${p.victim_id}-${idx}`}
                    className={`bg-card border border-l-4 ${getRiskBorder(
                      p.harassment_severity
                    )} rounded-lg p-4 flex items-center justify-between`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                          SUSPECT
                        </span>
                        <span className="font-medium truncate">
                          {p.caller_name || "Unknown"}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded">
                          VICTIM
                        </span>
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
            </div>
            {/* Pagination Controls */}
            {patterns.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-muted-foreground">
                  Page {patternPage} of{" "}
                  {Math.ceil(patterns.length / ITEMS_PER_PAGE)}(
                  {patterns.length} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPatternPage((p) => Math.max(1, p - 1))}
                    disabled={patternPage === 1}
                    className="px-3 py-1 bg-muted rounded hover:bg-muted/80 disabled:opacity-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() =>
                      setPatternPage((p) =>
                        Math.min(
                          Math.ceil(patterns.length / ITEMS_PER_PAGE),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      patternPage >= Math.ceil(patterns.length / ITEMS_PER_PAGE)
                    }
                    className="px-3 py-1 bg-muted rounded hover:bg-muted/80 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
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
          <>
            <div className="bg-card border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span className="px-1 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded">
                          S
                        </span>
                        Caller
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span className="px-1 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded">
                          V
                        </span>
                        Victim
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Calls</th>
                    <th className="px-4 py-3 text-left font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {relationships
                    .slice(
                      (relationPage - 1) * ITEMS_PER_PAGE,
                      relationPage * ITEMS_PER_PAGE
                    )
                    .map((rel, idx: number) => (
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
            </div>
            {/* Pagination Controls */}
            {relationships.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-muted-foreground">
                  Page {relationPage} of{" "}
                  {Math.ceil(relationships.length / ITEMS_PER_PAGE)}(
                  {relationships.length} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRelationPage((p) => Math.max(1, p - 1))}
                    disabled={relationPage === 1}
                    className="px-3 py-1 bg-muted rounded hover:bg-muted/80 disabled:opacity-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() =>
                      setRelationPage((p) =>
                        Math.min(
                          Math.ceil(relationships.length / ITEMS_PER_PAGE),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      relationPage >=
                      Math.ceil(relationships.length / ITEMS_PER_PAGE)
                    }
                    className="px-3 py-1 bg-muted rounded hover:bg-muted/80 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
