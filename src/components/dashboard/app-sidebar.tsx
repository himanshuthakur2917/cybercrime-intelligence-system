"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartAreaLine,
  IconChartAreaLineFilled,
  IconChartBar,
  IconCrown,
  IconCrownFilled,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconGraph,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconNetwork,
  IconReport,
  IconSearch,
  IconSettings,
  IconShield,
  IconShieldCheckeredFilled,
  IconTopologyRing,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/dashboard/nav-documents";
import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Network View",
      url: "/dashboard",
      icon: IconChartAreaLine,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
    },
    {
      title: "Kingpins Leaderboard",
      url: "/dashboard/kingpins",
      icon: IconCrown,
    },
    {
      title: "Fraud Rings",
      url: "/dashboard/rings",
      icon: IconTopologyRing,
    },
    {
      title: "AI Briefing",
      url: "/dashboard/briefs",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconShieldCheckeredFilled className="!size-6" />
                <div className="flex flex-col">
                  <div className="text-base font-semibold -mb-0.75">
                    CYBERCRIME INTELLIGENCE
                  </div>
                  <div className="text-base font-semibold -mt-0.75">SYSTEM</div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
