/**
 * Custom hook for lineup management
 * Provides methods for creating, reading, updating lineups
 * This module exclusively uses MongoDB for data storage via API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Lineup, LineupInning, Position, PositionAssignment } from '../types/lineup';
import { Player } from '../types/player';
import { createDefaultLineup, createFieldPositionLineup, getFairPlayIssues } from '../utils/lineup-utils';
import { storageAdapter } from '../services/database/storage-adapter';

// Props for useLineup hook
interface UseLineupProps {
  /**
   * Game ID (if this is a game lineup)
   */
  gameId?: string;
  
  /**
   * Team ID
   */
  teamId: string;
  
  /**
   * Number of innings (for a game lineup)
   */
  innings?: number;
  
  /**
   * Initial lineup data (for editing)
   */
  initialLineup?: Lineup;
  
  /**
   * Available players
   */
  players: Player[];
  
  /**
   * Lineup name (for non-game lineups)
   */
  name?: string;
  
  /**
   * Lineup type (for non-game lineups)
   */
  type?: 'competitive' | 'developmental';
}

// Return type for useLineup hook
interface UseLineupResult {
  /**
   * Current lineup data
   */
  lineup: Lineup;
  
  /**
   * Assign a player to a position in a specific inning
   */
  assignPlayerToPosition: (inningNumber: number, position: Position, playerId: string) => void;
  
  /**
   * Copy position assignments from the previous inning to a target inning
   */
  copyFromPreviousInning: (targetInning: number) => void;
  
  /**
   * Swap two players' positions within an inning
   */
  swapPlayerPositions: (inningNumber: number, position1: Position, position2: Position) => void;
  
  /**
   * Swap a player with another player across any position/inning
   */
  swapPlayers: (inning1: number, position1: Position, inning2: number, position2: Position) => void;
  
  /**
   * Set lineup name (for non-game lineups)
   */
  setLineupName: (name: string) => void;
  
  /**
   * Set lineup type (for non-game lineups)
   */
  setLineupType: (type: 'competitive' | 'developmental') => void;
  
  /**
   * Validate the lineup and get all fair play issues
   */
  validateLineup: () => string[];
  
  /**
   * Save the lineup to storage
   */
  saveLineup: () => Promise<Lineup | null>;
  
  /**
   * Current fair play issues
   */
  fairPlayIssues: string[];
}

/**
 * Custom hook for managing a lineup
 */
export const useLineup = ({
  gameId,
  teamId,
  innings = 6,
  initialLineup,
  players,
  name,
  type
}: UseLineupProps): UseLineupResult => {
  // Initialize lineup state
  const [lineup, setLineup] = useState<Lineup>(() => {
    // Try to use initial lineup if provided
    if (initialLineup) return initialLineup;
    
    // Create new lineup - we don't load from local storage
    if (gameId) {
      // Game lineup
      return createDefaultLineup(teamId, gameId, innings);
    } else {
      // Field-position lineup
      return createFieldPositionLineup(teamId, name || 'New Lineup', type || 'competitive');
    }
  });
  
  // Track fair play issues
  const [fairPlayIssues, setFairPlayIssues] = useState<string[]>([]);
  
  // Find an inning by number
  const findInning = useCallback((inningNumber: number): LineupInning | undefined => {
    return lineup.innings.find(inning => inning.inning === inningNumber);
  }, [lineup.innings]);
  
  // Assign a player to a position in a specific inning
  const assignPlayerToPosition = useCallback((
    inningNumber: number, 
    position: Position, 
    playerId: string
  ) => {
    setLineup(currentLineup => {
      // Find the target inning
      const inningIndex = currentLineup.innings.findIndex(inning => inning.inning === inningNumber);
      
      if (inningIndex === -1) return currentLineup;
      
      // Create a new innings array
      const newInnings = [...currentLineup.innings];
      
      // Create a new positions array for this inning
      const newPositions = [...newInnings[inningIndex].positions];
      
      // Find the position index
      const positionIndex = newPositions.findIndex(pos => pos.position === position);
      
      if (positionIndex === -1) {
        // Position doesn't exist, add it
        newPositions.push({ position, playerId });
      } else {
        // Update existing position
        newPositions[positionIndex] = { position, playerId };
      }
      
      // Update the innings array
      newInnings[inningIndex] = {
        ...newInnings[inningIndex],
        positions: newPositions
      };
      
      // Return updated lineup
      return {
        ...currentLineup,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  }, []);
  
  // Copy assignments from previous inning
  const copyFromPreviousInning = useCallback((targetInning: number) => {
    if (targetInning <= 1) return; // Can't copy to first inning
    
    setLineup(currentLineup => {
      // Find target and source innings
      const targetInningIndex = currentLineup.innings.findIndex(inning => inning.inning === targetInning);
      const sourceInningIndex = currentLineup.innings.findIndex(inning => inning.inning === targetInning - 1);
      
      if (targetInningIndex === -1 || sourceInningIndex === -1) return currentLineup;
      
      // Create a new innings array
      const newInnings = [...currentLineup.innings];
      
      // Copy positions from source to target
      newInnings[targetInningIndex] = {
        ...newInnings[targetInningIndex],
        positions: [...newInnings[sourceInningIndex].positions]
      };
      
      // Return updated lineup
      return {
        ...currentLineup,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  }, []);
  
  // Swap two positions within the same inning
  const swapPlayerPositions = useCallback((
    inningNumber: number,
    position1: Position,
    position2: Position
  ) => {
    setLineup(currentLineup => {
      // Find the inning
      const inningIndex = currentLineup.innings.findIndex(inning => inning.inning === inningNumber);
      
      if (inningIndex === -1) return currentLineup;
      
      // Get the inning
      const inning = currentLineup.innings[inningIndex];
      
      // Find positions
      const pos1Index = inning.positions.findIndex(pos => pos.position === position1);
      const pos2Index = inning.positions.findIndex(pos => pos.position === position2);
      
      if (pos1Index === -1 || pos2Index === -1) return currentLineup;
      
      // Get player IDs
      const player1Id = inning.positions[pos1Index].playerId;
      const player2Id = inning.positions[pos2Index].playerId;
      
      // Create new positions array
      const newPositions = [...inning.positions];
      
      // Swap players
      newPositions[pos1Index] = { position: position1, playerId: player2Id };
      newPositions[pos2Index] = { position: position2, playerId: player1Id };
      
      // Create new innings array
      const newInnings = [...currentLineup.innings];
      
      // Update the inning
      newInnings[inningIndex] = {
        ...inning,
        positions: newPositions
      };
      
      // Return updated lineup
      return {
        ...currentLineup,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  }, []);
  
  // Swap two players across any position/inning
  const swapPlayers = useCallback((
    inning1: number,
    position1: Position,
    inning2: number,
    position2: Position
  ) => {
    setLineup(currentLineup => {
      // Find innings
      const inning1Index = currentLineup.innings.findIndex(inning => inning.inning === inning1);
      const inning2Index = currentLineup.innings.findIndex(inning => inning.inning === inning2);
      
      if (inning1Index === -1 || inning2Index === -1) return currentLineup;
      
      // Get innings
      const inning1Data = currentLineup.innings[inning1Index];
      const inning2Data = currentLineup.innings[inning2Index];
      
      // Find positions
      const pos1Index = inning1Data.positions.findIndex(pos => pos.position === position1);
      const pos2Index = inning2Data.positions.findIndex(pos => pos.position === position2);
      
      if (pos1Index === -1 || pos2Index === -1) return currentLineup;
      
      // Get player IDs
      const player1Id = inning1Data.positions[pos1Index].playerId;
      const player2Id = inning2Data.positions[pos2Index].playerId;
      
      // Create new innings array
      const newInnings = [...currentLineup.innings];
      
      // Create new positions arrays
      const newPositions1 = [...inning1Data.positions];
      const newPositions2 = [...inning2Data.positions];
      
      // Swap players
      newPositions1[pos1Index] = { position: position1, playerId: player2Id };
      newPositions2[pos2Index] = { position: position2, playerId: player1Id };
      
      // Update innings
      newInnings[inning1Index] = {
        ...inning1Data,
        positions: newPositions1
      };
      
      newInnings[inning2Index] = {
        ...inning2Data,
        positions: newPositions2
      };
      
      // Return updated lineup
      return {
        ...currentLineup,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  }, []);
  
  // Set lineup name (for non-game lineups)
  const setLineupName = useCallback((name: string) => {
    setLineup(currentLineup => ({
      ...currentLineup,
      name,
      updatedAt: Date.now()
    }));
  }, []);
  
  // Set lineup type (for non-game lineups)
  const setLineupType = useCallback((type: 'competitive' | 'developmental') => {
    setLineup(currentLineup => ({
      ...currentLineup,
      type,
      updatedAt: Date.now()
    }));
  }, []);
  
  // Validate lineup and get fair play issues
  const validateLineup = useCallback((): string[] => {
    const issues = getFairPlayIssues(lineup, players);
    setFairPlayIssues(issues);
    return issues;
  }, [lineup, players]);
  
  // Save lineup
  const saveLineup = useCallback(async (): Promise<Lineup | null> => {
    // Ensure the lineup has an ID
    const lineupToSave: Lineup = {
      ...lineup,
      id: lineup.id || uuidv4(),
      updatedAt: Date.now()
    };
    
    try {
      let savedLineup: Lineup | null = null;
      
      // Save lineup to API
      try {
        console.log(`Attempting to save lineup to API with ID: ${lineupToSave.id}, name: ${lineupToSave.name}, teamId: ${lineupToSave.teamId}`);
        
        let apiUrl;
        let method;
        
        // If this is a game-specific lineup, use the game lineup API
        if (lineupToSave.gameId) {
          apiUrl = `/api/games/${lineupToSave.gameId}/lineup`;
          method = lineupToSave.id ? 'PUT' : 'POST';
          console.log(`Using game-specific lineup API: ${apiUrl} with method ${method}`);
        } else {
          // For non-game lineups, use the direct non-game API
          apiUrl = `/api/lineups/non-game`;
          method = lineupToSave.id ? 'PUT' : 'POST';
          console.log(`Using direct non-game lineup API: ${apiUrl} with method ${method}`);
        }
        
        console.log(`Sending request to ${apiUrl} with method ${method}`);
        console.log(`Request payload: ${JSON.stringify({ lineup: lineupToSave }, null, 2)}`);
        
        const response = await fetch(apiUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lineup: lineupToSave }),
          credentials: 'include' // Ensure cookies are sent with the request
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.lineup) {
            console.log('Saved lineup to API successfully');
            
            // Update local state
            setLineup(data.lineup);
            savedLineup = data.lineup;
          } else {
            console.warn('API response was OK but data.success was false or data.lineup was missing', data);
          }
        } else {
          console.warn(`API returned status ${response.status} when saving lineup`);
          // Try to get more detailed error information
          try {
            const errorData = await response.json();
            console.warn('Error details:', errorData);
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
        }
      } catch (apiError) {
        console.error('Failed to save lineup to API:', apiError);
        return null;
      }
      
      // If the lineup was saved and it's a game lineup, trigger position history update
      // Note: We don't directly update position history from the client
      // Position history is updated server-side when saving the lineup through the API
      if (savedLineup && savedLineup.gameId) {
        try {
          // The API route that saved the lineup will handle position history updates
          console.log('Position history will be updated server-side for game lineup');
          
          // We could also call a dedicated API endpoint to update position history if needed
          // but this is typically handled by the server when saving the lineup
        } catch (positionHistoryError) {
          console.error('Error with position history:', positionHistoryError);
          // Don't fail the overall save if position history has issues
        }
      }
      
      return savedLineup;
    } catch (error) {
      console.error('Error saving lineup:', error);
    }
    
    return null;
  }, [lineup]);
  
  return {
    lineup,
    assignPlayerToPosition,
    copyFromPreviousInning,
    swapPlayerPositions,
    swapPlayers,
    setLineupName,
    setLineupType,
    validateLineup,
    saveLineup,
    fairPlayIssues
  };
};

/**
 * Hook for managing field-position lineups (non-game specific)
 */
export const useFieldPositionLineups = (teamId: string) => {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load lineups from MongoDB via API
  const loadLineups = useCallback(async () => {
    if (!teamId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to load from API using the dedicated non-game lineups endpoint
      try {
        console.log(`Fetching non-game lineups for team ${teamId} using dedicated API endpoint`);
        const response = await fetch(`/api/lineups/non-game?teamId=${teamId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.lineups)) {
            console.log(`Loaded ${data.lineups.length} non-game lineups from dedicated API endpoint`);
            setLineups(data.lineups);
            setIsLoading(false);
            return;
          } else {
            console.warn('API response was OK but data format was unexpected:', data);
          }
        } else {
          console.warn(`API returned status ${response.status} when loading non-game lineups`);
          try {
            const errorData = await response.json();
            console.warn('Error details:', errorData);
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
        }
      } catch (apiError) {
        console.error('Failed to load non-game lineups from dedicated API, will try legacy endpoint:', apiError);
      }
      
      // Try the legacy endpoint as a fallback
      try {
        console.log(`Trying legacy API endpoint for non-game lineups: /api/teams/${teamId}/lineups?type=non-game`);
        const response = await fetch(`/api/teams/${teamId}/lineups?type=non-game`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.lineups)) {
            console.log(`Loaded ${data.lineups.length} lineups from legacy API endpoint`);
            setLineups(data.lineups);
            setIsLoading(false);
            return;
          } else {
            console.warn('Legacy API response was OK but data format was unexpected:', data);
          }
        } else {
          console.warn(`Legacy API endpoint returned status ${response.status} when loading lineups`);
        }
      } catch (legacyApiError) {
        console.error('Failed to load lineups from legacy API endpoint:', legacyApiError);
        setError('Failed to load lineups. Please check your network connection and try again.');
      }
    } catch (err) {
      setError(`Failed to load lineups: ${String(err)}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);
  
  // Set a lineup as the default using MongoDB via API
  const setDefaultLineup = useCallback(async (lineupId: string): Promise<boolean> => {
    if (!teamId) return false;
    
    try {
      // First try to set default via the dedicated non-game API
      try {
        console.log(`Setting default lineup using dedicated non-game API: ${lineupId} for team ${teamId}`);
        const response = await fetch(`/api/lineups/non-game/default`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineupId, teamId })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            console.log('Set default lineup via dedicated non-game API successfully');
            
            // Update local state
            setLineups(currentLineups => 
              currentLineups.map(lineup => ({
                ...lineup,
                isDefault: lineup.id === lineupId
              }))
            );
            
            return true;
          }
        } else {
          console.warn(`Dedicated API returned status ${response.status} when setting default lineup`);
          try {
            const errorData = await response.json();
            console.warn('Error details:', errorData);
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
        }
      } catch (apiError) {
        console.error('Failed to set default lineup via dedicated API, will try legacy endpoint:', apiError);
      }
      
      // Try the legacy endpoint as a fallback
      try {
        console.log(`Trying legacy API endpoint for setting default lineup: /api/teams/${teamId}/lineups/default`);
        const response = await fetch(`/api/teams/${teamId}/lineups/default`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineupId })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            console.log('Set default lineup via legacy API successfully');
            
            // Update local state
            setLineups(currentLineups => 
              currentLineups.map(lineup => ({
                ...lineup,
                isDefault: lineup.id === lineupId
              }))
            );
            
            return true;
          }
        } else {
          console.warn(`Legacy API endpoint returned status ${response.status} when setting default lineup`);
        }
      } catch (legacyApiError) {
        console.error('Failed to set default lineup via legacy API:', legacyApiError);
      }
      
      return false;
    } catch (err) {
      console.error(`Failed to set default lineup: ${String(err)}`);
      return false;
    }
  }, [teamId]);
  
  // Delete a lineup using MongoDB via API
  const deleteLineup = useCallback(async (lineupId: string): Promise<boolean> => {
    try {
      // Delete via API
      try {
        const response = await fetch(`/api/lineups?id=${lineupId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            console.log('Deleted lineup via API successfully');
            
            // Update local state
            setLineups(currentLineups => 
              currentLineups.filter(lineup => lineup.id !== lineupId)
            );
            
            return true;
          }
        } else {
          console.warn(`API returned status ${response.status} when deleting lineup`);
          try {
            const errorData = await response.json();
            console.warn('Error details:', errorData);
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
        }
      } catch (apiError) {
        console.error('Failed to delete lineup via API:', apiError);
      }
      
      return false;
    } catch (err) {
      console.error(`Failed to delete lineup: ${String(err)}`);
      return false;
    }
  }, []);
  
  // Load lineups on mount and when teamId changes
  useEffect(() => {
    loadLineups();
  }, [loadLineups]);
  
  return {
    lineups,
    isLoading,
    error,
    loadLineups,
    setDefaultLineup,
    deleteLineup
  };
};

export default useLineup;