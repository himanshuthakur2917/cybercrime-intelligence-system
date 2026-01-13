"use client";

import { Badge } from "@/components/ui/badge";
import { riskColors } from "@/data/mockData";

interface BriefHeaderProps {
  suspect: {
    id: string;
    name: string;
    role: string;
    riskLevel: string;
    riskScore: number;
    phone: string;
  };
}

export function BriefHeader({ suspect }: BriefHeaderProps) {
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-destructive/15 text-destructive border-destructive/20";
      case "high":
        return "bg-orange-500/15 text-orange-600 border-orange-500/20 dark:text-orange-400";
      case "medium":
        return "bg-yellow-500/15 text-yellow-600 border-yellow-500/20 dark:text-yellow-400";
      case "low":
        return "bg-green-500/15 text-green-600 border-green-500/20 dark:text-green-400";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="p-6 bg-muted/20 border-b">
      <h1 className="text-2xl font-bold text-center mb-6 tracking-tight">
        PRIORITY INTELLIGENCE BRIEF
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
            Suspect Identity
          </span>
          <span className="text-lg font-semibold block">{suspect.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
            ID / Contact
          </span>
          <span className="font-mono text-sm block text-foreground/90">
            {suspect.id} | {suspect.phone}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
            Classification
          </span>
          <span className="font-medium block">
            {suspect.role.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
            Risk Assessment
          </span>
          <Badge
            variant="outline"
            className={`${getRiskBadgeColor(
              suspect.riskLevel
            )} text-xs font-bold px-2 py-0.5`}
          >
            {suspect.riskLevel.toUpperCase()} (
            {(suspect.riskScore / 10).toFixed(1)}/10)
          </Badge>
        </div>
      </div>
    </div>
  );
}
