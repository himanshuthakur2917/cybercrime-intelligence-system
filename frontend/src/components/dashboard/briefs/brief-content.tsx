"use client";

import { AlertTriangle, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  fromSuspect: string;
  toSuspect: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "flagged";
}

interface BriefContentProps {
  suspect: any;
  inboundTxns: Transaction[];
  outboundTxns: Transaction[];
  totalIn: number;
  totalOut: number;
  netFlow: number;
}

export function BriefContent({
  suspect,
  inboundTxns,
  outboundTxns,
  totalIn,
  totalOut,
  netFlow,
}: BriefContentProps) {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Executive Summary */}
      <section>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b flex items-center gap-2">
          EXECUTIVE SUMMARY
        </h2>
        <Card className="bg-muted/30 border-none shadow-sm">
          <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              {suspect.name}
            </span>{" "}
            ({suspect.id}) has been identified as a{" "}
            <strong className="text-foreground">{suspect.role}</strong> within a
            coordinated fraud network. Analysis of communication patterns
            reveals a{" "}
            <span
              className={
                suspect.riskLevel === "critical"
                  ? "text-destructive font-medium"
                  : ""
              }
            >
              {suspect.riskLevel === "critical" ? "central" : "supporting"}
            </span>{" "}
            role in orchestrating illegal activities. With a centrality score of{" "}
            <Badge variant="secondary" className="font-mono text-primary">
              {suspect.centralityScore}/100
            </Badge>{" "}
            and{" "}
            <span className="font-mono text-foreground">
              {suspect.callsInitiated + suspect.callsReceived}
            </span>{" "}
            total calls logged, this individual demonstrates
            {suspect.riskLevel === "critical"
              ? " command-and-control behavior typical of network leadership."
              : " active participation in network operations."}
          </CardContent>
        </Card>
      </section>

      {/* Role & Responsibility */}
      <section>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b">
          SUSPECTED ROLE & RESPONSIBILITY
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Primary Function
              </p>
              <p className="text-base font-semibold">
                {suspect.role} / Network{" "}
                {suspect.role === "Kingpin" ? "Coordinator" : "Member"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Decision Authority
              </p>
              <Badge
                variant={
                  suspect.riskLevel === "critical" ? "destructive" : "secondary"
                }
              >
                {suspect.riskLevel === "critical"
                  ? "Start/Stop Authority"
                  : "Limited / Execution Only"}
              </Badge>
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Observed Behaviors:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
                Orchestrates communications between ring members
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
                Manages money flows and transactions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
                Strategic decision making ({suspect.callsInitiated} calls
                initiated)
              </li>
              {suspect.riskLevel === "critical" && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-destructive" />
                  <span className="text-destructive font-medium">
                    Intermediary between victims and handlers
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Financial Footprint */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
          FINANCIAL INTELLIGENCE
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Total Inflow */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
                Total Inflow
                <ArrowLeft className="w-4 h-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIn)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {inboundTxns.length} transactions detected
              </p>
            </CardContent>
          </Card>

          {/* Total Outflow */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
                Total Outflow
                <ArrowRight className="w-4 h-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalOut)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {outboundTxns.length} transactions detected
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/10 rounded-lg p-4 border text-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-muted-foreground">
              Transaction Ledger
            </span>
            <Badge variant="outline" className="font-mono">
              {suspect.account}
            </Badge>
          </div>

          <div className="space-y-6">
            {/* Inbound List */}
            {inboundTxns.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                  Incoming Sources
                </p>
                <div className="space-y-1">
                  {inboundTxns.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex justify-between items-center p-2 bg-background rounded border text-xs"
                    >
                      <span className="font-mono text-muted-foreground">
                        {txn.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{txn.fromSuspect}</span>
                        <span className="text-muted-foreground text-[10px] hidden sm:inline">
                          ({txn.fromAccount})
                        </span>
                      </div>
                      <span className="font-bold text-green-600">
                        +{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outbound List */}
            {outboundTxns.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
                  Outgoing Destinations
                </p>
                <div className="space-y-1">
                  {outboundTxns.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex justify-between items-center p-2 bg-background rounded border text-xs"
                    >
                      <span className="font-mono text-muted-foreground">
                        {txn.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{txn.toSuspect}</span>
                        <span className="text-muted-foreground text-[10px] hidden sm:inline">
                          ({txn.toAccount})
                        </span>
                      </div>
                      <span className="font-bold text-red-600">
                        -{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="font-semibold">Net Position</span>
            <span
              className={`font-mono font-bold text-lg ${
                netFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {netFlow >= 0 ? "+" : ""}
              {formatCurrency(netFlow)}
            </span>
          </div>
        </div>
      </section>

      {/* Critical Warnings */}
      {suspect.riskLevel === "critical" && (
        <section>
          <Card className="border-destructive/50 bg-destructive/5 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5" />
                CRITICAL WARNINGS & ALERTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-background/50 rounded border border-destructive/20">
                <p className="font-bold text-destructive mb-1">
                  NETWORK DEPENDENCY
                </p>
                <p className="text-sm text-foreground">
                  {suspect.name} is a CENTRAL NODE. Flight risk is high. If they
                  escape, the network structure may dissolve, leading to loss of
                  intel.
                </p>
                <div className="mt-2 text-xs font-bold bg-destructive text-destructive-foreground px-2 py-1 rounded w-fit">
                  ACTION: Simultaneous arrest Required
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded border border-destructive/20">
                <p className="font-bold text-destructive mb-1">
                  ASSET FLIGHT RISK
                </p>
                <p className="text-sm text-foreground">
                  Recent transaction patterns indicate potential account
                  liquidation.
                </p>
                <div className="mt-2 text-xs font-bold bg-destructive text-destructive-foreground px-2 py-1 rounded w-fit">
                  ACTION: Freeze assets within 12h
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recommended Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b">
          RECOMMENDED TACTICAL ACTIONS
        </h2>
        <Card className="bg-muted/10 border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-5">
            <p className="font-semibold text-primary mb-3">
              Phase 1: Immediate Containment (0-12 Hours)
            </p>
            <div className="space-y-3">
              {[
                "Initialize 24/7 digital and physical surveillance",
                `Obtain provisional arrest warrant for ${suspect.name}`,
                "Coordinate with regional co-conspirator teams",
                "Submit emergency preservation order to bank",
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <Checkbox id={`task-${i}`} />
                  <Label
                    htmlFor={`task-${i}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal pt-0.5"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Evidence Strength */}
      <section>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b">
          PROSECUTION READINESS
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 bg-muted/20">
              <CardTitle className="text-sm font-medium">
                Direct Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {[
                  "Call Data Records (CDR)",
                  "Bank Statements",
                  "Intercepted IMs",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-green-600 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 bg-muted/20">
              <CardTitle className="text-sm font-medium">
                Circumstantial Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {[
                  `High Centrality Score (${suspect.centralityScore})`,
                  "Temporal correlation with fraud events",
                  "Network topology position",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-green-600 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex items-center justify-between p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <span className="font-medium text-green-800 dark:text-green-300">
            Case confidence score
          </span>
          <Badge className="bg-green-600 hover:bg-green-700 text-lg py-1 px-4">
            95.0%
          </Badge>
        </div>
      </section>
    </div>
  );
}
