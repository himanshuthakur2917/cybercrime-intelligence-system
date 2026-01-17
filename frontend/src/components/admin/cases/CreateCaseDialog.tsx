"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Loader2, AlertCircle } from "lucide-react";
import type { CasePriority } from "@/types/cases";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  adminUserId: string;
}

interface Officer {
  id: string;
  name: string;
  badge_number: string;
}

export default function CreateCaseDialog({
  open,
  onOpenChange,
  onSuccess,
  adminUserId,
}: CreateCaseDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<CasePriority>("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Fetch active officers
  useEffect(() => {
    if (open) {
      const fetchOfficers = async () => {
        setLoadingOfficers(true);
        try {
          const res = await fetch(`${API_URL}/officers?status=ACTIVE`);
          if (res.ok) {
            const data = await res.json();
            setOfficers(data);
          }
        } catch (err) {
          console.error("Failed to fetch officers:", err);
        } finally {
          setLoadingOfficers(false);
        }
      };

      fetchOfficers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create case
      const res = await fetch(`${API_URL}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          created_by: adminUserId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create case");
      }

      const newCase = await res.json();

      // If officer assigned, assign the case
      if (assignedTo) {
        await fetch(`${API_URL}/cases/${newCase.id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ officer_id: assignedTo }),
        });
      }

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssignedTo("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Case</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new case in the system
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phishing Attack on Government Portal"
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the case..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add any relevant details, evidence, or context
            </p>
          </div>

          <Separator />

          {/* Priority and Assignment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="priority"
                className="text-sm font-semibold flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as CasePriority)}
              >
                <SelectTrigger id="priority" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="officer" className="text-sm font-semibold">
                Assign To (Optional)
              </Label>
              <Select
                value={assignedTo}
                onValueChange={setAssignedTo}
                disabled={loadingOfficers}
              >
                <SelectTrigger id="officer" className="h-10">
                  <SelectValue placeholder="Select officer..." />
                </SelectTrigger>
                <SelectContent>
                  {officers.length === 0 && !loadingOfficers && (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No active officers available
                    </div>
                  )}
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.name} ({officer.badge_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Case"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
