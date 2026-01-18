"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconArrowRight, IconRefresh } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Case, CasePriority, CaseStatus } from "@/types/cases";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const priorityConfig: Record<
  CasePriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    className:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  high: {
    label: "High",
    className:
      "bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    className:
      "bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
  },
  assigned: {
    label: "Assigned",
    className:
      "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  under_investigation: {
    label: "Under Investigation",
    className:
      "bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  },
  verified: {
    label: "Verified",
    className:
      "bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  },
  closed: {
    label: "Closed",
    className:
      "bg-gray-500/15 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
  },
  archived: {
    label: "Archived",
    className:
      "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
};

export default function OfficerCasesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyCases = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/cases?assignedTo=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch cases");
      const data = await res.json();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCases();
  }, [user?.id]);

  const handleSelectCase = (caseId: string) => {
    router.push(`/dashboard?caseId=${caseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchMyCases}>
          <IconRefresh className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Select a Case</h1>
        <p className="text-muted-foreground mt-1">
          Choose a case to view its dashboard and investigation details
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground text-lg">
            No cases assigned to you yet
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Cases will appear here once they are assigned by an administrator
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Case Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseData) => (
                <TableRow key={caseData.id}>
                  <TableCell className="font-mono font-medium">
                    {caseData.case_number}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {caseData.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-0",
                        priorityConfig[caseData.priority]?.className,
                      )}
                    >
                      {priorityConfig[caseData.priority]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-0",
                        statusConfig[caseData.status]?.className,
                      )}
                    >
                      {statusConfig[caseData.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(caseData.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSelectCase(caseData.id)}
                    >
                      View Dashboard
                      <IconArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats Footer */}
      {cases.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg flex gap-6 text-sm">
          <span>
            <strong>{cases.length}</strong> Total Cases
          </span>
          <span>
            <strong>
              {cases.filter((c) => c.status === "under_investigation").length}
            </strong>{" "}
            Under Investigation
          </span>
          <span>
            <strong>
              {cases.filter((c) => c.priority === "critical").length +
                cases.filter((c) => c.priority === "high").length}
            </strong>{" "}
            High Priority
          </span>
        </div>
      )}
    </div>
  );
}
