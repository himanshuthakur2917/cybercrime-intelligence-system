"use client";

import { AlertCircle, Check, FileText, Upload } from "lucide-react";
import { useState } from "react";

interface UploadedFile {
  name: string;
  status: "pending" | "valid" | "error";
  rows?: number;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [step, setStep] = useState(1);
  const [investigationName, setInvestigationName] = useState(
    "Operation Cyber Shield"
  );
  const [caseId, setCaseId] = useState("2025-FRD-001");

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

  return (
    <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl glass-card-static p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            NEW INVESTIGATION
          </h1>
          <p className="text-[#8B949E]">
            Load Your Data & Analyze Criminal Network
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E88E5] transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#6E7681]">
            <span className={step >= 1 ? "text-[#1E88E5]" : ""}>
              Step 1: Upload
            </span>
            <span className={step >= 2 ? "text-[#1E88E5]" : ""}>
              Step 2: Preview
            </span>
            <span className={step >= 3 ? "text-[#1E88E5]" : ""}>
              Step 3: Configure
            </span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Upload Your Data Files
            </h2>

            {/* Required Files Checklist */}
            <div className="flex gap-4 mb-6 flex-wrap">
              {requiredFiles.map((file) => (
                <div key={file} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                    {files.find((f) => f.name === file) && (
                      <Check className="w-3 h-3 text-[#388E3C]" />
                    )}
                  </div>
                  <span className="text-[#8B949E] font-mono">{file}</span>
                  <span className="text-xs text-[#D32F2F]">*required</span>
                </div>
              ))}
            </div>

            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="glass-dark p-12 border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-xl text-center cursor-pointer hover:border-[#1E88E5] transition-colors"
            >
              <Upload className="w-16 h-16 mx-auto text-[#6E7681] mb-4" />
              <p className="text-lg text-white font-medium mb-2">
                Drag CSV files here or click to browse
              </p>
              <p className="text-sm text-[#6E7681] mb-4">
                Supported: .csv files (Max 50MB per file)
              </p>
              <button onClick={handleFileSelect} className="btn-primary">
                Browse Files...
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              File Preview & Validation
            </h2>

            <div className="space-y-4 mb-6">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="glass-dark rounded-lg overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.1)]">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#1E88E5]" />
                      <span className="text-white font-mono">{file.name}</span>
                      <span className="text-xs text-[#6E7681]">
                        ({file.rows} rows)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "valid" ? (
                        <>
                          <Check className="w-4 h-4 text-[#388E3C]" />
                          <span className="text-sm text-[#388E3C]">Valid</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
                          <span className="text-sm text-[#D32F2F]">Error</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="p-4 overflow-x-auto">
                    {file.name === "suspects.csv" && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#6E7681] text-xs uppercase">
                            <th className="text-left pb-2">ID</th>
                            <th className="text-left pb-2">Name</th>
                            <th className="text-left pb-2">Phone</th>
                            <th className="text-left pb-2">Account</th>
                            <th className="text-left pb-2">Risk</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#E1E4E8] font-mono">
                          <tr>
                            <td>S1</td>
                            <td>Rajesh Kumar</td>
                            <td>9876543210</td>
                            <td>ICICI_123456</td>
                            <td>78%</td>
                          </tr>
                          <tr>
                            <td>S2</td>
                            <td>Amit Singh</td>
                            <td>9876543211</td>
                            <td>HDFC_789012</td>
                            <td>75%</td>
                          </tr>
                          <tr className="text-[#6E7681]">
                            <td colSpan={5}>... 3 more rows</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    {file.name === "calls.csv" && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#6E7681] text-xs uppercase">
                            <th className="text-left pb-2">From</th>
                            <th className="text-left pb-2">To</th>
                            <th className="text-left pb-2">Count</th>
                            <th className="text-left pb-2">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#E1E4E8] font-mono">
                          <tr>
                            <td>S1</td>
                            <td>S4</td>
                            <td>12</td>
                            <td>45 min</td>
                          </tr>
                          <tr>
                            <td>S2</td>
                            <td>S4</td>
                            <td>6</td>
                            <td>22 min</td>
                          </tr>
                          <tr className="text-[#6E7681]">
                            <td colSpan={4}>... 5 more rows</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    {file.name === "transactions.csv" && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#6E7681] text-xs uppercase">
                            <th className="text-left pb-2">From</th>
                            <th className="text-left pb-2">To</th>
                            <th className="text-left pb-2">Amount</th>
                            <th className="text-left pb-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#E1E4E8] font-mono">
                          <tr>
                            <td>ICICI_123456</td>
                            <td>IDBI_901234</td>
                            <td>₹75,000</td>
                            <td>2025-02-10</td>
                          </tr>
                          <tr>
                            <td>HDFC_789012</td>
                            <td>IDBI_901234</td>
                            <td>₹120,000</td>
                            <td>2025-02-11</td>
                          </tr>
                          <tr className="text-[#6E7681]">
                            <td colSpan={4}>... 3 more rows</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(3)} className="btn-primary w-full">
              Continue to Configuration
            </button>
          </div>
        )}

        {/* Step 3: Configure */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Configuration & Options
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-[#8B949E] mb-2">
                  Investigation Name
                </label>
                <input
                  type="text"
                  value={investigationName}
                  onChange={(e) => setInvestigationName(e.target.value)}
                  className="input-glass w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8B949E] mb-2">
                  Case ID
                </label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="input-glass w-full"
                />
              </div>
            </div>

            {/* Analysis Options */}
            <div className="mb-6">
              <label className="block text-sm text-[#8B949E] mb-3">
                Analysis Options
              </label>
              <div className="space-y-2">
                {[
                  "Perform Centrality Analysis (Identify Kingpins)",
                  "Detect Fraud Rings (Clustering)",
                  "Generate AI Briefings (For each suspect)",
                  "Create Timeline Visualization",
                  "Generate Arrest Playbook",
                ].map((option, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 text-sm text-[#E1E4E8]"
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
            <div className="alert-info rounded-lg p-4 mb-6">
              <p className="text-sm text-[#E1E4E8]">
                💡 Your data is encrypted and processed locally. No data is
                stored after analysis completes.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button className="btn-primary flex-1 font-semibold">
                ANALYZE NETWORK
              </button>
            </div>
          </div>
        )}

        {/* Footer Support */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)] text-center">
          <p className="text-xs text-[#6E7681] mb-2">NEED HELP?</p>
          <div className="flex justify-center gap-4 text-xs">
            <a
              href="#"
              className="text-[#8B949E] hover:text-[#1E88E5] transition-colors"
            >
              Data Format Guide
            </a>
            <span className="text-[#6E7681]">|</span>
            <a
              href="#"
              className="text-[#8B949E] hover:text-[#1E88E5] transition-colors"
            >
              Sample Files
            </a>
            <span className="text-[#6E7681]">|</span>
            <a
              href="#"
              className="text-[#8B949E] hover:text-[#1E88E5] transition-colors"
            >
              FAQ
            </a>
            <span className="text-[#6E7681]">|</span>
            <a
              href="#"
              className="text-[#8B949E] hover:text-[#1E88E5] transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}