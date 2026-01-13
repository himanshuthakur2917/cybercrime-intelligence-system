"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Area, AreaChart, XAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartBarMixed } from "@/components/dashboard/analytics/chart-bar-mixed";
import { ChartPieDonutText } from "@/components/dashboard/analytics/chart-pie-donut-text";

// --- Data Preparation ---
// 1. Risk Distribution Data
// 1. Risk Distribution Data - Logic moved to chart-pie-donut-text.tsx

// 2. Transaction Activity (Simulated Interactive Data)
const generateDailyData = () => {
  const data: { date: string; calls: number; transactions: number }[] = [];
  const currDate = new Date();
  for (let i = 0; i < 90; i++) {
    const date = new Date(currDate);
    date.setDate(date.getDate() - (89 - i));
    data.push({
      date: date.toISOString().split("T")[0],
      calls: Math.floor(Math.random() * 50) + 10,
      transactions: Math.floor(Math.random() * 20) + 2,
    });
  }
  return data;
};

const activityData = generateDailyData();

const chartConfig = {
  visitors: {
    label: "Activity",
  },
  calls: {
    label: "Calls",
    color: "var(--destructive)",
  },
  transactions: {
    label: "Transactions",
    color: "#0ea5e9",
  },
} satisfies ChartConfig;

export function AnalyticsCharts() {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = activityData.filter((item) => {
    const date = new Date(item.date);
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Activity Trend Chart - Interactive */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Network Activity Trends</CardTitle>
            <CardDescription>
              Daily volume of calls vs financial transactions
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-40 rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-calls)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-calls)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient
                  id="fillTransactions"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-transactions)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-transactions)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="transactions"
                type="natural"
                fill="url(#fillTransactions)"
                stroke="var(--color-transactions)"
                stackId="a"
              />
              <Area
                dataKey="calls"
                type="natural"
                fill="url(#fillCalls)"
                stroke="var(--color-calls)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution Chart */}
      <ChartPieDonutText />

      {/* Top Transfers Chart */}
      <ChartBarMixed />
    </div>
  );
}
