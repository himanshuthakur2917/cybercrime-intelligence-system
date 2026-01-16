"use client";

import { useState, useCallback } from "react";
import Table05 from "@/components/admin/cases/table-05";
import CreateCaseDialog from "@/components/admin/cases/CreateCaseDialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

// TODO: Get this from auth context
const ADMIN_USER_ID = "74eb9bcc-a4fd-49b9-8f5d-b5d8e9a18e67";

export default function CasesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCaseCreated = useCallback(() => {
    // Trigger refresh by updating key
    setRefreshKey((prev) => prev + 1);
  }, []);

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

          <Table05 key={refreshKey} />

          <CreateCaseDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={handleCaseCreated}
            adminUserId={ADMIN_USER_ID}
          />
        </div>
      </div>
    </div>
  );
}
