"use client";

import { AnalyticsHeader } from "@/components/dashboard/analytics/analytics-header";
import { AnalyticsStats } from "@/components/dashboard/analytics/analytics-stats";
import { AnalyticsCharts } from "@/components/dashboard/analytics/analytics-charts";

export default function AnalyticsPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <AnalyticsHeader />
        <AnalyticsStats />
        <AnalyticsCharts />
      </div>
    </main>
  );
}
