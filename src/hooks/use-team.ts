/**
 * Custom hook for team management
 * Provides methods for creating, reading, updating, and deleting teams
 * using MongoDB as the data store
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Team } from '../types/team';

// Local team ID storage for now - will be replaced with proper MongoDB-based session in the future
function getStoredTeamId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentTeamId');
}

function setStoredTeamId(teamId: string | null): void {
  if (typeof window === 'undefined') return;
  if (teamId) {
    localStorage.setItem('currentTeamId', teamId);
  } else {
    localStorage.removeItem('currentTeamId');
  }
}

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
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(getStoredTeamId());
  
  // Get current team from teams array
  const currentTeam = currentTeamId 
    ? teams.find(team => team.id === currentTeamId) || null
    : null;

  // Function to clear current team
  const clearCurrentTeam = useCallback(() => {
    setCurrentTeamId(null);
    setStoredTeamId(null);
  }, []);
  
  // Function to set current team
  const setCurrentTeam = useCallback((teamId: string) => {
    setCurrentTeamId(teamId);
    setStoredTeamId(teamId);
  }, []);

  /**
   * Load all teams from MongoDB via API
   */
  const loadTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get teams from MongoDB via API
      const response = await fetch('/api/teams/memberships');
      
      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.teams) {
        console.log('Teams loaded from MongoDB:', data.teams.length);
        setTeams(data.teams);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to load teams from database');
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
      setError('Failed to load teams: ' + String(err));
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new team in MongoDB
   */
  const createTeam = useCallback(async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> => {
    const now = Date.now();
    
    const newTeam: Team = {
      id: uuidv4(),
      ...teamData,
      createdAt: now,
      updatedAt: now
    };

    try {
      // Save to MongoDB via API
      console.log('Creating team in MongoDB:', newTeam);
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeam),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating team: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create team in database');
      }
      
      console.log('Team created in MongoDB successfully:', data.team);
      
      // Refresh the teams list
      loadTeams();
      
      return data.team || newTeam;
    } catch (error) {
      console.error('Team creation error:', error);
      throw new Error('Failed to save team: ' + String(error));
    }
  }, [loadTeams]);

  /**
   * Update an existing team in MongoDB
   */
  const updateTeam = useCallback(async (team: Team): Promise<boolean> => {
    // Update the timestamp
    const updatedTeam: Team = {
      ...team,
      updatedAt: Date.now()
    };
    
    try {
      // Update in MongoDB via API
      console.log('Updating team in MongoDB:', updatedTeam);
      
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTeam),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating team: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update team in database');
      }
      
      console.log('Team updated in MongoDB successfully');
      
      // Update local state
      setTeams(prevTeams => 
        prevTeams.map(t => 
          t.id === team.id ? updatedTeam : t
        )
      );
      
      return true;
    } catch (error) {
      console.error('Team update error:', error);
      return false;
    }
  }, []);

  /**
   * Delete a team from MongoDB
   */
  const deleteTeam = useCallback(async (teamId: string): Promise<boolean> => {
    try {
      // Delete from MongoDB via API
      console.log('Deleting team from MongoDB:', teamId);
      
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting team: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete team from database');
      }
      
      console.log('Team deleted from MongoDB successfully');
      
      // Update local state
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      
      // If this was the current team, clear it
      if (currentTeamId === teamId) {
        clearCurrentTeam();
      }
      
      return true;
    } catch (error) {
      console.error('Team deletion error:', error);
      return false;
    }
  }, [currentTeamId, clearCurrentTeam]);

  // Load teams on initial mount
  useEffect(() => {
    const fetchTeams = async () => {
      await loadTeams();
    };
    
    fetchTeams();
  }, [loadTeams]);

  return {
    teams,
    currentTeam,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    setCurrentTeam,
    clearCurrentTeam,
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

  // Load team data from MongoDB
  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      setIsLoading(false);
      return;
    }
    
    const fetchTeam = async () => {
      setIsLoading(true);
      try {
        // Fetch team from MongoDB via API
        const response = await fetch(`/api/teams/${teamId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching team: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.team) {
          setTeam(data.team);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load team from database');
        }
      } catch (err) {
        console.error('Failed to load team:', err);
        setError('Failed to load team: ' + String(err));
        setTeam(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeam();
  }, [teamId]);

  /**
   * Update the team in MongoDB
   */
  const updateTeam = useCallback(async (updatedTeam: Team): Promise<boolean> => {
    if (!updatedTeam) return false;
    
    // Update timestamp
    const teamWithTimestamp: Team = {
      ...updatedTeam,
      updatedAt: Date.now()
    };
    
    try {
      // Update in MongoDB via API
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamWithTimestamp),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating team: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update team in database');
      }
      
      console.log('Team updated in MongoDB successfully');
      setTeam(teamWithTimestamp);
      return true;
    } catch (error) {
      console.error('Team update error:', error);
      return false;
    }
  }, []);
  
  /**
   * Refresh team data from MongoDB
   */
  const refreshTeam = useCallback(async () => {
    if (!teamId) return;
    
    try {
      // Fetch from MongoDB via API
      const response = await fetch(`/api/teams/${teamId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching team: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.team) {
        setTeam(data.team);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to refresh team from database');
      }
    } catch (err) {
      console.error('Failed to refresh team:', err);
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