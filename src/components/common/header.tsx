"use client";

// src/components/common/header.tsx
import React, { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  showNav?: boolean;
  currentTeam?: {
    id: string;
    name: string;
    ageGroup?: string;
  } | null;
  onOpenTeamSelector?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showNav = true, currentTeam, onOpenTeamSelector }) => {
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                {/* Replace with your actual logo */}
                <div className="h-8 w-8 rounded bg-primary-600 flex items-center justify-center text-white font-bold mr-2">
                  C
                </div>
                <span className="text-lg font-bold text-gray-900">competeHQ</span>
              </Link>
            </div>
            
            {showNav && (
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/roster"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Roster
                </Link>
                <Link 
                  href="/lineup"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Lineup
                </Link>
                <Link 
                  href="/games"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Games
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center">
            {currentTeam ? (
              <div className="flex items-center">
                <div 
                  className="flex items-center cursor-pointer group relative"
                  onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                >
                  <span className="text-sm font-medium text-gray-700 mr-1">
                    {currentTeam.name} {currentTeam.ageGroup && `| ${currentTeam.ageGroup}`}
                  </span>
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  
                  {/* Team Dropdown Menu */}
                  {isTeamMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-10 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="team-menu">
                        <Link
                          href="/teams"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setIsTeamMenuOpen(false)}
                        >
                          Manage Teams
                        </Link>
                        <Link
                          href="/teams/new"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setIsTeamMenuOpen(false)}
                        >
                          Create New Team
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 relative">
                  <button 
                    className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">View settings</span>
                    {/* Settings icon */}
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/teams/new"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create Team
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;