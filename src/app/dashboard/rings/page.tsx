import React from 'react'


    // <div>
      // {/* Fraud Ring detection page goes here */}
    // </div>
  
"use client";

import { AlertTriangle, ExternalLink, Users } from "lucide-react";
import {
  fraudRings,
  suspects,
  riskColors,
  formatCurrency,
  getSuspectById,
} from "@/data/mockData";

export default function RingsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Fraud Rings Detection
        </h1>
        <p className="text-sm text-[#8B949E]">
          Total Rings Detected:{" "}
          <span className="text-[#1E88E5] font-semibold">
            {fraudRings.length}
          </span>
        </p>
      </div>

      {/* Ring Cards */}
      <div className="space-y-6">
        {fraudRings.map((ring) => (
          <div key={ring.id} className="glass-card-static overflow-hidden">
            {/* Card Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${riskColors[ring.riskLevel]}20` }}
                >
                  <Users
                    className="w-5 h-5"
                    style={{ color: riskColors[ring.riskLevel] }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Ring #{ring.id}: {ring.name}
                  </h3>
                  <p className="text-xs text-[#8B949E]">
                    {ring.members.length} members
                  </p>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded text-xs font-bold"
                style={{
                  backgroundColor: riskColors[ring.riskLevel],
                  color:
                    (ring.riskLevel as string) === "medium" ? "#000" : "#fff",
                }}
              >
                {ring.status.toUpperCase()} • {ring.riskLevel.toUpperCase()}
              </span>
            </div>

            {/* Ring Visualization */}
            <div className="p-6 bg-[rgba(10,15,20,0.5)]">
              <div className="flex flex-wrap gap-4 justify-center">
                {ring.members.map((memberId, idx) => {
                  const member = getSuspectById(memberId);
                  if (!member) return null;
                  return (
                    <div
                      key={memberId}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-2"
                        style={{
                          backgroundColor: `${riskColors[member.riskLevel]}30`,
                          borderColor: riskColors[member.riskLevel],
                        }}
                      >
                        {member.id}
                      </div>
                      <span className="text-xs text-[#8B949E]">
                        {member.name.split(" ")[0]}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: riskColors[member.riskLevel] }}
                      >
                        {member.role}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connection Lines (simplified text representation) */}
              {ring.id === 1 && (
                <div className="mt-6 text-center font-mono text-xs text-[#6E7681]">
                  <p>S1 ←──12 calls──→ S4 ←──6 calls──→ S2</p>
                  <p className="mt-1">↓ 20 calls ↓</p>
                  <p>S3 ←────→ (Hub)</p>
                </div>
              )}
            </div>

            {/* Ring Characteristics */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-[#6E7681] mb-1">Ring Size</p>
                <p className="text-xl font-bold text-white">
                  {ring.characteristics.size} suspects
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-[#6E7681] mb-1">Density</p>
                <p className="text-xl font-bold text-white">
                  {ring.characteristics.density}%
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-[#6E7681] mb-1">Total Calls</p>
                <p className="text-xl font-bold text-white">
                  {ring.characteristics.totalCalls}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-[#6E7681] mb-1">Money Flow</p>
                <p className="text-xl font-bold text-[#1E88E5]">
                  {formatCurrency(ring.characteristics.totalMoney)}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="px-6 pb-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#6E7681]">Pattern:</span>
                <span className="text-white">
                  {ring.characteristics.pattern}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#6E7681]">Activity:</span>
                <span className="text-white">
                  {ring.characteristics.activityPeriod}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#6E7681]">Likelihood:</span>
                <span className="text-[#D32F2F] font-bold">
                  {ring.characteristics.likelihood}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button className="btn-primary text-sm py-2 flex items-center gap-2">
                View Detailed Network <ExternalLink className="w-4 h-4" />
              </button>
              <button className="btn-secondary text-sm py-2">
                Export Visualization
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Box */}
      <div className="glass-card-static mt-6 p-6 border-t-4 border-t-[#1E88E5]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#F57C00]" />
          Summary & Operational Insights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-[#6E7681] mb-1">Total Rings</p>
            <p className="text-2xl font-bold text-[#1E88E5]">
              {fraudRings.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6E7681] mb-1">Total Suspects</p>
            <p className="text-2xl font-bold text-white">{suspects.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#6E7681] mb-1">
              Suspicious Transactions
            </p>
            <p className="text-2xl font-bold text-[#D32F2F]">₹540K</p>
          </div>
          <div>
            <p className="text-xs text-[#6E7681] mb-1">Confidence</p>
            <p className="text-2xl font-bold text-[#388E3C]">95%</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary">Generate Arrest Playbook</button>
          <button className="btn-secondary">Export Analysis</button>
        </div>
      </div>
    </main>
  );
}