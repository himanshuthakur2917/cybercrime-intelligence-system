


"use client";

import NetworkGraph from "@/components/dashboard/NetworkGraph";
import { useState } from "react";


type SubTab = "graph" | "analytics";

export default  function Page() {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SubTab>("graph");

  const handleNodeClick = (nodeId: string) => {
    setSelectedSuspect(nodeId);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return ( 
     <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 p-7">
          {/* Network graph visualization */}
          {/* <div className="h-full"> */} 
            <NetworkGraph onNodeClick={handleNodeClick} /> 
          {/* </div> */}
        </div>
      </div>
    </div>
    // <main className="flex-1 relative overflow-hidden flex flex-col p-4 md:p-6">
    //   {/* Sub-tabs within Network View */}
      

    //   {/* Content based on active tab */}
    //   <div className="flex-1 overflow-hidden">
        
        

        
    //   </div>

    //   {/* SLIDE-IN DETAIL PANEL */}
    //   <DetailPanel
    //     suspectId={selectedSuspect}
    //     isOpen={isPanelOpen}
    //     onClose={handleClosePanel}
    //   />
    // </main>
  );
}