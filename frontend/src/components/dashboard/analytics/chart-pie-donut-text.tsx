"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { suspects } from "@/data/mockData";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export function ChartPieDonutText() {
  const riskCounts = React.useMemo(() => {
    return suspects.reduce((acc, s) => {
      acc[s.riskLevel] = (acc[s.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const chartData = React.useMemo(
    () =>
      [
        {
          risk: "critical",
          count: riskCounts.critical || 0,
          fill: "var(--destructive)",
        },
        { risk: "high", count: riskCounts.high || 0, fill: "var(--chart-1)" },
        {
          risk: "medium",
          count: riskCounts.medium || 0,
          fill: "var(--chart-5)",
        },
        { risk: "low", count: riskCounts.low || 0, fill: "var(--chart-2)" },
      ].filter((d) => d.count > 0),
    [riskCounts]
  );

  const totalSuspects = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const chartConfig = {
    count: {
      label: "Count",
    },
    critical: {
      label: "Critical",
      color: "var(--destructive)",
    },
    high: {
      label: "High",
      color: "var(--chart-1)",
    },
    medium: {
      label: "Medium",
      color: "var(--chart-5)",
    },
    low: {
      label: "Low",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Risk Level Distribution</CardTitle>
        <CardDescription>Breakdown of suspect classification</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-62.5"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="risk"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalSuspects.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Suspects
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Critical risks account for{" "}
          {Math.round(((riskCounts.critical || 0) / totalSuspects) * 100)}%{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Total entities currently under surveillance
        </div>
      </CardFooter>
    </Card>
  );
}
