"use client";

import { useState, useEffect, useCallback } from "react";
import OfficerCard from "@/components/admin/officer/OfficerCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconRefresh, IconUsers } from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Officer {
  id: string;
  badge_number: string;
  name: string;
  email: string;
  phone?: string;
  rank: string;
  department: string;
  station?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "RETIRED";
  role: string;
  current_cases_count?: number;
  joined_date?: string;
  created_at?: string;
}

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for adding officer
  const [newOfficer, setNewOfficer] = useState({
    badge_number: "",
    name: "",
    email: "",
    phone: "",
    rank: "Constable",
    department: "Cyber Crime",
    station: "",
    role: "OFFICER",
  });

  const fetchOfficers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === "all"
          ? `${API_URL}/officers`
          : `${API_URL}/officers?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch officers");
      const data = await res.json();
      setOfficers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const handleAddOfficer = async () => {
    try {
      const res = await fetch(`${API_URL}/officers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOfficer),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add officer");
      }
      setIsAddDialogOpen(false);
      setNewOfficer({
        badge_number: "",
        name: "",
        email: "",
        phone: "",
        rank: "Constable",
        department: "Cyber Crime",
        station: "",
        role: "OFFICER",
      });
      fetchOfficers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add officer");
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    const reason = prompt(`Enter reason for deactivating ${name}:`);
    if (!reason) return;
    try {
      const res = await fetch(`${API_URL}/officers/${id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      fetchOfficers();
    } catch (err) {
      alert("Failed to deactivate officer");
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/officers/${id}/reactivate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reactivate");
      fetchOfficers();
    } catch (err) {
      alert("Failed to reactivate officer");
    }
  };

  // Convert API officer to OfficerCard format
  const toCardFormat = (o: Officer) => ({
    name: o.name,
    code: o.badge_number,
    unit: o.department,
    email: o.email,
    joined: o.joined_date
      ? new Date(o.joined_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Unknown",
    cases: o.current_cases_count || 0,
    initials: o.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    status: o.status === "ACTIVE" ? ("active" as const) : ("inactive" as const),
  });

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <IconUsers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">👮 Officer Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage investigation officers and their access
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Officers</SelectItem>
              <SelectItem value="ACTIVE">Active Only</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={fetchOfficers}>
            <IconRefresh className="h-4 w-4" />
          </Button>

          {/* Add Officer Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Officer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Officer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="badge">Badge Number *</Label>
                  <Input
                    id="badge"
                    placeholder="CIS-OFF-XXX"
                    value={newOfficer.badge_number}
                    onChange={(e) =>
                      setNewOfficer({
                        ...newOfficer,
                        badge_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Det. John Doe"
                    value={newOfficer.name}
                    onChange={(e) =>
                      setNewOfficer({ ...newOfficer, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="officer@police.gov.in"
                    value={newOfficer.email}
                    onChange={(e) =>
                      setNewOfficer({ ...newOfficer, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="9876543210"
                    value={newOfficer.phone}
                    onChange={(e) =>
                      setNewOfficer({ ...newOfficer, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rank">Rank</Label>
                    <Select
                      value={newOfficer.rank}
                      onValueChange={(v) =>
                        setNewOfficer({ ...newOfficer, rank: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Constable">Constable</SelectItem>
                        <SelectItem value="ASI">ASI</SelectItem>
                        <SelectItem value="Sub Inspector">
                          Sub Inspector
                        </SelectItem>
                        <SelectItem value="Inspector">Inspector</SelectItem>
                        <SelectItem value="Superintendent">
                          Superintendent
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newOfficer.role}
                      onValueChange={(v) =>
                        setNewOfficer({ ...newOfficer, role: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRAINEE">Trainee</SelectItem>
                        <SelectItem value="OFFICER">Officer</SelectItem>
                        <SelectItem value="SENIOR_OFFICER">
                          Senior Officer
                        </SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="station">Station</Label>
                  <Input
                    id="station"
                    placeholder="Cyber Cell Unit 1"
                    value={newOfficer.station}
                    onChange={(e) =>
                      setNewOfficer({ ...newOfficer, station: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleAddOfficer} className="w-full">
                Add Officer
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={fetchOfficers}>
            Retry
          </Button>
        </div>
      ) : officers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No officers found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {officers.map((officer) => (
            <div key={officer.id} className="relative">
              <OfficerCard officer={toCardFormat(officer)} />
              {/* Action overlay */}
              <div className="absolute bottom-4 left-5 right-5 flex gap-2">
                {officer.status === "ACTIVE" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeactivate(officer.id, officer.name)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleReactivate(officer.id)}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && officers.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg flex gap-6 text-sm">
          <span>
            <strong>{officers.length}</strong> Total Officers
          </span>
          <span>
            <strong>
              {officers.filter((o) => o.status === "ACTIVE").length}
            </strong>{" "}
            Active
          </span>
          <span>
            <strong>
              {officers.filter((o) => o.status !== "ACTIVE").length}
            </strong>{" "}
            Inactive
          </span>
        </div>
      )}
    </div>
  );
}
