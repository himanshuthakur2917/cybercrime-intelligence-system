"use client";

import React from "react";
import { CsvUploader } from "@/components/admin/CsvUploader";
import { IconDatabase, IconFileImport } from "@tabler/icons-react";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <IconFileImport className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">📤 Data Upload</h1>
          <p className="text-muted-foreground">
            Upload investigation data CSV files for Neo4j analysis
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <IconDatabase className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-700">Supported File Types</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                • <strong>suspects.csv</strong> - Suspect profiles with phone
                numbers
              </li>
              <li>
                • <strong>calls.csv</strong> - Call records with caller/receiver
                info
              </li>
              <li>
                • <strong>transactions.csv</strong> - Financial transaction
                records
              </li>
              <li>
                • <strong>cdr_records.csv</strong> - CDR with triangulation data
              </li>
              <li>
                • <strong>victims.csv</strong> - Victim profiles and safety
                status
              </li>
              <li>
                • <strong>cell_towers.csv</strong> - Cell tower locations
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Component */}
      <div className="p-6 rounded-lg border bg-card">
        <CsvUploader
          investigationId="default"
          onUploadComplete={() => {
            console.log("Upload complete");
          }}
        />
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <h3 className="font-semibold mb-2">📋 Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Drag and drop CSV files or click to browse</li>
          <li>Files are automatically detected by type</li>
          <li>Review detected file types before uploading</li>
          <li>Click &quot;Upload All&quot; to ingest data into Neo4j</li>
          <li>Navigate to Geolocation Map to visualize data</li>
        </ol>
      </div>
    </div>
  );
}
