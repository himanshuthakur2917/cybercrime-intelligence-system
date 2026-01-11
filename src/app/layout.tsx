import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CIS | Cybercrime Intelligence System",
  description:
    "AI-Powered Law Enforcement Investigation Dashboard for cybercrime detection and suspect analysis",
  keywords: [
    "cybercrime",
    "intelligence",
    "investigation",
    "law enforcement",
    "fraud detection",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} h-screen antialiased bg-[#0b0f14] text-white`}>
        <div className="flex flex-col h-full overflow-hidden">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Navigation />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
