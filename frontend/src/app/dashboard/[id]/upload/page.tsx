"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const params = useParams();
  const caseId = params.id as string; // Auto-extract from URL
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
    setResult: (r: UploadResult) => void,
  ) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

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

      {/* Case Info Display */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-sm font-medium">Case ID</Label>
            <div className="mt-1 flex items-center gap-2">
              <code className="px-3 py-2 bg-muted rounded text-sm font-mono">
                {caseId || "Loading..."}
              </code>
              <span className="text-xs text-muted-foreground">
                (Auto-detected from URL)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All uploaded data will be linked to case:{" "}
              <strong>{caseId}</strong>
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
                `/admin/ingest/suspects/${caseId}`,
                setSuspectLoading,
                setSuspectResult,
              )
            }
            disabled={!suspectFile || suspectLoading}
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
                `/admin/ingest/victims/${caseId}`,
                setVictimLoading,
                setVictimResult,
              )
            }
            disabled={!victimFile || victimLoading}
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
                `/admin/ingest/cdr/${caseId}`,
                setCdrLoading,
                setCdrResult,
              )
            }
            disabled={!cdrFile || cdrLoading}
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
                `/admin/ingest/transactions/${caseId}`,
                setTransactionLoading,
                setTransactionResult,
              )
            }
            disabled={!transactionFile || transactionLoading}
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
        <h3 className="font-semibold mb-2">📋 Case Data Upload Flow</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>
            <strong>Case ID</strong> is auto-detected from the URL
          </li>
          <li>
            Upload <strong>Suspects</strong> from FIR complaint details
          </li>
          <li>
            Upload <strong>CDR</strong> obtained from telecom provider
          </li>
          <li>
            Upload <strong>Transactions</strong> obtained from bank
          </li>
          <li>Navigate to Map to visualize suspect connections</li>
        </ol>
      </div>
    </div>
  );
}
