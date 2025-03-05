import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";
import Header from "@/components/common/header";
import Navigation from "@/components/common/navigation";
import Footer from "@/components/common/footer";
import "@/styles/globals.css";

// Configure Geist font family
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for SEO and browser tabs
export const metadata: Metadata = {
  title: "CompeteHQ - Baseball Coach's Assistant",
  description: "Youth baseball lineup management and position tracking tool",
  manifest: "/manifest.json",
};

// Viewport settings
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0ea5e9",
};

// Main layout component
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-gray-50">
        {/* App Container */}
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <Header />
          
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="hidden sm:block w-64 border-r border-gray-200 p-4 bg-white overflow-y-auto">
              <Navigation />
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-white sm:bg-gray-50 p-4 sm:p-6">
              {children}
            </main>
          </div>
          
          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}