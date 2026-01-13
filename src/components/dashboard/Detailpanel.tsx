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
      className={`absolute top-0 right-0 h-full w-[420px] bg-card border-l border-border z-40 transform transition-transform duration-300 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-xl font-bold text-card-foreground mb-1">{suspect.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>ID: {suspect.id}</span>
            <span>•</span>
            <span>{suspect.phone}</span>
          </div>
        </div>
        <Button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Risk Section */}
        <div className="p-5 rounded-xl bg-muted border border-border">
          <div className="flex justify-between items-center mb-3">
            <span
              className={`px-2 py-1 rounded text-white text-xs font-bold tracking-wide`}
              style={{ backgroundColor: riskColors[suspect.riskLevel] }}
            >
              {suspect.riskLevel === "critical" && "🔴"}{" "}
              {suspect.riskLevel.toUpperCase()} RISK
            </span>
            <span className="text-sm text-foreground font-semibold">
              Score: {(suspect.riskScore / 10).toFixed(1)}/10
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${suspect.riskScore}%`,
                backgroundColor: riskColors[suspect.riskLevel],
              }}
            />
          </div>
          <p className="text-sm text-foreground/80">
            Role:{" "}
            <span className="text-foreground font-medium">
              {suspect.role} / Network{" "}
              {suspect.role === "Kingpin" ? "Coordinator" : "Member"}
            </span>
          </p>
        </div>

        {/* Influence Metrics */}
        <div className="bg-muted p-5 rounded-lg border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-4">
            Influence Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Centrality Score</span>
              <span className="text-blue-500 font-mono font-bold">
                {suspect.centralityScore}/100
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connected Suspects</span>
              <span className="text-foreground font-mono">
                {connectedSuspects.length} (
                {connectedSuspects.map((s) => s.id).join(", ")})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-accent/20 p-2 rounded text-center border border-border">
                <p className="text-xs text-muted-foreground">Calls Out</p>
                <p className="text-lg font-mono text-foreground">
                  {suspect.callsInitiated}
                </p>
              </div>
              <div className="bg-accent/20 p-2 rounded text-center border border-border">
                <p className="text-xs text-muted-foreground">Calls In</p>
                <p className="text-lg font-mono text-foreground">
                  {suspect.callsReceived}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Footprint */}
        <div className="bg-muted p-5 rounded-lg border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-4">
            Financial Footprint
          </h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-green-500/20 text-green-600 dark:text-green-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Money In</p>
                <p className="text-base font-bold text-foreground font-mono">
                  {formatCurrency(moneyIn)}
                </p>
                <p className="text-xs text-muted-foreground/70">From linked accounts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Money Out</p>
                <p className="text-base font-bold text-foreground font-mono">
                  {formatCurrency(moneyOut)}
                </p>
                <p className="text-xs text-muted-foreground/70">To linked accounts</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Net Flow</span>
              <span
                className={`font-mono font-bold ${
                  netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
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
          <div className="bg-destructive/10 p-5 rounded-lg border-l-4 border-l-destructive border border-border">
            <h4 className="text-sm font-bold text-destructive mb-3 flex items-center gap-2">
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
                  className="flex items-center gap-2 text-sm text-foreground/90 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-border bg-transparent text-primary focus:ring-0 w-4 h-4"
                  />
                  {action}
                </label>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded">
              <Check className="w-3 h-3" />
              95% Prosecution-Ready
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border grid grid-cols-2 gap-4 shrink-0 bg-muted">
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-medium transition-colors">
          View Full Brief
        </button>
        <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg text-sm font-medium transition-colors border border-border">
          Generate Warrant
        </button>
      </div>
    </div>
  );
}