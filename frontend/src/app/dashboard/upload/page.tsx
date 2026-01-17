"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconDatabase,
  IconUpload,
  IconUser,
  IconPhone,
  IconCreditCard,
  IconCheck,
  IconX,
  IconLoader,
  IconFileDescription,
} from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface UploadResult {
  success: number;
  errors: number;
  message: string;
}

export default function OfficerUploadPage() {
  const [investigationId, setInvestigationId] = useState("");
  const [suspectFile, setSuspectFile] = useState<File | null>(null);
  const [victimFile, setVictimFile] = useState<File | null>(null);
  const [cdrFile, setCdrFile] = useState<File | null>(null);
  const [transactionFile, setTransactionFile] = useState<File | null>(null);

  const [suspectResult, setSuspectResult] = useState<UploadResult | null>(null);
  const [victimResult, setVictimResult] = useState<UploadResult | null>(null);
  const [cdrResult, setCdrResult] = useState<UploadResult | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<UploadResult | null>(null);

  const [suspectLoading, setSuspectLoading] = useState(false);
  const [victimLoading, setVictimLoading] = useState(false);
  const [cdrLoading, setCdrLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);

  const uploadFile = async (
    file: File,
    endpoint: string,
    setLoading: (v: boolean) => void,
    setResult: (r: UploadResult) => void
  ) => {
    if (!investigationId) {
      alert("Please enter an Investigation ID first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("investigationId", investigationId);

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: 0, errors: 1, message: "Upload failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <IconFileDescription className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">📤 Case Data Upload</h1>
          <p className="text-muted-foreground">
            Upload investigation evidence to Neo4j for link analysis
          </p>
        </div>
      </div>

      {/* Investigation ID Input */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="investigation-id" className="text-sm font-medium">
              Investigation ID *
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="investigation-id"
                placeholder="Enter FIR number or case ID"
                value={investigationId}
                onChange={(e) => setInvestigationId(e.target.value)}
                className="max-w-xs"
              />
              <Select onValueChange={setInvestigationId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Or select case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIR-2024-001">FIR-2024-001</SelectItem>
                  <SelectItem value="FIR-2024-002">FIR-2024-002</SelectItem>
                  <SelectItem value="CASE-RANCHI-001">
                    CASE-RANCHI-001
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All uploaded data will be linked to this investigation in Neo4j
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <IconDatabase className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-700">Investigation Data Flow</p>
            <p className="text-muted-foreground mt-1">
              Upload data obtained from telecom providers (CDR) and banks
              (transactions). All data is linked to the investigation for
              relationship analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Suspects Upload */}
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <IconUser className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold">Suspects</h2>
              <p className="text-xs text-muted-foreground">From FIR details</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="suspect-file">suspects.csv</Label>
            <Input
              id="suspect-file"
              type="file"
              accept=".csv"
              onChange={(e) => setSuspectFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              name, phone, alias, role, risk_score
            </p>
          </div>
          <Button
            onClick={() =>
              suspectFile &&
              uploadFile(
                suspectFile,
                "/admin/ingest/suspects",
                setSuspectLoading,
                setSuspectResult
              )
            }
            disabled={!suspectFile || !investigationId || suspectLoading}
            className="w-full"
            size="sm"
          >
            {suspectLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>

          {suspectResult && (
            <div
              className={`p-2 rounded text-xs ${
                suspectResult.success > 0
                  ? "bg-green-500/10 text-green-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              <div className="flex items-center gap-1">
                {suspectResult.success > 0 ? (
                  <IconCheck className="h-3 w-3" />
                ) : (
                  <IconX className="h-3 w-3" />
                )}
                {suspectResult.success} added
              </div>
            </div>
          )}
        </div>

        {/* Victims Upload */}
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <IconUser className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">Victims</h2>
              <p className="text-xs text-muted-foreground">
                From FIR complaint
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="victim-file">victims.csv</Label>
            <Input
              id="victim-file"
              type="file"
              accept=".csv"
              onChange={(e) => setVictimFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              name, phone, address, incident_date
            </p>
          </div>

          <Button
            onClick={() =>
              victimFile &&
              uploadFile(
                victimFile,
                "/admin/ingest/victims",
                setVictimLoading,
                setVictimResult
              )
            }
            disabled={!victimFile || !investigationId || victimLoading}
            className="w-full"
            size="sm"
          >
            {victimLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>

          {victimResult && (
            <div
              className={`p-2 rounded text-xs ${
                victimResult.success > 0
                  ? "bg-green-500/10 text-green-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              <div className="flex items-center gap-1">
                {victimResult.success > 0 ? (
                  <IconCheck className="h-3 w-3" />
                ) : (
                  <IconX className="h-3 w-3" />
                )}
                {victimResult.success} added
              </div>
            </div>
          )}
        </div>

        {/* CDR Upload */}
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <IconPhone className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">CDR Records</h2>
              <p className="text-xs text-muted-foreground">From telecom</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cdr-file">victim_cdr.csv</Label>
            <Input
              id="cdr-file"
              type="file"
              accept=".csv"
              onChange={(e) => setCdrFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              caller, receiver, timestamp, tower_id, duration
            </p>
          </div>

          <Button
            onClick={() =>
              cdrFile &&
              uploadFile(
                cdrFile,
                "/admin/ingest/cdr",
                setCdrLoading,
                setCdrResult
              )
            }
            disabled={!cdrFile || !investigationId || cdrLoading}
            className="w-full"
            size="sm"
          >
            {cdrLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>

          {cdrResult && (
            <div
              className={`p-2 rounded text-xs ${
                cdrResult.success > 0
                  ? "bg-green-500/10 text-green-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              <div className="flex items-center gap-1">
                {cdrResult.success > 0 ? (
                  <IconCheck className="h-3 w-3" />
                ) : (
                  <IconX className="h-3 w-3" />
                )}
                {cdrResult.success} records
              </div>
            </div>
          )}
        </div>

        {/* Transactions Upload */}
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <IconCreditCard className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">Transactions</h2>
              <p className="text-xs text-muted-foreground">From bank</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-file">transactions.csv</Label>
            <Input
              id="transaction-file"
              type="file"
              accept=".csv"
              onChange={(e) => setTransactionFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              from_account, to_account, amount, utr, timestamp
            </p>
          </div>

          <Button
            onClick={() =>
              transactionFile &&
              uploadFile(
                transactionFile,
                "/admin/ingest/transactions",
                setTransactionLoading,
                setTransactionResult
              )
            }
            disabled={
              !transactionFile || !investigationId || transactionLoading
            }
            className="w-full"
            size="sm"
          >
            {transactionLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>

          {transactionResult && (
            <div
              className={`p-2 rounded text-xs ${
                transactionResult.success > 0
                  ? "bg-green-500/10 text-green-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              <div className="flex items-center gap-1">
                {transactionResult.success > 0 ? (
                  <IconCheck className="h-3 w-3" />
                ) : (
                  <IconX className="h-3 w-3" />
                )}
                ₹{transactionResult.success.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <h3 className="font-semibold mb-2">📋 Investigation Upload Flow</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Enter Investigation ID (FIR number or case reference)</li>
          <li>
            Upload <strong>Suspects</strong> from FIR complaint details
          </li>
          <li>
            Upload <strong>CDR</strong> obtained from telecom provider
          </li>
          <li>
            Upload <strong>Transactions</strong> obtained from bank
          </li>
          <li>Navigate to Dashboard to analyze relationships</li>
        </ol>
      </div>
    </div>
  );
}
