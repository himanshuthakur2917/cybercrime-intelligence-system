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
import {
  IconPlus,
  IconRefresh,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { z } from "zod";

const officerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-z0-9._]+$/,
      "Only lowercase letters, numbers, dots, and underscores allowed"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Must include uppercase, lowercase, and a number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  badge_number: z
    .string()
    .regex(/^CIS-[A-Z0-9-]+$/, "Badge format: CIS-XXX-XXX"),
  rank: z.string().min(1, "Rank is required"),
  department: z.string().min(1, "Department is required"),
  station: z.string().optional(),
  created_by: z.string().uuid(),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// TODO: Get this from auth context
const ADMIN_USER_ID = "74eb9bcc-a4fd-49b9-8f5d-b5d8e9a18e67";

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
  const [dialogStep, setDialogStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showPassword, setShowPassword] = useState(false);

  // Form state for adding officer
  const [newOfficer, setNewOfficer] = useState({
    username: "",
    password: "",
    badge_number: "",
    name: "",
    email: "",
    phone: "",
    rank: "Constable",
    department: "Cyber Crime",
    station: "",
    role: "OFFICER",
    created_by: ADMIN_USER_ID,
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
        username: "",
        password: "",
        badge_number: "",
        name: "",
        email: "",
        phone: "",
        rank: "Constable",
        department: "Cyber Crime",
        station: "",
        role: "OFFICER",
        created_by: ADMIN_USER_ID,
      });
      fetchOfficers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add officer");
    }
  };

  const validateStep1 = () => {
    const step1Data = {
      username: newOfficer.username,
      password: newOfficer.password,
      name: newOfficer.name,
      email: newOfficer.email,
      phone: newOfficer.phone,
      // Fill in dummy data for other required fields to pass schema check
      badge_number: "CIS-DUMMY",
      rank: newOfficer.rank,
      department: newOfficer.department,
      created_by: newOfficer.created_by,
    };

    const result = officerSchema
      .pick({
        username: true,
        password: true,
        name: true,
        email: true,
        phone: true,
      })
      .safeParse(step1Data);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const validateStep2 = () => {
    const result = officerSchema.safeParse(newOfficer);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep1()) {
      return;
    }
    setDialogStep(2);
  };

  const handleAddOfficerClick = async () => {
    if (!validateStep2()) {
      return;
    }
    await handleAddOfficer();
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

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${name}? This action cannot be undone.`
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/officers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchOfficers();
    } catch (err) {
      alert("Failed to delete officer");
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
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) setDialogStep(1);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Officer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  Add New Officer - Step {dialogStep} of 2
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Step 1: Account & Basic Info */}
                {dialogStep === 1 && (
                  <>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="username"
                        className={
                          validationErrors.username ? "text-destructive" : ""
                        }
                      >
                        Username *
                      </Label>
                      <Input
                        id="username"
                        placeholder="john.doe"
                        className={
                          validationErrors.username
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        value={newOfficer.username}
                        onChange={(e) =>
                          setNewOfficer({
                            ...newOfficer,
                            username: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9._]/g, ""),
                          })
                        }
                      />
                      {validationErrors.username && (
                        <p className="text-xs text-destructive">
                          {validationErrors.username}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="password"
                        className={
                          validationErrors.password ? "text-destructive" : ""
                        }
                      >
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Strong password"
                          className={`pr-10 ${
                            validationErrors.password
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                          value={newOfficer.password}
                          onChange={(e) =>
                            setNewOfficer({
                              ...newOfficer,
                              password: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <IconEyeOff className="h-4 w-4" />
                          ) : (
                            <IconEye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {validationErrors.password && (
                        <p className="text-xs text-destructive">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="name"
                        className={
                          validationErrors.name ? "text-destructive" : ""
                        }
                      >
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Det. John Doe"
                        className={
                          validationErrors.name
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        value={newOfficer.name}
                        onChange={(e) =>
                          setNewOfficer({ ...newOfficer, name: e.target.value })
                        }
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-destructive">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="email"
                        className={
                          validationErrors.email ? "text-destructive" : ""
                        }
                      >
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="officer@police.gov.in"
                        className={
                          validationErrors.email
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        value={newOfficer.email}
                        onChange={(e) =>
                          setNewOfficer({
                            ...newOfficer,
                            email: e.target.value,
                          })
                        }
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-destructive">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="phone"
                        className={
                          validationErrors.phone ? "text-destructive" : ""
                        }
                      >
                        Phone *
                      </Label>
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        className={
                          validationErrors.phone
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        value={newOfficer.phone}
                        maxLength={10}
                        pattern="\d{10}"
                        onChange={(e) =>
                          setNewOfficer({
                            ...newOfficer,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-destructive">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Step 2: Officer Details */}
                {dialogStep === 2 && (
                  <>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="badge"
                        className={
                          validationErrors.badge_number
                            ? "text-destructive"
                            : ""
                        }
                      >
                        Badge Number *
                      </Label>
                      <Input
                        id="badge"
                        placeholder="CIS-OFF-XXX"
                        className={
                          validationErrors.badge_number
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        value={newOfficer.badge_number}
                        onChange={(e) =>
                          setNewOfficer({
                            ...newOfficer,
                            badge_number: e.target.value,
                          })
                        }
                      />
                      {validationErrors.badge_number && (
                        <p className="text-xs text-destructive">
                          {validationErrors.badge_number}
                        </p>
                      )}
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
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="Cyber Crime"
                        value={newOfficer.department}
                        onChange={(e) =>
                          setNewOfficer({
                            ...newOfficer,
                            department: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="station">Station</Label>
                      <Input
                        id="station"
                        placeholder="Cyber Cell Unit 1"
                        value={newOfficer.station}
                        onChange={(e) =>
                          setNewOfficer({
                            ...newOfficer,
                            station: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 py-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    dialogStep === 1 ? "bg-primary" : "bg-muted"
                  }`}
                />
                <div
                  className={`h-2 w-2 rounded-full ${
                    dialogStep === 2 ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                {dialogStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setDialogStep(dialogStep - 1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                {dialogStep < 2 ? (
                  <Button onClick={handleNextStep} className="flex-1">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleAddOfficerClick} className="flex-1">
                    Add Officer
                  </Button>
                )}
              </div>
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
          <p>No officers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 5xl:grid-cols-4 gap-4">
          {officers.map((officer) => (
            <OfficerCard
              key={officer.id}
              officer={toCardFormat(officer)}
              onDeactivate={() => handleDeactivate(officer.id, officer.name)}
              onReactivate={() => handleReactivate(officer.id)}
              onDelete={() => handleDelete(officer.id, officer.name)}
            />
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
