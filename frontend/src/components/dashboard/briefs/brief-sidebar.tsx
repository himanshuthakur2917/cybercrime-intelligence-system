"use client";

import {
  RefreshCw,
  Copy,
  Download,
  Mail,
  Printer,
  ChevronDown,
} from "lucide-react";
import { suspects } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BriefSidebarProps {
  selectedSuspectId: string;
  onSuspectChange: (id: string) => void;
}

export function BriefSidebar({
  selectedSuspectId,
  onSuspectChange,
}: BriefSidebarProps) {
  return (
    <div className="w-80 shrink-0 border-r bg-muted/10 p-6 flex flex-col gap-6 overflow-y-auto h-full">
      {/* Suspect Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Select Suspect
        </Label>
        <Select value={selectedSuspectId} onValueChange={onSuspectChange}>
          <SelectTrigger className="w-full bg-background p-5.5">
            <SelectValue className="" placeholder="Select a suspect" />
          </SelectTrigger>
          <SelectContent>
            {suspects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.role}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Briefing Options */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Briefing Configuration
        </Label>
        <div className="space-y-3">
          <Select defaultValue="full">
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Length: Full Detail</SelectItem>
              <SelectItem value="summary">Length: Executive Summary</SelectItem>
              <SelectItem value="extended">
                Length: Extended & Raw Data
              </SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="text">
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Format: Standard Text</SelectItem>
              <SelectItem value="markdown">Format: Markdown</SelectItem>
              <SelectItem value="pdf">Format: PDF Document</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-auto">
        <Button variant="outline" className="w-full justify-start gap-2">
          <RefreshCw className="w-4 h-4" />
          Regenerate Brief
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Copy className="w-4 h-4" />
          Copy to Clipboard
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Download className="w-4 h-4" />
          Export as PDF
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Mail className="w-4 h-4" />
          Email Brief
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>
    </div>
  );
}
