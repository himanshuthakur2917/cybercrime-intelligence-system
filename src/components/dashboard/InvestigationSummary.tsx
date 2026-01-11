"use client";

import { formatCurrency, investigationStats } from "@/data/mockData";
import { Activity } from "lucide-react";

export default function InvestigationSummary() {
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-semibold text-white">
          Investigation Summary
        </h4>
        <Activity className="text-[#1E88E5] w-4 h-4" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#8B949E] uppercase tracking-wider mb-1">
            Suspects
          </p>
          <p className="text-2xl font-bold text-[#1E88E5] font-mono">
            {investigationStats.totalSuspects}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#8B949E] uppercase tracking-wider mb-1">
            Money Flow
          </p>
          <p className="text-2xl font-bold text-white font-mono">
            {formatCurrency(investigationStats.moneyFlow)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#8B949E] uppercase tracking-wider mb-1">
            Risk Level
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#D32F2F] text-white">
            CRITICAL
          </span>
        </div>
        <div>
          <p className="text-xs text-[#8B949E] uppercase tracking-wider mb-1">
            Density
          </p>
          <p className="text-xl font-bold text-[#E1E4E8]">
            {investigationStats.networkDensity}%
          </p>
        </div>
      </div>
    </div>
  );
}