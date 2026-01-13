"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { suspects } from "@/data/mockData";
import KingpinsTable from "@/components/dashboard/kingpins/kingpins-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function KingpinsPage() {
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleViewDetails = (suspectId: string) => {
    console.log("View details for suspect:", suspectId);
    // Add navigation or modal logic here
  };

  // Filter suspects based on search and risk level
  const filteredSuspects = suspects.filter((suspect) => {
    const matchesSearch =
      searchQuery === "" ||
      suspect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suspect.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk =
      riskFilter === "all" || suspect.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Kingpins Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Top suspects ranked by influence and risk score
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search suspects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-50"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger
              className="w-[150px]"
              aria-label="Filter by risk level"
            >
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kingpins Table Component */}
      <KingpinsTable
        data={filteredSuspects}
        onViewDetails={handleViewDetails}
      />

      {/* Strategic Recommendations */}
      <Card className="mt-6 border-l-4 border-l-muted-foreground">
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
          <CardDescription>
            Actionable insights based on network analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            1. <strong className="text-foreground">Arrest #1 (Vikram)</strong>{" "}
            first → Network collapses
          </p>
          <p>
            2.{" "}
            <strong className="text-foreground">
              Coordinate simultaneous arrest
            </strong>{" "}
            with #2, #3, #4
          </p>
          <p>
            3. <strong className="text-foreground">#5 (Neha)</strong> is
            low-risk, potential informant
          </p>
          <div className="pt-3 flex gap-3">
            <Button variant="outline" size="sm">
              Generate Arrest Playbook
            </Button>
            <Button variant="outline" size="sm">
              Export as PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
