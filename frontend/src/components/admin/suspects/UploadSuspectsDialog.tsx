"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconUpload,
  IconPlus,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_USER_ID = "74eb9bcc-a4fd-49b9-8f5d-b5d8e9a18e67";

interface UploadSuspectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface UploadResult {
  total: number;
  created: number;
  updated: number;
  errors: string[];
}

export default function UploadSuspectsDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadSuspectsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", ADMIN_USER_ID);

    try {
      const res = await fetch(`${API_URL}/suspects/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setResult(data.data);

      if (data.data.errors.length === 0) {
        setTimeout(() => {
          onOpenChange(false);
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload suspects");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Suspects CSV</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!result ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="file">Select CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full"
              >
                <IconUpload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Suspects"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <IconCheck className="h-5 w-5" />
                  <span className="font-semibold">Upload Complete</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>✅ Total: {result.total} records</p>
                  <p>✨ New suspects: {result.created}</p>
                  <p>🔄 Updated suspects: {result.updated}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-destructive p-4 space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <IconAlertCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      {result.errors.length} Errors
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {result.errors.map((error, i) => (
                      <p key={i} className="text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
