"use client";

import React, { useState, useEffect } from "react";
import {
  IconAlertTriangle,
  IconPhone,
  IconUsers,
  IconShield,
  IconMapPin,
  IconArrowRight,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HarassmentPattern {
  caller_id: string;
  caller_name: string;
  caller_phone: string;
  victim_id: string;
  victim_name: string;
  victim_phone: string;
  harassment_type: string;
  evidence_count: number;
  harassment_severity: string;
  recommended_action: string;
}

interface Tower {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface CallPattern {
  callerId: string;
  callerName: string;
  callerPhone: string;
  receiverId: string;
  receiverName: string;
  receiverPhone: string;
  callCount: number;
  totalDuration: number;
  towers: Tower[];
  riskLevel: string;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "CRITICAL":
      return "bg-red-500 hover:bg-red-600 text-white border-transparent shadow-sm shadow-red-200";
    case "HIGH":
      return "bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-sm shadow-orange-200";
    case "MEDIUM":
      return "bg-amber-400 hover:bg-amber-500 text-black border-transparent shadow-sm shadow-amber-100";
    case "LOW":
      return "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-sm shadow-emerald-100";
    default:
      return "bg-slate-500 hover:bg-slate-600 text-white border-transparent";
  }
};

export default function PatternsPage() {
  const { id: investigationId } = useParams() as { id: string };
  const [patterns, setPatterns] = useState<HarassmentPattern[]>([]);
  const [callPatterns, setCallPatterns] = useState<CallPattern[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [patternPage, setPatternPage] = useState(1);
  const [relationPage, setRelationPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!investigationId) return;

      try {
        const [patternsData, callPatternsData] = await Promise.all([
          api.getPatterns(investigationId),
          api.getCallPatterns(investigationId),
        ]);

        setPatterns(patternsData?.harassmentPatterns || []);
        // getData already unwraps response.data, so access array directly
        setCallPatterns(
          Array.isArray(callPatternsData)
            ? callPatternsData
            : callPatternsData?.data || [],
        );
      } catch (err) {
        console.error("Failed to fetch patterns", err);
        toast.error("Failed to load pattern analysis.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [investigationId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Stats
  const totalCalls = callPatterns.reduce(
    (acc, r) => acc + (r.callCount || 0),
    0,
  );
  const uniqueParticipants = new Set([
    ...callPatterns.map((r) => r.callerId),
    ...callPatterns.map((r) => r.receiverId),
  ]).size;
  const criticalPatterns = patterns.filter(
    (p) =>
      p.harassment_severity === "CRITICAL" || p.harassment_severity === "HIGH",
  ).length;

  // Helper to consolidate towers
  const consolidateTowers = (towers: Tower[]) => {
    if (!towers || towers.length === 0) return [];

    const uniqueMap = new Map<string, { tower: Tower; count: number }>();

    towers.forEach((t) => {
      const key = t.id || t.name;
      const existing = uniqueMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        uniqueMap.set(key, { tower: t, count: 1 });
      }
    });

    return Array.from(uniqueMap.values());
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconShield className="h-7 w-7 text-primary" />
            Pattern Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Harassment patterns detected from call data
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-none bg-blue-50/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <IconPhone className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{totalCalls}</div>
                <div className="text-xs text-muted-foreground">Total Calls</div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-purple-50/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <IconUsers className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{uniqueParticipants}</div>
                <div className="text-xs text-muted-foreground">
                  Participants
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-orange-50/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <IconAlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{patterns.length}</div>
                <div className="text-xs text-muted-foreground">Patterns</div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-red-50/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <IconAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{criticalPatterns}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Overview and Detailed View */}
        <Tabs defaultValue="communication" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="patterns">
              Detected Patterns ({patterns.length})
            </TabsTrigger>
            <TabsTrigger value="communication">
              Communication Links ({callPatterns.length})
            </TabsTrigger>
          </TabsList>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            {patterns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <IconShield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No harassment patterns detected.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg font-bold">
                      Detected Harassment Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow>
                          <TableHead className="w-[25%] font-bold">
                            Suspect
                          </TableHead>
                          <TableHead className="w-[10%]"></TableHead>
                          <TableHead className="w-[25%] font-bold">
                            Victim
                          </TableHead>
                          <TableHead className="font-bold">
                            Pattern Type
                          </TableHead>
                          <TableHead className="text-right font-bold">
                            Calls
                          </TableHead>
                          <TableHead className="w-[15%] font-bold">
                            Severity
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patterns
                          .slice(
                            (patternPage - 1) * ITEMS_PER_PAGE,
                            patternPage * ITEMS_PER_PAGE,
                          )
                          .map((p, idx: number) => (
                            <TableRow
                              key={`${p.caller_id}-${p.victim_id}-${idx}`}
                              className="hover:bg-muted/5"
                            >
                              <TableCell>
                                <div className="font-bold text-sm">
                                  {p.caller_name || "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {p.caller_phone}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <IconArrowRight
                                  size={16}
                                  className="text-muted-foreground mx-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-sm">
                                  {p.victim_name || "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {p.victim_phone}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase font-bold tracking-wider"
                                >
                                  {p.harassment_type?.replace(/_/g, " ") ||
                                    "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-black text-blue-600">
                                {p.evidence_count || 0}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`rounded-sm px-2 min-w-[80px] justify-center ${getRiskColor(p.harassment_severity)}`}
                                >
                                  {p.harassment_severity || "LOW"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Pagination */}
                {patterns.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between text-sm bg-muted/20 p-3 rounded-lg">
                    <span className="text-muted-foreground">
                      Page {patternPage} of{" "}
                      {Math.ceil(patterns.length / ITEMS_PER_PAGE)} (
                      {patterns.length} total)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPatternPage((p) => Math.max(1, p - 1))
                        }
                        disabled={patternPage === 1}
                      >
                        ← Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPatternPage((p) =>
                            Math.min(
                              Math.ceil(patterns.length / ITEMS_PER_PAGE),
                              p + 1,
                            ),
                          )
                        }
                        disabled={
                          patternPage >=
                          Math.ceil(patterns.length / ITEMS_PER_PAGE)
                        }
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-4">
            {callPatterns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No communication patterns found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg font-bold">
                      Communication Frequency & Geolocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/10 text-xs uppercase tracking-wider">
                        <TableRow>
                          <TableHead className="font-bold">Caller</TableHead>
                          <TableHead className="w-[5%]"></TableHead>
                          <TableHead className="font-bold">Receiver</TableHead>
                          <TableHead className="text-center font-bold">
                            Call Count
                          </TableHead>
                          <TableHead className="w-[35%] font-bold">
                            Towers Used (Unique Area)
                          </TableHead>
                          <TableHead className="font-bold">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callPatterns
                          .slice(
                            (relationPage - 1) * ITEMS_PER_PAGE,
                            relationPage * ITEMS_PER_PAGE,
                          )
                          .map((rel, idx: number) => {
                            const uniqueTowers = consolidateTowers(rel.towers);
                            return (
                              <TableRow
                                key={idx}
                                className="hover:bg-muted/5 align-top"
                              >
                                <TableCell className="py-4">
                                  <div className="font-bold text-sm">
                                    {rel.callerName || "Unknown"}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {rel.callerPhone}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 text-center">
                                  <IconArrowRight
                                    size={16}
                                    className="text-muted-foreground mt-1"
                                  />
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="font-bold text-sm">
                                    {rel.receiverName || "Unknown"}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {rel.receiverPhone}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 text-center font-black text-primary">
                                  {rel.callCount || 0}
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex flex-wrap gap-1.5 max-w-md">
                                    {uniqueTowers.length > 0 ? (
                                      uniqueTowers.map((item, tid: number) => (
                                        <Tooltip key={tid}>
                                          <TooltipTrigger asChild>
                                            <Badge
                                              variant="secondary"
                                              className="gap-1 cursor-default text-[10px] py-0 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                            >
                                              <IconMapPin size={8} />
                                              {item.tower.name}
                                              {item.count > 1 && (
                                                <span className="ml-1 bg-blue-600 text-white rounded-full px-1.5 text-[8px]">
                                                  {item.count}
                                                </span>
                                              )}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs font-bold">
                                              {item.tower.name}
                                            </p>
                                            <p className="text-[10px]">
                                              ID: {item.tower.id}
                                            </p>
                                            <p className="text-[10px]">
                                              Coords:{" "}
                                              {item.tower.lat?.toFixed(5)},{" "}
                                              {item.tower.lon?.toFixed(5)}
                                            </p>
                                            <p className="text-[10px]">
                                              Total occurrences: {item.count}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground italic text-xs">
                                        No tower data available
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge
                                    className={`rounded-sm font-bold ${getRiskColor(rel.riskLevel)}`}
                                  >
                                    {rel.riskLevel || "LOW"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Pagination */}
                {callPatterns.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between text-sm bg-muted/20 p-3 rounded-lg">
                    <span className="text-muted-foreground">
                      Page {relationPage} of{" "}
                      {Math.ceil(callPatterns.length / ITEMS_PER_PAGE)} (
                      {callPatterns.length} total)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRelationPage((p) => Math.max(1, p - 1))
                        }
                        disabled={relationPage === 1}
                      >
                        ← Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRelationPage((p) =>
                            Math.min(
                              Math.ceil(callPatterns.length / ITEMS_PER_PAGE),
                              p + 1,
                            ),
                          )
                        }
                        disabled={
                          relationPage >=
                          Math.ceil(callPatterns.length / ITEMS_PER_PAGE)
                        }
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
