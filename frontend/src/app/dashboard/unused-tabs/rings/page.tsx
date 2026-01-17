"use client";

import { fraudRings, suspects } from "@/data/mockData";
import { RingCard } from "@/components/dashboard/rings/ring-card";
import { RingsSummary } from "@/components/dashboard/rings/rings-summary";

export default function RingsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Fraud Rings Detection
        </h1>
        <p className="text-sm text-muted-foreground">
          Total Rings Detected:{" "}
          <span className="text-primary font-semibold">
            {fraudRings.length}
          </span>
        </p>
      </div>

      {/* Ring Cards */}
      <div className="space-y-6">
        {fraudRings.map((ring) => (
          <RingCard key={ring.id} ring={ring} />
        ))}
      </div>

      {/* Summary Box */}
      <RingsSummary
        totalRings={fraudRings.length}
        totalSuspects={suspects.length}
      />
    </main>
  );
}
