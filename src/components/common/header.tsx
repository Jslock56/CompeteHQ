"use client"

// src/components/common/header.tsx
import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  showNav?: boolean;
  currentTeam?: {
    id: string;
    name: string;
  } | null;
}

const Header: React.FC<HeaderProps> = ({ showNav = true, currentTeam }) => {
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
                  className="border-primary-500 text-primary-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {currentTeam.name}
                </span>
                <div className="relative">
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
              <button
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create Team
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;