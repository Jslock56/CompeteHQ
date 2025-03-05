"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Import the CSS - this is critical
import "../styles/globals.css";

// Define navigation items
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.479m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    name: 'Roster',
    href: '/roster',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    name: 'Games',
    href: '/games',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    name: 'Lineups',
    href: '/lineup',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
];

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock current team - in real app would come from context or state
  const currentTeam = {
    id: '1',
    name: 'Wildcats',
    ageGroup: '10U'
  };

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {/* Header */}
          <header className="header">
            <div className="container">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="header-title">Baseball Coach</span>
                </div>
                <div className="flex items-center">
                  {currentTeam && (
                    <span>{currentTeam.name} | {currentTeam.ageGroup}</span>
                  )}
                </div>
                
                {/* Mobile menu button */}
                <div className="sm:hidden ml-4">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </header>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="card">
              <div className="mb-4">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`btn ${isActive ? 'btn-secondary' : ''} mb-2 flex items-center`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="mr-3">{item.icon}</div>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Container */}
          <div className="flex">
            {/* Sidebar */}
            <aside className="hidden sm:block" style={{width: "16rem", backgroundColor: "white", borderRight: "1px solid #e2e8f0"}}>
              <div style={{height: "100%", overflowY: "auto"}}>
                {currentTeam && (
                  <div style={{padding: "1rem", borderBottom: "1px solid #e2e8f0"}}>
                    <div style={{fontSize: "0.875rem", fontWeight: "500", color: "#64748b"}}>Current Team</div>
                    <div style={{fontSize: "1rem", fontWeight: "600", color: "#0f172a"}}>{currentTeam.name}</div>
                  </div>
                )}
                <nav style={{padding: "1rem 0.5rem"}}>
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center p-2 mb-2 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                            : ''
                        }`}
                        style={{borderRadius: "0.375rem"}}
                      >
                        <div className="mr-3" style={{color: isActive ? "#1d4ed8" : "#94a3b8"}}>
                          {item.icon}
                        </div>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main style={{flex: "1", overflow: "auto", padding: "1.5rem"}}>
              <div className="container">
                {children}
              </div>
            </main>
          </div>

          {/* Footer */}
          <footer style={{backgroundColor: "white", borderTop: "1px solid #e2e8f0", padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#64748b"}}>
            <p>© {new Date().getFullYear()} Baseball Coach App</p>
          </footer>
        </div>
      </body>
    </html>
  );
}