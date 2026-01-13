"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RingsSummaryProps {
  totalRings: number;
  totalSuspects: number;
}

export function RingsSummary({ totalRings, totalSuspects }: RingsSummaryProps) {
  return (
    <Card className="mt-6 border-t-4 border-t-primary shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Summary & Operational Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Rings</p>
            <p className="text-2xl font-bold text-primary">{totalRings}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Suspects</p>
            <p className="text-2xl font-bold text-foreground">
              {totalSuspects}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Suspicious Transactions
            </p>
            <p className="text-2xl font-bold text-destructive">₹540K</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <p className="text-2xl font-bold text-green-600">95%</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button>Generate Arrest Playbook</Button>
          <Button variant="outline">Export Analysis</Button>
        </div>
      </CardContent>
    </Card>
  );
}
