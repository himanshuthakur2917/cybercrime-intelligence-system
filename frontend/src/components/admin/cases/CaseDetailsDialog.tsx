"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  FileText,
  AlertCircle,
  UserCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Case, CasePriority, CaseStatus } from "@/types/cases";

interface CaseDetailsDialogProps {
  caseData: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityConfig: Record<
  CasePriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/30",
  },
  medium: {
    label: "Medium",
    className:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/30",
  },
  high: {
    label: "High",
    className:
      "bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-500/30",
  },
  critical: {
    label: "Critical",
    className:
      "bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-500/30",
  },
};

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-500/30",
  },
  assigned: {
    label: "Assigned",
    className:
      "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/30",
  },
  under_investigation: {
    label: "Under Investigation",
    className:
      "bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-500/30",
  },
  verified: {
    label: "Verified",
    className:
      "bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30",
  },
  closed: {
    label: "Closed",
    className:
      "bg-gray-500/15 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 border-gray-500/30",
  },
  archived: {
    label: "Archived",
    className:
      "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/30",
  },
};

export default function CaseDetailsDialog({
  caseData,
  open,
  onOpenChange,
}: CaseDetailsDialogProps) {
  if (!caseData) return null;

  const priorityConf = priorityConfig[caseData.priority];
  const statusConf = statusConfig[caseData.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold">
                {caseData.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {caseData.case_number}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn("font-medium", priorityConf?.className)}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {priorityConf?.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn("font-medium", statusConf?.className)}
              >
                {statusConf?.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="space-y-6">
          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Description
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {caseData.description || "No description provided"}
            </p>
          </div>

          <Separator />

          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                Created By
              </div>
              <p className="text-sm pl-6">{caseData.createdBy || "Unknown"}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Assigned To
              </div>
              <p className="text-sm pl-6">
                {caseData.assignedTo || (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Timestamps Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Created At
              </div>
              <p className="text-sm pl-6">
                {new Date(caseData.created_at).toLocaleString("en-IN", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Last Updated
              </div>
              <p className="text-sm pl-6">
                {new Date(caseData.updated_at).toLocaleString("en-IN", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* Verification Section (if verified) */}
          {caseData.is_verified && (
            <>
              <Separator />
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                  <UserCheck className="h-4 w-4" />
                  Verification Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      Verified By
                    </p>
                    <p className="font-medium">
                      {caseData.verifiedBy || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      Verified At
                    </p>
                    <p className="font-medium">
                      {caseData.verified_at
                        ? new Date(caseData.verified_at).toLocaleString(
                            "en-IN",
                            {
                              dateStyle: "long",
                              timeStyle: "short",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
