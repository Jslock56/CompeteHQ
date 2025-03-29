/**
 * Custom hook for lineup management
 * Provides methods for creating, reading, updating lineups
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storage/enhanced-storage';
import { Lineup, LineupInning, Position, PositionAssignment } from '../types/lineup';
import { Player } from '../types/player';
import { createDefaultLineup, createFieldPositionLineup, getFairPlayIssues } from '../utils/lineup-utils';

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
    
    // Try to load from storage if for a game
    if (gameId) {
      const existingLineup = storageService.lineup.getLineupByGame(gameId);
      if (existingLineup) return existingLineup;
    }
    
    // Create new lineup 
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
      // First try to save to API
      try {
        console.log(`Attempting to save lineup to API with ID: ${lineupToSave.id}, name: ${lineupToSave.name}, teamId: ${lineupToSave.teamId}`);
        console.log(`Using ${lineupToSave.id ? 'PUT' : 'POST'} method for lineup`);
        
        const response = await fetch('/api/lineups', {
          method: lineupToSave.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lineupToSave),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.lineup) {
            console.log('Saved lineup to API successfully');
            
            // Also save to local storage for offline access
            storageService.lineup.saveLineup(data.lineup);
            
            // Update local state
            setLineup(data.lineup);
            return data.lineup;
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
        console.error('Failed to save lineup to API, falling back to local storage:', apiError);
      }
      
      // Fall back to local storage if API fails
      console.log('Saving lineup to local storage');
      const success = storageService.lineup.saveLineup(lineupToSave);
      
      if (success) {
        // Update local state
        setLineup(lineupToSave);
        return lineupToSave;
      } else {
        console.error('Failed to save lineup to local storage');
      }
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
  
  // Load lineups
  const loadLineups = useCallback(async () => {
    if (!teamId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to load from API
      try {
        const response = await fetch(`/api/teams/${teamId}/lineups?type=non-game`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.lineups)) {
            console.log(`Loaded ${data.lineups.length} lineups from API`);
            setLineups(data.lineups);
            
            // Update local storage with the API data for offline access
            data.lineups.forEach((lineup: Lineup) => {
              storageService.lineup.saveLineup(lineup);
            });
            
            setIsLoading(false);
            return;
          }
        } else {
          console.warn(`API returned status ${response.status} when loading lineups`);
        }
      } catch (apiError) {
        console.error('Failed to load lineups from API, falling back to local storage:', apiError);
      }
      
      // Fall back to local storage if API fails
      console.log('Loading lineups from local storage');
      const teamLineups = storageService.lineup.getNonGameLineupsByTeam(teamId);
      setLineups(teamLineups);
    } catch (err) {
      setError(`Failed to load lineups: ${String(err)}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);
  
  // Set a lineup as the default
  const setDefaultLineup = useCallback(async (lineupId: string): Promise<boolean> => {
    if (!teamId) return false;
    
    try {
      // First try to set default via API
      try {
        const response = await fetch(`/api/teams/${teamId}/lineups/default`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineupId })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            console.log('Set default lineup via API successfully');
            
            // Also update local storage
            await storageService.lineup.setDefaultTeamLineup(lineupId, teamId);
            
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
          console.warn(`API returned status ${response.status} when setting default lineup`);
        }
      } catch (apiError) {
        console.error('Failed to set default lineup via API, falling back to local storage:', apiError);
      }
      
      // Fall back to local storage
      console.log('Setting default lineup in local storage');
      const success = await storageService.lineup.setDefaultTeamLineup(lineupId, teamId);
      
      if (success) {
        // Update local state
        setLineups(currentLineups => 
          currentLineups.map(lineup => ({
            ...lineup,
            isDefault: lineup.id === lineupId
          }))
        );
      }
      
      return success;
    } catch (err) {
      console.error(`Failed to set default lineup: ${String(err)}`);
      return false;
    }
  }, [teamId]);
  
  // Delete a lineup
  const deleteLineup = useCallback(async (lineupId: string): Promise<boolean> => {
    try {
      // First try to delete via API
      try {
        const response = await fetch(`/api/lineups?id=${lineupId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            console.log('Deleted lineup via API successfully');
            
            // Also delete from local storage
            await storageService.lineup.deleteLineup(lineupId);
            
            // Update local state
            setLineups(currentLineups => 
              currentLineups.filter(lineup => lineup.id !== lineupId)
            );
            
            return true;
          }
        } else {
          console.warn(`API returned status ${response.status} when deleting lineup`);
        }
      } catch (apiError) {
        console.error('Failed to delete lineup via API, falling back to local storage:', apiError);
      }
      
      // Fall back to local storage
      console.log('Deleting lineup from local storage');
      const success = await storageService.lineup.deleteLineup(lineupId);
      
      if (success) {
        // Update local state
        setLineups(currentLineups => 
          currentLineups.filter(lineup => lineup.id !== lineupId)
        );
      }
      
      return success;
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