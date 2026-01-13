"use client";

import {
    formatCurrency,
    getSuspectById,
    riskColors,
    suspects
} from "@/data/mockData";
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    Check,
    X,
} from "lucide-react";
import { Button } from "../ui/button";

interface DetailPanelProps {
  suspectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailPanel({
  suspectId,
  isOpen,
  onClose,
}: DetailPanelProps) {
  const suspect = suspectId ? getSuspectById(suspectId) : null;

  if (!suspect) return null;

  const connectedSuspects = suspects.filter((s) => s.id !== suspect.id);

  // Mock financial data based on suspect
  const moneyIn =
    suspect.id === "S4" ? 195000 : suspect.id === "S5" ? 200000 : 75000;
  const moneyOut = suspect.id === "S4" ? 200000 : 0;
  const netFlow = moneyIn - moneyOut;

  return (
    <div
      className={`absolute top-0 right-0 h-full w-[420px] glass-panel z-40 transform transition-transform duration-300 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.1)] flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{suspect.name}</h3>
          <div className="flex items-center gap-2 text-xs text-[#8B949E] font-mono">
            <span>ID: {suspect.id}</span>
            <span>•</span>
            <span>{suspect.phone}</span>
          </div>
        </div>
        <Button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8B949E] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Risk Section */}
        <div className="p-5 rounded-xl bg-[#0A0E13]/80 border border-[rgba(255,255,255,0.1)]">
          <div className="flex justify-between items-center mb-3">
            <span
              className={`px-2 py-1 rounded text-white text-xs font-bold tracking-wide`}
              style={{ backgroundColor: riskColors[suspect.riskLevel] }}
            >
              {suspect.riskLevel === "critical" && "🔴"}{" "}
              {suspect.riskLevel.toUpperCase()} RISK
            </span>
            <span className="text-sm text-white font-semibold">
              Score: {(suspect.riskScore / 10).toFixed(1)}/10
            </span>
          </div>
          <div className="w-full h-2 bg-[#161B22] rounded-full overflow-hidden mb-3">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${suspect.riskScore}%`,
                backgroundColor: riskColors[suspect.riskLevel],
              }}
            />
          </div>
          <p className="text-sm text-[#E1E4E8]">
            Role:{" "}
            <span className="text-white font-medium">
              {suspect.role} / Network{" "}
              {suspect.role === "Kingpin" ? "Coordinator" : "Member"}
            </span>
          </p>
        </div>

        {/* Influence Metrics */}
        <div className="glass-card-static p-5">
          <h4 className="text-sm font-semibold text-white mb-4">
            Influence Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#8B949E]">Centrality Score</span>
              <span className="text-[#1E88E5] font-mono font-bold">
                {suspect.centralityScore}/100
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B949E]">Connected Suspects</span>
              <span className="text-white font-mono">
                {connectedSuspects.length} (
                {connectedSuspects.map((s) => s.id).join(", ")})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white/5 p-2 rounded text-center">
                <p className="text-xs text-[#6E7681]">Calls Out</p>
                <p className="text-lg font-mono text-white">
                  {suspect.callsInitiated}
                </p>
              </div>
              <div className="bg-white/5 p-2 rounded text-center">
                <p className="text-xs text-[#6E7681]">Calls In</p>
                <p className="text-lg font-mono text-white">
                  {suspect.callsReceived}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Footprint */}
        <div className="glass-card-static p-5">
          <h4 className="text-sm font-semibold text-white mb-4">
            Financial Footprint
          </h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#388E3C]/10 text-[#388E3C]">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-[#8B949E]">Money In</p>
                <p className="text-base font-bold text-white font-mono">
                  {formatCurrency(moneyIn)}
                </p>
                <p className="text-xs text-[#6E7681]">From linked accounts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#D32F2F]/10 text-[#D32F2F]">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-[#8B949E]">Money Out</p>
                <p className="text-base font-bold text-white font-mono">
                  {formatCurrency(moneyOut)}
                </p>
                <p className="text-xs text-[#6E7681]">To linked accounts</p>
              </div>
            </div>
            <div className="pt-3 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center">
              <span className="text-sm text-[#8B949E]">Net Flow</span>
              <span
                className={`font-mono font-bold ${
                  netFlow >= 0 ? "text-[#388E3C]" : "text-[#FBC02D]"
                }`}
              >
                {netFlow >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(netFlow))}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {suspect.riskLevel === "critical" && (
          <div className="glass-card-static p-5 border-l-2 border-l-[#D32F2F] bg-[#D32F2F]/5">
            <h4 className="text-sm font-bold text-[#D32F2F] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Priority: ARREST IMMEDIATELY
            </h4>
            <div className="space-y-2">
              {[
                "Place under surveillance",
                `Freeze account ${suspect.account}`,
                "Coordinate arrest with S1, S2, S3",
              ].map((action, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 text-sm text-[#E1E4E8] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-[rgba(255,255,255,0.2)] bg-transparent text-[#1E88E5] focus:ring-0 w-4 h-4"
                  />
                  {action}
                </label>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-1 px-2 py-1 bg-[#388E3C]/10 text-[#388E3C] text-xs font-bold rounded">
              <Check className="w-3 h-3" />
              95% Prosecution-Ready
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[rgba(255,255,255,0.1)] grid grid-cols-2 gap-4 shrink-0 bg-[#161B22]">
        <button className="bg-[#1E88E5] hover:bg-[#00BCD4] text-white py-2 rounded-lg text-sm font-medium transition-colors">
          View Full Brief
        </button>
        <button className="bg-white/5 hover:bg-white/10 text-[#E1E4E8] py-2 rounded-lg text-sm font-medium transition-colors border border-[rgba(255,255,255,0.1)]">
          Generate Warrant
        </button>
      </div>
    </div>
  );
}