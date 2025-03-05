// src/app/layout.tsx
"use client";

import { ReactNode, useState } from "react";
import Header from "../components/common/header";
import Navigation from "../components/common/navigation";
import WidgetsSidebar from "../components/common/widgets-sidebar";
import { TeamProvider } from "../contexts/team-context";
import "../styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isWidgetSidebarOpen, setWidgetSidebarOpen] = useState(false);
  
  // Get current team from context or local state
  const currentTeam = {
    id: '1',
    name: 'Wildcats',
    ageGroup: '10U'
  };

  return (
    <html lang="en">
      <body className="h-screen flex flex-col bg-gray-50">
        <TeamProvider>
          {/* Header - smaller height */}
          <Header currentTeam={currentTeam} />
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Navigation */}
            <div className={`bg-white w-60 border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? '' : '-ml-60'}`}>
              <Navigation currentTeam={currentTeam} />
              
              {/* Toggle button at bottom of sidebar */}
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="absolute bottom-4 left-4 p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  {isSidebarOpen ? (
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              <main className="p-6">{children}</main>
            </div>
            
            {/* Right Sidebar - Widgets (Collapsible) */}
            <div className={`bg-white w-72 border-l border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out ${isWidgetSidebarOpen ? '' : 'translate-x-full'}`}>
              <WidgetsSidebar />
              
              {/* Toggle button */}
              <button 
                onClick={() => setWidgetSidebarOpen(!isWidgetSidebarOpen)}
                className="absolute top-20 right-0 p-1 rounded-l-md bg-white border border-gray-200 border-r-0 text-gray-600 hover:bg-gray-50"
                style={{ transform: isWidgetSidebarOpen ? 'translateX(-100%)' : 'translateX(-100%)' }}
                title={isWidgetSidebarOpen ? "Hide widgets" : "Show widgets"}
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  {isWidgetSidebarOpen ? (
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Footer - slim and simple */}
          <footer className="bg-white border-t border-gray-200 py-2 px-4 text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} competeHQ
          </footer>
        </TeamProvider>
      </body>
    </html>
  );
}