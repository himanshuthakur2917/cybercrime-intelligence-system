"use client";

import React, { useState, useCallback } from "react";
import {
  IconUpload,
  IconFile,
  IconCheck,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";

interface UploadedFile {
  name: string;
  type: "suspects" | "calls" | "transactions" | "cdr" | "victims" | "towers";
  status: "pending" | "uploading" | "success" | "error";
  rowCount?: number;
  error?: string;
}

interface CsvUploaderProps {
  investigationId: string;
  onUploadComplete?: () => void;
}

const fileTypeConfig = {
  suspects: { label: "Suspects", icon: "👤", accept: ".csv" },
  calls: { label: "Call Records", icon: "📞", accept: ".csv" },
  transactions: { label: "Transactions", icon: "💰", accept: ".csv" },
  cdr: { label: "CDR with Geolocation", icon: "📍", accept: ".csv" },
  victims: { label: "Victims", icon: "🎯", accept: ".csv" },
  towers: { label: "Cell Towers", icon: "📡", accept: ".csv" },
};

export function CsvUploader({
  investigationId,
  onUploadComplete,
}: CsvUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      return headers.reduce((obj, header, idx) => {
        obj[header] = values[idx] || "";
        return obj;
      }, {} as Record<string, string>);
    });
  };

  const detectFileType = (
    fileName: string,
    headers: string[]
  ): UploadedFile["type"] => {
    const lowerName = fileName.toLowerCase();
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    if (
      lowerName.includes("cdr") ||
      lowerHeaders.includes("triangulation_lat")
    ) {
      return "cdr";
    }
    if (
      lowerName.includes("victim") ||
      lowerHeaders.includes("safety_status")
    ) {
      return "victims";
    }
    if (lowerName.includes("tower") || lowerHeaders.includes("tower_id")) {
      return "towers";
    }
    if (lowerName.includes("suspect") || lowerHeaders.includes("suspect_id")) {
      return "suspects";
    }
    if (lowerName.includes("call") || lowerHeaders.includes("caller_phone")) {
      return "calls";
    }
    if (
      lowerName.includes("transaction") ||
      lowerHeaders.includes("from_account")
    ) {
      return "transactions";
    }
    return "calls"; // Default
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      if (!file.name.endsWith(".csv")) continue;

      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers =
        lines[0]?.split(",").map((h) => h.trim().replace(/"/g, "")) || [];
      const type = detectFileType(file.name, headers);

      newFiles.push({
        name: file.name,
        type,
        status: "pending",
        rowCount: lines.length - 1,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    setUploading(true);

    // Update all to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" as const } : f
      )
    );

    // Simulate upload (replace with actual API call)
    try {
      // In real implementation, you would:
      // 1. Read file contents
      // 2. Parse CSV
      // 3. POST to /investigations/${investigationId}/upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "success" as const } : f
        )
      );

      onUploadComplete?.();
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, error: "Upload failed" }
            : f
        )
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30"
          }
          hover:border-primary/50 cursor-pointer
        `}
      >
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="csv-upload"
          aria-label="Upload CSV files"
        />
        <label htmlFor="csv-upload" className="cursor-pointer">
          <IconUpload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">
            Drop CSV files here or click to browse
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports: suspects.csv, calls.csv, transactions.csv,
            cdr_records.csv, victims.csv, cell_towers.csv
          </p>
        </label>
      </div>

      {/* File Type Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(fileTypeConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <span>{config.icon}</span>
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border"
              >
                <span className="text-2xl">
                  {fileTypeConfig[file.type].icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <IconFile className="h-4 w-4" />
                    {file.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Type: {fileTypeConfig[file.type].label} | Rows:{" "}
                    {file.rowCount}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === "pending" && (
                    <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-600 text-xs">
                      Pending
                    </span>
                  )}
                  {file.status === "uploading" && (
                    <IconLoader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {file.status === "success" && (
                    <IconCheck className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === "error" && (
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 text-xs">
                      {file.error}
                    </span>
                  )}
                  {file.status === "pending" && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-muted rounded"
                      aria-label="Remove file"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={uploadAll}
            disabled={uploading || files.every((f) => f.status !== "pending")}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium 
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <IconLoader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-5 w-5" />
                Upload All to Investigation
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default CsvUploader;
