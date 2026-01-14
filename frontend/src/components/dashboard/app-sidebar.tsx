"use client";

import * as React from "react";
import {
  IconAward,
  IconCarouselVertical,
  IconChartAreaLine,
  IconChartBar,
  IconCrown,
  IconFileDescription,
  IconHelp,
  IconSearch,
  IconSettings,
  IconShieldCheckeredFilled,
  IconStackBack,
  IconTopologyRing,
  IconUsers,
  IconUserShield,
} from "@tabler/icons-react";

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
import { usePathname } from "next/navigation";

export const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  adminNav: [
    {
      title: "Overview",
      url: "/admin",
      icon: IconCarouselVertical,
    },
    {
      title: "Case Management",
      url: "/admin/cases",
      icon: IconFileDescription,
    },
    {
      title: "Officer Management",
      url: "/admin/officers",
      icon: IconUserShield,
    },
    {
      title: "Warrants",
      url: "/admin/warrants",
      icon: IconAward,
    },
    {
      title: "Audit Logs",
      url: "/admin/audits",
      icon: IconStackBack,
    },
  ],
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
      title: "Geolocation Map",
      url: "/dashboard/map",
      icon: IconSearch,
    },
    {
      title: "Pattern Analysis",
      url: "/dashboard/patterns",
      icon: IconTopologyRing,
    },
    {
      title: "Suspect Tracking",
      url: "/dashboard/tracking",
      icon: IconUsers,
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
    {
      title: "Data Upload",
      url: "/dashboard/upload",
      icon: IconFileDescription,
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
  const pathname = usePathname();
  const [navItems, setNavItems] = React.useState(sidebarData.navMain);

  React.useEffect(() => {
    if (pathname.includes("/admin")) {
      setNavItems(sidebarData.adminNav);
    } else {
      setNavItems(sidebarData.navMain);
    }
  }, [pathname]);

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
        <NavMain items={navItems} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
