"use client";

import { useState } from "react";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Shield,
  User,
  Calendar,
} from "lucide-react";
import { mockCases } from "@/data/mockCases";
import WarrantApprovalTable from "@/components/admin/warrants/table-approvals";
import { StatusSectionCards } from "@/components/admin/warrants/status-section-cards";

export default function WarrantsPage() {
  const [selectedWarrant, setSelectedWarrant] = useState<string | null>(null);

  const pendingWarrants = mockCases.filter(
    (c) => c.warrantStatus === "pending_approval"
  );
  const approvedWarrants = mockCases.filter(
    (c) => c.warrantStatus === "approved" || c.warrantStatus === "executed"
  );
  const rejectedWarrants = mockCases.filter(
    (c) => c.warrantStatus === "rejected"
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedCase = selectedWarrant
    ? mockCases.find((c) => c.id === selectedWarrant)
    : null;

  // Mock user data - just use the ID directly
  const requestedBy = selectedCase?.warrantRequestedBy
    ? {
        id: selectedCase.warrantRequestedBy,
        name: `Officer ${selectedCase.warrantRequestedBy}`,
      }
    : null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:px-4 md:pt-4">
          <div className="p-3 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Warrant Approvals
              </h1>
              <p className="text-sm text-muted-foreground">
                Review and approve warrant requests from officers
              </p>
            </div>

            {/* Stats */}
            <StatusSectionCards
              pendingWarrants={pendingWarrants.length}
              approvedWarrants={approvedWarrants.length}
              rejectedWarrants={rejectedWarrants.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Queue */}
              <div className="rounded-lg border overflow-hidden bg-gradient-to-b from-card to-primary/5 dark:bg-card px-2">
                <div className="px-2 py-4 border-b flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold text-foreground">
                    Pending Approval Queue
                  </h3>
                </div>
                <div className="divide">
                  {pendingWarrants.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-[#388E3C]" />
                      <p className="text-muted-foreground">No pending warrants</p>
                    </div>
                  ) : (
                    pendingWarrants.map((caseItem) => {
                      const isSelected = selectedWarrant === caseItem.id;

                      return (
                        <div
                          key={caseItem.id}
                          onClick={() => setSelectedWarrant(caseItem.id)}
                          className={`p-4 cursor-pointer transition-colors rounded-lg ${
                            isSelected
                              ? "bg-primary/10"
                              : "hover:bg-white/2"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {caseItem.title}
                              </p>
                              <p className="text-xs text-primary font-mono">
                                {caseItem.id}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase bg-[#F57C00]/20 ${caseItem.priority === 'high' ? 'text-red-600 bg-red-200' : caseItem.priority === 'medium' ? 'text-yellow-600 bg-yellow-200' : 'text-green-600 bg-green-200'}`}>
                              {caseItem.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {"Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {caseItem.warrantRequestDate
                                ? formatDate(caseItem.warrantRequestDate)
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Warrant Detail / Approval Panel */}
              <div className="rounded-lg border overflow-hidden bg-gradient-to-b from-card to-primary/5 dark:bg-card">
                <div className="p-4 border-b  flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Warrant Details</h3>
                </div>

                <div className="flex justify-center items-center min-h-[450px]">
                  {selectedCase ? (
                  <div className="p-6">
                    {/* Case Info */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-foreground mb-1">
                        {selectedCase.title}
                      </h4>
                      <p className="text-xs text-primary font-mono mb-3">
                        {selectedCase.id}
                      </p>
                      <p className="text-sm text-card-foreground">
                        {selectedCase.description}
                      </p>
                    </div>

                    {/* Request Details */}
                    <div className="bg-primary/5 rounded-lg p-4 mb-6">
                      <h5 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                        Request Information
                      </h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Requested By</p>
                          <p className="text-foreground font-medium">
                            {requestedBy?.name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Officer ID</p>
                          <p className="text-foreground font-mono text-xs">
                            {requestedBy?.id || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Request Date</p>
                          <p className="text-foreground">
                            {selectedCase.warrantRequestDate
                              ? formatDate(selectedCase.warrantRequestDate)
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Suspects</p>
                          <p className="text-foreground">
                            {selectedCase.suspects.length} linked
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-[#F57C00]/10 border border-[#F57C00]/30 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-[#F57C00] shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Authorization Required
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Approving this warrant will authorize law
                            enforcement to execute arrest and seizure
                            operations. This action is logged and audited.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button className="flex-1 btn-primary bg-[#388E3C] hover:bg-[#2E7D32] flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Approve Warrant
                      </button>
                      <button className="flex-1 btn-secondary border-[#D32F2F]/30 text-[#D32F2F] hover:bg-[#D32F2F]/10 flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Eye className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a warrant request to review
                    </p>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Recent Approvals */}
            <WarrantApprovalTable 
              data={approvedWarrants} 
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
