"use client";

import DetailPanel from "@/components/dashboard/Detailpanel";
import NetworkGraph from "@/components/dashboard/NetworkGraph";
import { useState } from "react";

export default function Page() {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleNodeClick = (nodeId: string) => {
    setSelectedSuspect(nodeId);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 p-3 relative overflow-hidden">
        <NetworkGraph onNodeClick={handleNodeClick} />
        <DetailPanel
          suspectId={selectedSuspect}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
}
