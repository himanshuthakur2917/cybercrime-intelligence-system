"use client";

import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!isLoginPage && <Header />}

      <div className="flex flex-1 overflow-hidden">
        {!isLoginPage && <Navigation />}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
