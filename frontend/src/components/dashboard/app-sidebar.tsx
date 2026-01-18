"use client";

import * as React from "react";
import {
  IconAward,
  IconCarouselVertical,
  IconChartAreaLine,
  IconChartBar,
  IconCrown,
  IconDatabase,
  IconFileDescription,
  IconHelp,
  IconSearch,
  IconSettings,
  IconShieldCheckeredFilled,
  IconStackBack,
  IconTarget,
  IconTopologyRing,
  IconUsers,
  IconUserShield,
  IconMapPin,
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
  adminNav: [
    {
      title: "Data Ingestion",
      url: "/admin/upload",
      icon: IconDatabase,
    },
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
  ],
  navMain: [
    {
      title: "Network View",
      url: "", // Will be set dynamically
      icon: IconChartAreaLine,
    },
    {
      title: "Geolocation Map",
      url: "/map",
      icon: IconMapPin,
    },
    {
      title: "Pattern Analysis",
      url: "/patterns",
      icon: IconTopologyRing,
    },
    {
      title: "Suspect Tracking",
      url: "/tracking",
      icon: IconTarget,
    },
    {
      title: "Data Upload",
      url: "/upload",
      icon: IconFileDescription,
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
      // Extract case ID from pathname if it exists
      const dashboardMatch = pathname.match(/^\/dashboard\/([^\/]+)/);
      const caseId = dashboardMatch ? dashboardMatch[1] : null;

      // If we have a case ID, prepend it to all dashboard routes
      if (caseId) {
        const updatedNavMain = sidebarData.navMain.map((item) => ({
          ...item,
          url:
            item.url === ""
              ? `/dashboard/${caseId}`
              : `/dashboard/${caseId}${item.url}`,
        }));
        setNavItems(updatedNavMain);
      } else {
        // No case ID - user is on case selection page
        // Show only "Select Case" or disable navigation
        setNavItems([
          {
            title: "Select a Case",
            url: "/dashboard",
            icon: IconFileDescription,
          },
        ]);
      }
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
