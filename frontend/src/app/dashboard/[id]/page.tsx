"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import DetailPanel from "@/components/dashboard/Detailpanel";
import NetworkGraph from "@/components/dashboard/NetworkGraph";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CaseNetworkPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const caseId = params.id as string;

  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Verify officer has access to this case
  useEffect(() => {
    const verifyAccess = async () => {
      if (!user || !caseId) return;

      // Admins can access all cases
      if (user.role === "administrator") {
        setIsVerifying(false);
        return;
      }

      // Officers must verify this case is assigned to them
      if (user.role === "officer") {
        try {
          const res = await fetch(`${API_URL}/cases?assignedTo=${user.id}`);
          if (!res.ok) throw new Error("Failed to fetch cases");
          const cases = await res.json();

          const hasAccess = cases.some((c: any) => c.id === caseId);

          if (!hasAccess) {
            setAccessDenied(true);
            // Redirect back to case selection after a brief moment
            setTimeout(() => router.push("/dashboard"), 2000);
          } else {
            setIsVerifying(false);
          }
        } catch (error) {
          console.error("Access verification failed:", error);
          setAccessDenied(true);
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      }
    };

    verifyAccess();
  }, [user, caseId, router]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedSuspect(nodeId);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleChangeCase = () => {
    router.push("/dashboard");
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive text-lg font-semibold">Access Denied</p>
        <p className="text-muted-foreground">
          This case is not assigned to you. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 p-3 relative overflow-hidden">
        {user?.role === "officer" && (
          <div className="mb-2 px-4 py-2 bg-muted/50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Viewing case:{" "}
              <span className="font-mono font-medium text-foreground">
                {caseId}
              </span>
            </span>
            <button
              onClick={handleChangeCase}
              className="text-sm text-primary hover:underline"
            >
              Change Case
            </button>
          </div>
        )}
        <NetworkGraph onNodeClick={handleNodeClick} investigationId={caseId} />
        <DetailPanel
          suspectId={selectedSuspect}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
}
