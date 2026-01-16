"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Case Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter case title"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter case description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as CasePriority)}
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="officer">Assign To (Optional)</Label>
              <Select
                value={assignedTo}
                onValueChange={setAssignedTo}
                disabled={loadingOfficers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select officer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.name} ({officer.badge_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Case"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
