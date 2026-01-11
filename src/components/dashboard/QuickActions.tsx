"use client";

import { FileText, Zap } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="glass-card p-5">
      <h4 className="text-base font-semibold text-white mb-4">Quick Actions</h4>
      <div className="flex flex-col gap-3">
        <Link
          href="/brief"
          className="w-full bg-[#1E88E5] hover:bg-[#00BCD4] active:bg-[#0097A7] text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
        >
          <Zap className="w-4 h-4" />
          Generate Intelligence Brief
        </Link>
        <button className="w-full bg-transparent border border-[rgba(255,255,255,0.1)] hover:bg-white/5 text-[#E1E4E8] font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
          <FileText className="w-4 h-4" />
          Create Arrest Playbook
        </button>
        <div className="flex gap-2">
          <button className="flex-1 bg-transparent border border-[rgba(255,255,255,0.1)] hover:bg-white/5 text-[#8B949E] hover:text-white py-2 px-3 rounded-lg text-xs font-medium transition-all">
            Export Report
          </button>
          <button className="flex-1 bg-transparent border border-[rgba(255,255,255,0.1)] hover:bg-white/5 text-[#8B949E] hover:text-white py-2 px-3 rounded-lg text-xs font-medium transition-all">
            Share Case
          </button>
        </div>
      </div>
    </div>
  );
}