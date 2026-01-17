"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { sidebarData } from "./app-sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SiteHeader() {
  const [title, setTitle] = useState<string>();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    let currentItem = sidebarData.navMain.find((item) => item.url === pathname);
    if (currentItem) {
      Promise.resolve().then(() => setTitle(currentItem?.title));
    } else {
      currentItem = sidebarData.adminNav.find((item) => item.url === pathname);
      if (currentItem) {
        Promise.resolve().then(() => setTitle(currentItem?.title));
      }
    }
  }, [pathname]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium"> {title} </h1>
        <div className="ml-auto flex items-center gap-3">
          {user && (
            <>
              <Badge
                variant={user.role === "administrator" ? "default" : "outline"}
                className="hidden sm:flex"
              >
                {user.role === "administrator" ? "Admin" : "Officer"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
