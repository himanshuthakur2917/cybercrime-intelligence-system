"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { Case } from "@/types/cases";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Officer {
  id: string;
  name: string;
  badge_number: string;
}

interface EditCaseDialogProps {
  caseData: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditCaseDialog({
  caseData,
  open,
  onOpenChange,
  onSuccess,
}: EditCaseDialogProps) {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assigned_to: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Fetch officers
  useEffect(() => {
    const fetchOfficers = async () => {
      setLoadingOfficers(true);
      try {
        const res = await fetch(`${API_URL}/officers`);
        const data = await res.json();
        setOfficers(data);
      } catch (error) {
        console.error("Failed to fetch officers:", error);
      } finally {
        setLoadingOfficers(false);
      }
    };
    if (open) fetchOfficers();
  }, [open]);

  // Set form data when case changes
  useEffect(() => {
    if (caseData) {
      setFormData({
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        priority: caseData.priority,
        assigned_to: caseData.assigned_to || "",
      });
    }
  }, [caseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    setLoading(true);
    try {
      // Convert empty assigned_to to null for the database
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to || null,
      };

      const res = await fetch(`${API_URL}/cases/${caseData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update case");

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update case");
    } finally {
      setLoading(false);
    }
  };

  if (!caseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Case</DialogTitle>
          <DialogDescription className="font-mono text-sm">
            {caseData.case_number}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Case Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter case title"
              required
              className="h-10"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter detailed case description"
              rows={4}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Status and Priority Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger id="status" className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="under_investigation">
                    Under Investigation
                  </SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(val) =>
                  setFormData({ ...formData, priority: val })
                }
              >
                <SelectTrigger id="priority" className="h-10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assign Officer */}
          <div className="space-y-2">
            <Label htmlFor="officer" className="text-sm font-semibold">
              Assign Officer
            </Label>
            <Select
              value={formData.assigned_to || "__unassigned__"}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  assigned_to: val === "__unassigned__" ? "" : val,
                })
              }
              disabled={loadingOfficers}
            >
              <SelectTrigger id="officer" className="h-10">
                <SelectValue placeholder="Select officer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {officers.map((officer) => (
                  <SelectItem key={officer.id} value={officer.id}>
                    {officer.name} ({officer.badge_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
