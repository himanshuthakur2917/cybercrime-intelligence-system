"use client";

import { supabase } from "@/lib/supabase/client";
import {
  Bell,
  LogOut,
  Mail,
  Plus,
  Search,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NewCaseModal from "./NewCaseModal";

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <header className="h-16 glass-header flex items-center justify-between px-6 z-30 shrink-0">
        {/* Left: Branding */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#1E88E5] to-[#0097A7] flex items-center justify-center shadow-lg">
            <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <h4 className="text-white font-semibold text-lg tracking-tight">
            CIS
            <span className="text-[#6E7681] text-sm font-normal ml-2 hidden sm:inline">
              Cybercrime Intelligence System
            </span>
          </h4>
        </Link>

        {/* Center: Search */}
        <div className="hidden md:block">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E] w-4 h-4" />
            <input
              type="text"
              placeholder="Search suspects, IDs, or accounts..."
              className="w-full bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pl-10 pr-4 text-sm text-[#E1E4E8] focus:outline-none focus:border-[#1E88E5] focus:ring-1 focus:ring-[#1E88E5]/30 transition-all placeholder-[#6E7681]"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* New Case */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1E88E5] hover:bg-[#00BCD4] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Case</span>
          </button>

          {/* Notifications */}
          <div className="flex items-center gap-3 border-l border-[rgba(255,255,255,0.1)] pl-4">
            <button className="relative text-[#8B949E] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#D32F2F] rounded-full border border-[#0D1117]" />
            </button>
            <button className="text-[#8B949E] hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </button>
          </div>

          {/* User Info + Logout */}
          <div className="flex items-center gap-3 border-l border-[rgba(255,255,255,0.1)] pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">Det. R. Singh</p>
              <p className="text-xs text-[#6E7681]">Cyber Cell Unit 4</p>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#161B22] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#1E88E5] font-bold text-sm">
              RS
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* New Case Modal */}
      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
