"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { Team } from '../types/team';
import { useTeam } from '../hooks/use-team';
import Link from 'next/link';

/**
 * Team context state interface
 */
interface TeamContextState {
  /**
   * All teams available to the user
   */
  teams: Team[];
  
  /**
   * Currently selected team
   */
  currentTeam: Team | null;
  
  /**
   * Whether teams are currently loading
   */
  isLoading: boolean;
  
  /**
   * Any error that occurred during team operations
   */
  error: string | null;
  
  /**
   * Create a new team
   */
  createTeam: (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Team;
  
  /**
   * Update an existing team
   */
  updateTeam: (team: Team) => boolean;
  
  /**
   * Delete a team
   */
  deleteTeam: (teamId: string) => boolean;
  
  /**
   * Set the current team by ID
   */
  setCurrentTeam: (teamId: string) => void;
  
  /**
   * Clear the current team selection
   */
  clearCurrentTeam: () => void;
  
  /**
   * Reload team data from storage
   */
  refreshTeams: () => void;
}

// Create the context with a default empty state
const TeamContext = createContext<TeamContextState | undefined>(undefined);

/**
 * Props for TeamProvider component
 */
interface TeamProviderProps {
  children: ReactNode;
}

/**
 * Provider component for team data
 * Wraps children with the TeamContext provider
 */
export function TeamProvider({ children }: TeamProviderProps) {
  // Use the team hook to manage teams
  const teamHook = useTeam();
  
  // Context value contains all values and methods from team hook
  const contextValue: TeamContextState = {
    ...teamHook
  };
  
  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Custom hook to use the team context
 * Must be used within a TeamProvider
 */
export function useTeamContext(): TeamContextState {
  const context = useContext(TeamContext);
  
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  
  return context;
}

/**
 * Higher-order component that requires a current team to be selected
 * Renders a team selection UI if no team is selected
 */
export function withTeam<P extends object>(Component: React.ComponentType<P>) {
  return function WithTeamComponent(props: P & React.JSX.IntrinsicAttributes) {
    const { currentTeam, teams, setCurrentTeam, isLoading } = useTeamContext();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading teams...</p>
          </div>
        </div>
      );
    }
    
    if (!currentTeam) {
      return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Select a Team</h2>
          
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No teams available. Create your first team to get started.</p>
              <Link
                href="/teams/new"
                className="inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition"
              >
                Create Team
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50 transition flex justify-between items-center"
                  onClick={() => setCurrentTeam(team.id)}
                >
                  <div>
                    <span className="font-medium">{team.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{team.ageGroup}</span>
                  </div>
                  <span className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              ))}
              
              <div className="pt-4 mt-4 border-t">
                <Link
                  href="/teams/new"
                  className="inline-block text-primary-600 hover:text-primary-800 transition"
                >
                  + Create New Team
                </Link>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

export default TeamContext;