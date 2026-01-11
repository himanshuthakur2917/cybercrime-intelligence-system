"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import InvestigationSummary from "@/components/dashboard/InvestigationSummary";
import NetworkGraph from "@/components/dashboard/NetworkGraph";
import QuickActions from "@/components/dashboard/QuickActions";
import DetailPanel from "@/components/layout/DetailPanel";
import { BarChart3, LayoutGrid } from "lucide-react";

type SubTab = "graph" | "analytics";

export default function HomePage() {
  const router = useRouter();

  // 🔐 AUTH CHECK
  useEffect(() => {
    const auth = localStorage.getItem("cis-auth");
    if (!auth) {
      router.push("/login");
    }
  }, [router]);

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
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* ✅ DASHBOARD HEADER (added here) */}
      <header className="p-6 border-b border-white/10">
        <h1 className="text-3xl font-bold mb-1">
          Cybercrime Intelligence System
        </h1>
        <p className="text-[#8B949E]">
          Welcome to the secured dashboard.
        </p>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 relative overflow-hidden flex flex-col p-4 md:p-6 bg-[#0b0f14]">
        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "graph"
                ? "bg-[#1E88E5] text-white"
                : "bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10 hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Network Graph
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-[#1E88E5] text-white"
                : "bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10 hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Quick Analytics
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "graph" && (
            <NetworkGraph onNodeClick={handleNodeClick} />
          )}

          {activeTab === "analytics" && (
            <div className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <InvestigationSummary />
                <QuickActions />
                <ActivityTimeline />
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <DetailPanel
          suspectId={selectedSuspect}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      </main>
    </div>
  );
}
