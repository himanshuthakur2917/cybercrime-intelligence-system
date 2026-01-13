"use client";

import { useState } from "react";
import { getSuspectById, transactions } from "@/data/mockData";
import { BriefSidebar } from "@/components/dashboard/briefs/brief-sidebar";
import { BriefHeader } from "@/components/dashboard/briefs/brief-header";
import { BriefContent } from "@/components/dashboard/briefs/brief-content";

export default function BriefsPage() {
  const [selectedSuspectId, setSelectedSuspectId] = useState("S4");

  const suspect = getSuspectById(selectedSuspectId);
  if (!suspect) return null;

  // Calculate financial data
  const inboundTxns = transactions.filter((t) => t.toSuspect === suspect.id);
  const outboundTxns = transactions.filter((t) => t.fromSuspect === suspect.id);
  const totalIn = inboundTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalOut = outboundTxns.reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIn - totalOut;

  return (
    <main className="flex-1 overflow-hidden flex h-full bg-background rounded-b-xl">
      {/* Sidebar */}
      <BriefSidebar
        selectedSuspectId={selectedSuspectId}
        onSuspectChange={setSelectedSuspectId}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <BriefHeader suspect={suspect} />

        {/* Content */}
        <div className="flex-1 max-w-5xl mx-auto w-full">
          <BriefContent
            suspect={suspect}
            inboundTxns={inboundTxns}
            outboundTxns={outboundTxns}
            totalIn={totalIn}
            totalOut={totalOut}
            netFlow={netFlow}
          />

          {/* Footer */}
          <div className="p-6 text-center text-xs text-muted-foreground border-t mt-8 mb-4">
            AI Generation Model: Gemini 1.5 Pro | Confidence Score: 95% | Last
            Updated: Just now
          </div>
        </div>
      </div>
    </main>
  );
}
