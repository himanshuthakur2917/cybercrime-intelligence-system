"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, investigationStats } from "@/data/mockData";

export function AnalyticsStats() {
  const stats = [
    {
      title: "Active Suspects",
      value: investigationStats.totalSuspects,
      description: "Entity surveillance",
      change: "+2 new",
      trend: "up",
      footer: "New suspects added this week",
      trendText: "Trending up",
    },
    {
      title: "Total Calls Logged",
      value: investigationStats.totalCalls,
      description: "Intercepted comms",
      change: "+12.5%",
      trend: "up",
      footer: "Call volume increased",
      trendText: "Trending up",
    },
    {
      title: "Total Money Flow",
      value: formatCurrency(investigationStats.moneyFlow),
      description: "Capital movement",
      change: "Critical",
      trend: "up",
      footer: "High value transfers detected",
      trendText: "Risk escalating",
    },
    {
      title: "Network Density",
      value: `${investigationStats.networkDensity}%`,
      description: "Ring connectivity",
      change: "+4.5%",
      trend: "up",
      footer: "Strong nodes discovered",
      trendText: "Connections forming",
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4 mb-8">
      {stats.map((stat, i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <CardDescription>{stat.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stat.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {stat.trend === "up" ? (
                  <IconTrendingUp />
                ) : (
                  <IconTrendingDown />
                )}
                {stat.change}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {stat.trendText}{" "}
              {stat.trend === "up" ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{stat.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
