"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconUpload, IconRefresh } from "@tabler/icons-react";
import UploadSuspectsDialog from "@/components/admin/suspects/UploadSuspectsDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Suspect {
  phone: string;
  name: string;
  risk: string;
  alias: string;
  network_role: string;
  status: string;
  total_victim_contacts: number;
}

export default function SuspectsPage() {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filter, setFilter] = useState({ risk: "all", status: "all" });

  const fetchSuspects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/suspects?`;
      if (filter.risk !== "all") url += `risk=${filter.risk}&`;
      if (filter.status !== "all") url += `status=${filter.status}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch suspects");
      const data = await res.json();
      setSuspects(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSuspects();
  }, [fetchSuspects]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="@container/main flex h-full w-full flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:px-4 md:pt-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                🔍 Global Suspects Database
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage and upload suspects from investigations
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchSuspects} variant="outline">
                <IconRefresh className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <IconUpload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filter.risk}
              onChange={(e) => setFilter({ ...filter, risk: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARRESTED">Arrested</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchSuspects}>Retry</Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Alias
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Risk
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Contacts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {suspects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No suspects found. Upload CSV to add suspects.
                        </td>
                      </tr>
                    ) : (
                      suspects.map((suspect) => (
                        <tr key={suspect.phone} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-mono text-sm">
                            {suspect.phone}
                          </td>
                          <td className="px-4 py-3">{suspect.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {suspect.alias}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRiskColor(
                                suspect.risk
                              )}`}
                            >
                              {suspect.risk}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {suspect.network_role}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                suspect.status === "ACTIVE"
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              {suspect.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {suspect.total_victim_contacts}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <UploadSuspectsDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSuccess={fetchSuspects}
      />
    </div>
  );
}
