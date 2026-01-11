"use client";

import {
    formatCurrency,
    getSuspectById,
    riskColors,
    suspects,
    transactions
} from "@/data/mockData";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Copy,
    Download,
    Mail,
    Printer,
    RefreshCw,
} from "lucide-react";
import { useState } from "react";

export default function BriefPage() {
  const [selectedSuspect, setSelectedSuspect] = useState("S4");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const suspect = getSuspectById(selectedSuspect);
  if (!suspect) return null;

  // Calculate financial data
  const inboundTxns = transactions.filter((t) => t.toSuspect === suspect.id);
  const outboundTxns = transactions.filter((t) => t.fromSuspect === suspect.id);
  const totalIn = inboundTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalOut = outboundTxns.reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIn - totalOut;

  return (
    <main className="flex-1 overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-72 shrink-0 glass-nav border-r border-[rgba(255,255,255,0.1)] p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Suspect Selector */}
        <div>
          <label className="text-xs text-[#6E7681] uppercase tracking-wider font-medium block mb-2">
            Select Suspect
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg py-3 px-4 text-left text-white text-sm flex items-center justify-between hover:border-[rgba(255,255,255,0.2)] transition-colors"
            >
              <span>
                {suspect.name} ({suspect.role})
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden z-10 shadow-xl">
                {suspects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSuspect(s.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full py-3 px-4 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${
                      s.id === selectedSuspect
                        ? "bg-white/10 text-[#1E88E5]"
                        : "text-[#E1E4E8]"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-[#6E7681]">{s.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Briefing Options */}
        <div>
          <label className="text-xs text-[#6E7681] uppercase tracking-wider font-medium block mb-2">
            Briefing Options
          </label>
          <div className="space-y-3">
            <select className="w-full bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-sm text-[#E1E4E8]">
              <option value="full">Length: Full</option>
              <option value="summary">Length: Summary</option>
              <option value="extended">Length: Extended</option>
            </select>
            <select className="w-full bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-sm text-[#E1E4E8]">
              <option value="text">Format: Text</option>
              <option value="markdown">Format: Markdown</option>
              <option value="pdf">Format: PDF</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Regenerate Brief
          </button>
          <button className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
            <Copy className="w-4 h-4" />
            Copy to Clipboard
          </button>
          <button className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export as PDF
          </button>
          <button className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Email Brief
          </button>
          <button className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="glass-card-static max-w-4xl mx-auto">
          {/* Brief Header */}
          <div className="p-6 bg-white/5 border-b border-[rgba(255,255,255,0.1)]">
            <h1 className="text-xl font-bold text-white text-center mb-4">
              PRIORITY INTELLIGENCE BRIEF
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[#6E7681] block">SUSPECT</span>
                <span className="text-white font-medium">{suspect.name}</span>
              </div>
              <div>
                <span className="text-[#6E7681] block">ID / PHONE</span>
                <span className="text-white font-mono text-xs">
                  {suspect.id} | {suspect.phone}
                </span>
              </div>
              <div>
                <span className="text-[#6E7681] block">CLASSIFICATION</span>
                <span className="text-white font-medium">
                  {suspect.role.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[#6E7681] block">RISK LEVEL</span>
                <span
                  className="inline-flex px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    backgroundColor: riskColors[suspect.riskLevel],
                    color: suspect.riskLevel === "medium" ? "#000" : "#fff",
                  }}
                >
                  {suspect.riskLevel.toUpperCase()} (
                  {(suspect.riskScore / 10).toFixed(1)}/10)
                </span>
              </div>
            </div>
          </div>

          {/* Brief Sections */}
          <div className="p-6 space-y-8">
            {/* Executive Summary */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.1)]">
                EXECUTIVE SUMMARY
              </h2>
              <p className="text-sm text-[#E1E4E8] leading-relaxed">
                {suspect.name} ({suspect.id}) has been identified as a{" "}
                <strong className="text-white">{suspect.role}</strong> within a
                coordinated fraud network. Analysis of communication patterns
                reveals a{" "}
                {suspect.riskLevel === "critical" ? "central" : "supporting"}{" "}
                role in orchestrating illegal activities. With a centrality
                score of{" "}
                <span className="text-[#1E88E5] font-mono">
                  {suspect.centralityScore}/100
                </span>{" "}
                and{" "}
                <span className="font-mono">
                  {suspect.callsInitiated + suspect.callsReceived}
                </span>{" "}
                total calls logged, this individual demonstrates
                {suspect.riskLevel === "critical"
                  ? " command-and-control behavior typical of network leadership."
                  : " active participation in network operations."}
              </p>
            </section>

            {/* Role & Responsibility */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.1)]">
                SUSPECTED ROLE & RESPONSIBILITY
              </h2>
              <div className="text-sm text-[#E1E4E8] space-y-2">
                <p>
                  <strong className="text-white">Primary:</strong>{" "}
                  {suspect.role} / Network{" "}
                  {suspect.role === "Kingpin" ? "Coordinator" : "Member"}
                </p>
                <ul className="list-disc list-inside text-[#8B949E] space-y-1 ml-2">
                  <li>Orchestrates communications between ring members</li>
                  <li>Manages money flows and transactions</li>
                  <li>
                    Makes strategic decisions (evidenced by{" "}
                    {suspect.callsInitiated} calls initiated)
                  </li>
                  {suspect.riskLevel === "critical" && (
                    <li>
                      Acts as intermediary between victims and money handlers
                    </li>
                  )}
                </ul>
                <p className="mt-3">
                  <strong className="text-[#1E88E5]">
                    Decision Authority:
                  </strong>{" "}
                  {suspect.riskLevel === "critical"
                    ? "YES - Central decision maker"
                    : "PARTIAL - Follows directives"}
                </p>
              </div>
            </section>

            {/* Financial Footprint */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.1)]">
                FINANCIAL FOOTPRINT & TRANSACTIONS
              </h2>
              <div className="text-sm space-y-3">
                <p className="text-[#6E7681] font-mono">
                  Account: {suspect.account}
                </p>

                <div>
                  <p className="text-[#388E3C] font-semibold">
                    Inbound Transactions:
                  </p>
                  {inboundTxns.length > 0 ? (
                    <ul className="text-[#8B949E] ml-4 mt-1">
                      {inboundTxns.map((txn) => (
                        <li key={txn.id} className="font-mono text-xs">
                          {txn.date}: {formatCurrency(txn.amount)} from{" "}
                          {txn.fromAccount} ({txn.fromSuspect})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6E7681] ml-4">
                      No inbound transactions
                    </p>
                  )}
                  <p className="text-white font-mono mt-1">
                    Total In: {formatCurrency(totalIn)}
                  </p>
                </div>

                <div>
                  <p className="text-[#D32F2F] font-semibold">
                    Outbound Transactions:
                  </p>
                  {outboundTxns.length > 0 ? (
                    <ul className="text-[#8B949E] ml-4 mt-1">
                      {outboundTxns.map((txn) => (
                        <li key={txn.id} className="font-mono text-xs">
                          {txn.date}: {formatCurrency(txn.amount)} to{" "}
                          {txn.toAccount} ({txn.toSuspect})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6E7681] ml-4">
                      No outbound transactions
                    </p>
                  )}
                  <p className="text-white font-mono mt-1">
                    Total Out: {formatCurrency(totalOut)}
                  </p>
                </div>

                <p className="pt-2 border-t border-[rgba(255,255,255,0.1)]">
                  <strong className="text-[#FBC02D]">Net Position:</strong>{" "}
                  <span className="font-mono">
                    {netFlow >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(netFlow))}
                  </span>
                  {suspect.riskLevel === "critical" && (
                    <span className="text-[#6E7681] ml-2">
                      (indicates coordinator role, not profiteer)
                    </span>
                  )}
                </p>
              </div>
            </section>

            {/* Critical Warnings */}
            {suspect.riskLevel === "critical" && (
              <section className="alert-critical rounded-lg p-5">
                <h2 className="text-lg font-semibold text-[#D32F2F] mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  CRITICAL WARNINGS & ALERTS
                </h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-white font-semibold">
                      NETWORK DEPENDENCY
                    </p>
                    <p className="text-[#E1E4E8]">
                      {suspect.name} is the CENTRAL NODE. If he escapes or is
                      warned, network could scatter.
                    </p>
                    <p className="text-[#FBC02D] font-semibold mt-1">
                      ACTION: Simultaneous arrest with S1, S2, S3 REQUIRED
                    </p>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      ACCOUNT FREEZE TIMING
                    </p>
                    <p className="text-[#E1E4E8]">
                      Last transaction (Feb 14) indicates operation may be
                      complete. Accounts could be emptied within 24-48 hours.
                    </p>
                    <p className="text-[#D32F2F] font-semibold mt-1">
                      ACTION: Freeze accounts within 12 hours
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Recommended Actions */}
            <section className="alert-info rounded-lg p-5">
              <h2 className="text-lg font-semibold text-white mb-3">
                RECOMMENDED IMMEDIATE ACTIONS
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[#1E88E5] font-semibold">
                    Priority 1 (Next 12 Hours):
                  </p>
                  <div className="mt-2 space-y-1">
                    {[
                      "Place under 24/7 surveillance",
                      `Obtain arrest warrant for ${suspect.name}`,
                      "Coordinate with co-conspirator teams",
                      "Contact banks for immediate account freeze",
                    ].map((item, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 text-[#E1E4E8]"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-[rgba(255,255,255,0.2)] bg-transparent"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Evidence Strength */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.1)]">
                EVIDENCE STRENGTH & PROSECUTION READINESS
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#8B949E] mb-2">Physical Evidence:</p>
                  <ul className="space-y-1">
                    {[
                      "Call records (command-control pattern)",
                      "Bank transactions documented",
                      "Communication with co-conspirators",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-[#388E3C]"
                      >
                        <Check className="w-4 h-4" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[#8B949E] mb-2">
                    Circumstantial Evidence:
                  </p>
                  <ul className="space-y-1">
                    {[
                      `Network centrality (${suspect.centralityScore}% - highest)`,
                      "Money coordination role",
                      "Timing correlations",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-[#388E3C]"
                      >
                        <Check className="w-4 h-4" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-[#8B949E]">
                  Overall Prosecution Readiness:
                </span>
                <span className="px-3 py-1 rounded bg-[#388E3C] text-white font-bold text-sm">
                  95% (HIGH CONFIDENCE)
                </span>
              </div>
            </section>
          </div>

          {/* Brief Footer */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.1)] text-center text-xs text-[#6E7681]">
            Generated by: CIS v1.0 | Model: Gemini API | Confidence: 95% |
            Action Confidence: 97%
          </div>
        </div>
      </div>
    </main>
  );
}