"use client";

import { useState, useMemo } from "react";
import { Suspect, riskColors } from "@/data/mockData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface KingpinsTableProps {
  data: Suspect[];
  onViewDetails?: (suspectId: string) => void;
}

function getRiskBadge(riskLevel: "critical" | "high" | "medium" | "low") {
  switch (riskLevel) {
    case "critical":
      return (
        <Badge
          variant="outline"
          className="border-0 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
        >
          CRITICAL
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="outline"
          className="border-0 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
        >
          HIGH
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="outline"
          className="border-0 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 dark:bg-yellow-500/10 dark:text-yellow-300 dark:hover:bg-yellow-500/20"
        >
          MEDIUM
        </Badge>
      );
    case "low":
      return (
        <Badge
          variant="outline"
          className="border-0 bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
        >
          LOW
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-0">
          Unknown
        </Badge>
      );
  }
}

export default function KingpinsTable({
  data,
  onViewDetails,
}: KingpinsTableProps) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"riskScore" | "name">("riskScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "riskScore") {
        return (b.riskScore - a.riskScore) * modifier;
      }
      return a.name.localeCompare(b.name) * modifier;
    });
  }, [data, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, sortedData]);

  const pageCount = Math.ceil(data.length / itemsPerPage);
  const totalPages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pageCount));
  };

  const toggleSort = (field: "riskScore" | "name") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleExpandRow = (suspectId: string) => {
    setExpandedRow(expandedRow === suspectId ? null : suspectId);
  };

  // Calculate rank based on original sorted position
  const getRank = (suspectId: string) => {
    return sortedData.findIndex((s) => s.id === suspectId) + 1;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="h-12 px-4 font-medium w-16 rounded-tl-lg">
                Rank
              </TableHead>
              <TableHead
                className="h-12 px-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name
                  {sortField === "name" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="h-12 px-4 font-medium w-36 cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort("riskScore")}
              >
                <div className="flex items-center gap-1">
                  Score
                  {sortField === "riskScore" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="h-12 px-4 font-medium w-28">Role</TableHead>
              <TableHead className="h-12 px-4 font-medium w-24">Risk</TableHead>
              <TableHead className="h-12 px-4 font-medium text-center w-16">
                Links
              </TableHead>
              <TableHead className="h-12 px-4 font-medium w-24 rounded-tr-lg">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((suspect) => (
                <>
                  <TableRow
                    key={suspect.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleExpandRow(suspect.id)}
                  >
                    <TableCell className="h-14 px-4 font-semibold text-primary">
                      #{getRank(suspect.id)}
                    </TableCell>
                    <TableCell className="h-14 px-4 font-medium">
                      {suspect.name}
                    </TableCell>
                    <TableCell className="h-14 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-mono w-10">
                          {suspect.riskScore}%
                        </span>
                        <div className="flex-1 h-1.5 bg-muted-foreground/20 rounded-full w-16">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${suspect.riskScore}%`,
                              backgroundColor: riskColors[suspect.riskLevel],
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="h-14 px-4 text-sm text-muted-foreground">
                      {suspect.role}
                    </TableCell>
                    <TableCell className="h-14 px-4">
                      {getRiskBadge(suspect.riskLevel)}
                    </TableCell>
                    <TableCell className="h-14 px-4 text-center font-mono">
                      {data.length - 1}
                    </TableCell>
                    <TableCell className="h-14 px-4">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary hover:text-primary/80 p-0 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(suspect.id);
                        }}
                      >
                        Details <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {expandedRow === suspect.id && (
                    <TableRow
                      key={`${suspect.id}-expanded`}
                      className="bg-accent/30"
                    >
                      <TableCell
                        colSpan={7}
                        className="px-6 py-4 border-t border-border"
                      >
                        <div className="grid grid-cols-4 gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Phone:
                            </span>
                            <span className="text-foreground font-mono ml-2">
                              {suspect.phone}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Account:
                            </span>
                            <span className="text-foreground font-mono ml-2">
                              {suspect.account}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Total Calls:
                            </span>
                            <span className="text-foreground font-mono ml-2">
                              {suspect.callsInitiated + suspect.callsReceived}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Centrality:
                            </span>
                            <span className="text-primary font-mono ml-2">
                              {suspect.centralityScore}/100
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No suspects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
          to {(currentPage - 1) * itemsPerPage + paginatedData.length} of{" "}
          {data.length} entries
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          {totalPages.length > 0 &&
            totalPages.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextPage}
            disabled={currentPage === pageCount || pageCount === 0}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
