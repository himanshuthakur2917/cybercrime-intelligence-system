"use client";

import { ExternalLink, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency, riskColors } from "@/data/mockData";
import { RingVisualization } from "./ring-visualization";

interface RingData {
  id: number;
  name: string;
  status: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  members: string[];
  characteristics: {
    size: number;
    density: number;
    totalCalls: number;
    activityPeriod: string;
    totalMoney: number;
    pattern: string;
    likelihood: number;
  };
}

interface RingCardProps {
  ring: RingData;
}

export function RingCard({ ring }: RingCardProps) {
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/25";
      case "high":
        return "bg-orange-500/15 text-orange-600 border-orange-500/20 hover:bg-orange-500/25 dark:text-orange-400";
      case "medium":
        return "bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25 dark:text-yellow-400";
      case "low":
        return "bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/25 dark:text-green-400";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted"
            style={{ backgroundColor: `${riskColors[ring.riskLevel]}20` }}
          >
            <Users
              className="w-5 h-5"
              style={{ color: riskColors[ring.riskLevel] }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Ring #{ring.id}: {ring.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {ring.members.length} members
            </p>
          </div>
        </div>
        <Badge variant="outline" className={getRiskBadgeColor(ring.riskLevel)}>
          {ring.status.toUpperCase()} • {ring.riskLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Ring Visualization */}
      <div className="p-6 bg-muted/30 relative min-h-[300px] flex items-center justify-center">
        <RingVisualization ringId={ring.id} members={ring.members} />
      </div>

      {/* Ring Characteristics */}
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Ring Size</p>
            <p className="text-xl font-bold text-foreground">
              {ring.characteristics.size} suspects
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Density</p>
            <p className="text-xl font-bold text-foreground">
              {ring.characteristics.density}%
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Calls</p>
            <p className="text-xl font-bold text-foreground">
              {ring.characteristics.totalCalls}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Money Flow</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(ring.characteristics.totalMoney)}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Pattern:</span>
            <span className="text-foreground font-medium">
              {ring.characteristics.pattern}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Activity:</span>
            <span className="text-foreground font-medium">
              {ring.characteristics.activityPeriod}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Likelihood:</span>
            <span className="text-destructive font-bold">
              {ring.characteristics.likelihood}%
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/10 p-6 pt-0 flex gap-3">
        <Button size="sm" className="gap-2">
          View Detailed Network <ExternalLink className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm">
          Export Visualization
        </Button>
      </CardFooter>
    </Card>
  );
}
