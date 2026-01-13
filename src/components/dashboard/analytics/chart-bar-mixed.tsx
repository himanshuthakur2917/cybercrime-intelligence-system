"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { suspects, transactions, formatCurrency } from "@/data/mockData";

export const description = "A mixed bar chart";

// --- Data Logic ---
const topSpenders = suspects
  .map((suspect) => {
    const totalOut = transactions
      .filter((t) => t.fromSuspect === suspect.id)
      .reduce((sum, t) => sum + t.amount, 0);

    // Map risk levels to theme variables
    let themeColor = "var(--chart-1)";
    switch (suspect.riskLevel) {
      case "critical":
        themeColor = "var(--destructive)";
        break;
      case "high":
        themeColor = "var(--chart-1)";
        break;
      case "medium":
        themeColor = "var(--chart-5)";
        break;
      case "low":
        themeColor = "var(--chart-2)";
        break;
    }

    return {
      name: suspect.name.split(" ")[0], // First name for brevity
      fullName: suspect.name, // Full name for config/tooltip
      amount: totalOut,
      fill: themeColor,
      risk: suspect.riskLevel,
    };
  })
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 5);

const chartConfig = {
  amount: {
    label: "Amount",
  },
  // We can dynamically add keys if needed, but for 'mixed' style with direct fill,
  // standard tooltip might need tweaking or we rely on the data payload.
} satisfies ChartConfig;

export function ChartBarMixed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>High Value Transfers</CardTitle>
        <CardDescription>Top outbound money flow by suspect</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={topSpenders}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-[2px]"
                        style={{ backgroundColor: item.payload.fill }}
                      />
                      <span className="font-medium">
                        {item.payload.fullName}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="amount" layout="vertical" radius={5}>
              {/* Explicitly mapping cells isn't strictly needed if data has 'fill', 
                   but ensures Recharts respects it perfectly in all versions */}
              {topSpenders.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Highest risk detected:{" "}
          <span className="text-destructive font-bold">
            {topSpenders[0]?.name}
          </span>{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing top 5 entities by transaction volume
        </div>
      </CardFooter>
    </Card>
  );
}
