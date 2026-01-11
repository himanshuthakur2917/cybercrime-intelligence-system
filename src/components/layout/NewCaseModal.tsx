"use client";

import { AlertCircle, Check, FileText, Plus, Upload, X } from "lucide-react";
import { useState } from "react";

interface UploadedFile {
  name: string;
  status: "pending" | "valid" | "error";
  rows?: number;
}

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCaseModal({ isOpen, onClose }: NewCaseModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [step, setStep] = useState(1);
  const [investigationName, setInvestigationName] = useState("");
  const [caseId, setCaseId] = useState("");

  const requiredFiles = ["suspects.csv", "calls.csv", "transactions.csv"];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Simulate file upload
    const mockFiles: UploadedFile[] = [
      { name: "suspects.csv", status: "valid", rows: 5 },
      { name: "calls.csv", status: "valid", rows: 7 },
      { name: "transactions.csv", status: "valid", rows: 5 },
    ];
    setFiles(mockFiles);
    setStep(2);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileSelect = () => {
    // Simulate file selection
    const mockFiles: UploadedFile[] = [
      { name: "suspects.csv", status: "valid", rows: 5 },
      { name: "calls.csv", status: "valid", rows: 7 },
      { name: "transactions.csv", status: "valid", rows: 5 },
    ];
    setFiles(mockFiles);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setFiles([]);
    setInvestigationName("");
    setCaseId("");
    onClose();
  };

  const handleSubmit = () => {
    // In a real app, this would submit the data
    alert("Case created successfully!");
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card-static m-4 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-[#161B22] border-b border-[rgba(255,255,255,0.1)] p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Create New Case</h2>
            <p className="text-sm text-[#8B949E]">
              Upload data files to analyze a criminal network
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8B949E] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E88E5] transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#6E7681]">
            <span className={step >= 1 ? "text-[#1E88E5]" : ""}>
              1. Upload Files
            </span>
            <span className={step >= 2 ? "text-[#1E88E5]" : ""}>
              2. Preview Data
            </span>
            <span className={step >= 3 ? "text-[#1E88E5]" : ""}>
              3. Configure
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              {/* Required Files Checklist */}
              <div className="flex gap-4 mb-4 flex-wrap">
                {requiredFiles.map((file) => (
                  <div key={file} className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                      {files.find((f) => f.name === file) && (
                        <Check className="w-3 h-3 text-[#388E3C]" />
                      )}
                    </div>
                    <span className="text-[#8B949E] font-mono text-xs">
                      {file}
                    </span>
                  </div>
                ))}
              </div>

              {/* Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="glass-dark p-8 border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-xl text-center cursor-pointer hover:border-[#1E88E5] transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto text-[#6E7681] mb-3" />
                <p className="text-base text-white font-medium mb-1">
                  Drag CSV files here or click to browse
                </p>
                <p className="text-xs text-[#6E7681] mb-3">
                  Supported: .csv files (Max 50MB per file)
                </p>
                <button
                  onClick={handleFileSelect}
                  className="btn-primary text-sm py-2 px-4"
                >
                  Browse Files...
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div>
              <div className="space-y-3 mb-4">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="glass-dark rounded-lg overflow-hidden"
                  >
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#1E88E5]" />
                        <span className="text-white font-mono text-sm">
                          {file.name}
                        </span>
                        <span className="text-xs text-[#6E7681]">
                          ({file.rows} rows)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "valid" ? (
                          <>
                            <Check className="w-4 h-4 text-[#388E3C]" />
                            <span className="text-xs text-[#388E3C]">
                              Valid
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
                            <span className="text-xs text-[#D32F2F]">
                              Error
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 text-sm py-2"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Configure */}
          {step === 3 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-[#8B949E] mb-2">
                    Investigation Name *
                  </label>
                  <input
                    type="text"
                    value={investigationName}
                    onChange={(e) => setInvestigationName(e.target.value)}
                    placeholder="e.g., Operation Cyber Shield"
                    className="input-glass w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8B949E] mb-2">
                    Case ID *
                  </label>
                  <input
                    type="text"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    placeholder="e.g., 2025-FRD-001"
                    className="input-glass w-full text-sm"
                  />
                </div>
              </div>

              {/* Analysis Options */}
              <div className="mb-4">
                <label className="block text-sm text-[#8B949E] mb-2">
                  Analysis Options
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Centrality Analysis",
                    "Fraud Ring Detection",
                    "AI Briefings",
                    "Timeline Visualization",
                  ].map((option, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 text-sm text-[#E1E4E8]"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-[rgba(255,255,255,0.2)] bg-transparent text-[#1E88E5]"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="alert-info rounded-lg p-3 mb-4">
                <p className="text-xs text-[#E1E4E8]">
                  💡 Your data is encrypted and processed locally.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary flex-1 text-sm py-2"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary flex-1 text-sm py-2 font-semibold"
                  disabled={!investigationName || !caseId}
                >
                  Create Case & Analyze
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the trigger button component
export function NewCaseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-[#1E88E5] hover:bg-[#00BCD4] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">New Case</span>
    </button>
  );
}