/**
 * Custom hook for team management
 * Provides methods for creating, reading, updating, and deleting teams
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storage/enhanced-storage';
import { useCurrentTeam } from './use-local-storage';
import type { Team } from '../types/team';

/**
 * Result from the useTeam hook
 */
interface UseTeamResult {
  /**
   * All teams in the system
   */
  teams: Team[];
  
  /**
   * Currently selected team (if any)
   */
  currentTeam: Team | null;
  
  /**
   * Is data still loading
   */
  isLoading: boolean;
  
  /**
   * Error message (if any)
   */
  error: string | null;
  
  /**
   * Create a new team
   */
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Team;
  
  /**
   * Update an existing team
   */
  updateTeam: (team: Team) => boolean;
  
  /**
   * Delete a team
   */
  deleteTeam: (teamId: string) => boolean;
  
  /**
   * Set the current team
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

/**
 * Hook for team management
 * @returns Team management methods and state
 */
export function useTeam(): UseTeamResult {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTeamId, setCurrentTeamId, clearCurrentTeamId] = useCurrentTeam();
  
  // Get current team from teams array
  const currentTeam = currentTeamId 
    ? teams.find(team => team.id === currentTeamId) || null
    : null;

  /**
   * Load all teams from storage
   */
  const loadTeams = useCallback(() => {
    try {
      setIsLoading(true);
      const allTeams = storageService.team.getAllTeams();
      setTeams(allTeams);
      setError(null);
    } catch (err) {
      setError('Failed to load teams: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new team
   */
  const createTeam = useCallback((teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Team => {
    const now = Date.now();
    
    const newTeam: Team = {
      id: uuidv4(),
      ...teamData,
      createdAt: now,
      updatedAt: now
    };

    const success = storageService.team.saveTeam(newTeam);
    
    if (!success) {
      throw new Error('Failed to save team');
    }
    
    // Refresh the teams list
    loadTeams();
    
    return newTeam;
  }, [loadTeams]);

  /**
   * Update an existing team
   */
  const updateTeam = useCallback((team: Team): boolean => {
    // Update the timestamp
    const updatedTeam: Team = {
      ...team,
      updatedAt: Date.now()
    };
    
    const success = storageService.team.saveTeam(updatedTeam);
    
    if (success) {
      // Update local state
      setTeams(prevTeams => 
        prevTeams.map(t => 
          t.id === team.id ? updatedTeam : t
        )
      );
    }
    
    return success;
  }, []);

  /**
   * Delete a team
   */
  const deleteTeam = useCallback((teamId: string): boolean => {
    const success = storageService.team.deleteTeam(teamId);
    
    if (success) {
      // Update local state
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      
      // If this was the current team, clear it
      if (currentTeamId === teamId) {
        clearCurrentTeamId();
      }
    }
    
    return success;
  }, [currentTeamId, clearCurrentTeamId]);

  // Load teams on initial mount
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return {
    teams,
    currentTeam,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    setCurrentTeam: setCurrentTeamId,
    clearCurrentTeam: clearCurrentTeamId,
    refreshTeams: loadTeams
  };
}

/**
 * Hook for managing a single team
 * @param teamId - ID of the team to manage
 * @returns Single team management methods and state
 */
export function useSingleTeam(teamId: string | null) {
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load team data
  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const teamData = storageService.team.getTeam(teamId);
      setTeam(teamData);
      setError(null);
    } catch (err) {
      setError('Failed to load team: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  /**
   * Update the team
   */
  const updateTeam = useCallback((updatedTeam: Team): boolean => {
    if (!updatedTeam) return false;
    
    // Update timestamp
    const teamWithTimestamp: Team = {
      ...updatedTeam,
      updatedAt: Date.now()
    };
    
    const success = storageService.team.saveTeam(teamWithTimestamp);
    
    if (success) {
      setTeam(teamWithTimestamp);
    }
    
    return success;
  }, []);
  
  /**
   * Refresh team data from storage
   */
  const refreshTeam = useCallback(() => {
    if (!teamId) return;
    
    try {
      const teamData = storageService.team.getTeam(teamId);
      setTeam(teamData);
      setError(null);
    } catch (err) {
      setError('Failed to refresh team: ' + String(err));
    }
  }, [teamId]);

  return {
    team,
    isLoading,
    error,
    updateTeam,
    refreshTeam
  };
}

export default useTeam;