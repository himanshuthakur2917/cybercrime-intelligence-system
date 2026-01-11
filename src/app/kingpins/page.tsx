"use client";

import { riskColors, suspects } from "@/data/mockData";
import { ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import React, { useState } from "react";

export default function KingpinsPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"riskScore" | "name">("riskScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedSuspects = [...suspects].sort((a, b) => {
    const modifier = sortOrder === "asc" ? 1 : -1;
    if (sortField === "riskScore") {
      return (b.riskScore - a.riskScore) * modifier;
    }
    return a.name.localeCompare(b.name) * modifier;
  });

  const toggleSort = (field: "riskScore" | "name") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Kingpins Leaderboard
          </h1>
          <p className="text-sm text-[#8B949E]">
            Top suspects ranked by influence and risk score
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E] w-4 h-4" />
            <input
              type="text"
              placeholder="Search suspects..."
              className="bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pl-10 pr-4 text-sm text-[#E1E4E8] focus:outline-none focus:border-[#1E88E5] w-[200px]"
            />
          </div>
          <select className="bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-sm text-[#E1E4E8] focus:outline-none focus:border-[#1E88E5]">
            <option>All Risk Levels</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[700px]">
          {/* Table Header */}
          <thead>
            <tr className="table-header text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              <th className="text-left px-6 py-4 w-16">Rank</th>
              <th
                className="text-left px-4 py-4 cursor-pointer"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name
                  {sortField === "name" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </th>
              <th
                className="text-left px-4 py-4 w-36 cursor-pointer"
                onClick={() => toggleSort("riskScore")}
              >
                <div className="flex items-center gap-1">
                  Score
                  {sortField === "riskScore" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </th>
              <th className="text-left px-4 py-4 w-28">Role</th>
              <th className="text-left px-4 py-4 w-24">Risk</th>
              <th className="text-center px-4 py-4 w-16">Links</th>
              <th className="text-left px-4 py-4 w-24">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {sortedSuspects.map((suspect, index) => (
              <React.Fragment key={suspect.id}>
                {/* Main Row */}
                <tr
                  className="table-row cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === suspect.id ? null : suspect.id
                    )
                  }
                >
                  <td className="px-6 py-4 text-[#1E88E5] font-semibold">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-4 text-white font-medium">
                    {suspect.name}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1E88E5] font-mono w-10">
                        {suspect.riskScore}%
                      </span>
                      <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full w-16">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${suspect.riskScore}%`,
                            backgroundColor: riskColors[suspect.riskLevel],
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#8B949E] text-sm">
                    {suspect.role}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold inline-block"
                      style={{
                        backgroundColor: riskColors[suspect.riskLevel],
                        color: suspect.riskLevel === "medium" ? "#000" : "#fff",
                      }}
                    >
                      {suspect.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-white font-mono">
                    {suspects.length - 1}
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-[#1E88E5] hover:text-[#00BCD4] text-sm flex items-center gap-1">
                      Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedRow === suspect.id && (
                  <tr
                    key={`${suspect.id}-expanded`}
                    className="bg-[rgba(255,255,255,0.02)]"
                  >
                    <td
                      colSpan={7}
                      className="px-6 py-4 border-t border-[rgba(255,255,255,0.05)]"
                    >
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <span className="text-[#6E7681]">Phone:</span>
                          <span className="text-white font-mono ml-2">
                            {suspect.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6E7681]">Account:</span>
                          <span className="text-white font-mono ml-2">
                            {suspect.account}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6E7681]">Total Calls:</span>
                          <span className="text-white font-mono ml-2">
                            {suspect.callsInitiated + suspect.callsReceived}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6E7681]">Centrality:</span>
                          <span className="text-[#1E88E5] font-mono ml-2">
                            {suspect.centralityScore}/100
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strategic Recommendations */}
      <div className="glass-card-static mt-6 p-6 border-l-4 border-l-[#1E88E5]">
        <h3 className="text-lg font-semibold text-white mb-4">
          Strategic Recommendations
        </h3>
        <div className="space-y-3 text-sm text-[#E1E4E8]">
          <p>
            1. <strong className="text-white">Arrest #1 (Vikram)</strong> first
            → Network collapses
          </p>
          <p>
            2.{" "}
            <strong className="text-white">
              Coordinate simultaneous arrest
            </strong>{" "}
            with #2, #3, #4
          </p>
          <p>
            3. <strong className="text-white">#5 (Neha)</strong> is low-risk,
            potential informant
          </p>
          <div className="pt-3 flex gap-3">
            <button className="btn-primary text-sm py-2">
              Generate Arrest Playbook
            </button>
            <button className="btn-secondary text-sm py-2">
              Export as PDF
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}