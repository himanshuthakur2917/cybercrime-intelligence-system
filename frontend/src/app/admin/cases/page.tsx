"use client";

import { useState, useCallback } from "react";
import Table05 from "@/components/admin/cases/table-05";
import CreateCaseDialog from "@/components/admin/cases/CreateCaseDialog";
import CaseDetailsDialog from "@/components/admin/cases/CaseDetailsDialog";
import EditCaseDialog from "@/components/admin/cases/EditCaseDialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { Case } from "@/types/cases";

// TODO: Get this from auth context
const ADMIN_USER_ID = "74eb9bcc-a4fd-49b9-8f5d-b5d8e9a18e67";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CasesPage() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCaseCreated = useCallback(() => {
    // Trigger refresh by updating key
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleViewCase = (caseData: Case) => {
    setSelectedCase(caseData);
    setDetailsOpen(true);
  };
  const handleEditCase = (caseData: Case) => {
    setSelectedCase(caseData);
    setEditOpen(true);
  };
  const handleDeleteCase = async (id: string) => {
    if (confirm("Delete this case?")) {
      await fetch(`${API_URL}/cases/${id}`, { method: "DELETE" });
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:px-4 md:pt-4">
          {/* Header */}
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Case
            </Button>
          </div>

          <Table05
            onViewCase={handleViewCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
          />

          <CreateCaseDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={handleCaseCreated}
            adminUserId={ADMIN_USER_ID}
          />

          <CaseDetailsDialog
            caseData={selectedCase}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <EditCaseDialog
            caseData={selectedCase}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>
    </div>
  );
}
