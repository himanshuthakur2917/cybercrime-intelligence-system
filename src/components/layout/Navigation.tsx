"use client";

import { BrainCircuit, Crown, Network, Share2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/network", label: "Network View", icon: Network },
  { href: "/dashboard/kingpins", label: "Kingpins Leaderboard", icon: Crown },
  { href: "/dashboard/rings", label: "Rings Detection", icon: Share2 },
  { href: "/dashboard/brief", label: "AI Brief Generator", icon: BrainCircuit },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="h-12 glass-nav flex items-stretch px-6 border-b border-[rgba(255,255,255,0.1)] shrink-0 z-20 overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-tab flex items-center px-4 text-sm font-medium whitespace-nowrap gap-2 ${
              isActive ? "active" : ""
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}