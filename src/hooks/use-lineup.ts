/**
 * Custom hook for lineup management
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Lineup, LineupInning, Position, PositionAssignment } from '../types/lineup';
import { Player } from '../types/player';
import { storageService } from '../services/storage/enhanced-storage';
import { 
  createDefaultLineup, // Changed from createEmptyLineup
  getFairPlayIssues, // Changed from checkLineupFairPlay
  copyInningPositions 
} from '../utils/lineup-utils';

interface UseLineupProps {
  /**
   * Game ID for this lineup
   */
  gameId: string;
  
  /**
   * Team ID
   */
  teamId: string;
  
  /**
   * Number of innings in the game
   */
  innings: number;
  
  /**
   * Initial lineup data (for editing)
   */
  initialLineup?: Lineup;
  
  /**
   * Available players for the team
   */
  players: Player[];
}

interface UseLineupResult {
  /**
   * Current lineup data
   */
  lineup: Lineup;
  
  /**
   * Currently selected inning (1-based)
   */
  currentInning: number;
  
  /**
   * Set the current inning
   */
  setCurrentInning: (inning: number) => void;
  
  /**
   * Assign a player to a position
   */
  assignPlayerToPosition: (inning: number, position: Position, playerId: string) => void;
  
  /**
   * Copy positions from the previous inning
   */
  copyFromPreviousInning: (targetInning: number) => void;
  
  /**
   * Validate the lineup and return any issues
   */
  validateLineup: () => string[];
  
  /**
   * Save the lineup
   */
  saveLineup: () => Promise<Lineup | null>;
  
  /**
   * Current fair play issues
   */
  fairPlayIssues: string[];
  
  /**
   * Whether the lineup has been modified
   */
  isModified: boolean;
}

/**
 * Custom hook for managing lineup state and operations
 */
export const useLineup = ({
  gameId,
  teamId,
  innings,
  initialLineup,
  players
}: UseLineupProps): UseLineupResult => {
  // Set up state
  const [lineup, setLineup] = useState<Lineup>(() => {
    // If initial lineup is provided, use it
    if (initialLineup) {
      return initialLineup;
    }
    
    // Otherwise, try to load from storage
    const existingLineup = storageService.lineup.getLineupByGame(gameId);
    if (existingLineup) {
      return existingLineup;
    }
    
    // If no lineup exists, create an empty one
    return createDefaultLineup(gameId, teamId, innings); // Changed from createEmptyLineup
  });
  
  // Track whether lineup has been modified
  const [isModified, setIsModified] = useState(false);
  
  // Track current inning (1-based)
  const [currentInning, setCurrentInning] = useState(1);
  
  // Track fair play issues
  const [fairPlayIssues, setFairPlayIssues] = useState<string[]>([]);
  
  // Function to update the lineup and mark as modified
  const updateLineup = useCallback((updatedLineup: Lineup) => {
    setLineup(updatedLineup);
    setIsModified(true);
  }, []);
  
  // Get the data for a specific inning
  const getInningData = useCallback((inningNumber: number): LineupInning => {
    // Find existing inning data
    const existingInning = lineup.innings.find(inning => inning.inning === inningNumber);
    
    // Return existing data or create new empty inning
    return existingInning || { inning: inningNumber, positions: [] };
  }, [lineup]);
  
  // Assign a player to a position in a specific inning
  const assignPlayerToPosition = useCallback((
    inningNumber: number,
    position: Position,
    playerId: string
  ) => {
    // Get the current inning data
    const inningData = getInningData(inningNumber);
    
    // Create updated positions array
    let updatedPositions: PositionAssignment[];
    
    // If playerId is empty, remove the position assignment
    if (playerId === '') {
      updatedPositions = inningData.positions.filter(p => p.position !== position);
    } else {
      // Check if position is already assigned
      const existingAssignment = inningData.positions.find(p => p.position === position);
      
      if (existingAssignment) {
        // Update existing assignment
        updatedPositions = inningData.positions.map(p =>
          p.position === position ? { position, playerId } : p
        );
      } else {
        // Add new assignment
        updatedPositions = [...inningData.positions, { position, playerId }];
      }
    }
    
    // Create updated inning data
    const updatedInning: LineupInning = {
      ...inningData,
      positions: updatedPositions
    };
    
    // Update lineup with new inning data
    const updatedInnings = lineup.innings
      .filter(inning => inning.inning !== inningNumber)
      .concat(updatedInning);
    
    // Sort innings by inning number
    updatedInnings.sort((a, b) => a.inning - b.inning);
    
    // Update lineup state
    updateLineup({
      ...lineup,
      innings: updatedInnings,
      updatedAt: Date.now()
    });
  }, [lineup, getInningData, updateLineup]);
  
  // Copy positions from previous inning
  const copyFromPreviousInning = useCallback((targetInning: number) => {
    if (targetInning <= 1) return; // Can't copy if there's no previous inning
    
    // Get previous inning data
    const previousInning = getInningData(targetInning - 1);
    
    // Create new inning data by copying positions
    const newInning = copyInningPositions(previousInning, targetInning);
    
    // Update lineup with new inning data
    const updatedInnings = lineup.innings
      .filter(inning => inning.inning !== targetInning)
      .concat(newInning);
    
    // Sort innings by inning number
    updatedInnings.sort((a, b) => a.inning - b.inning);
    
    // Update lineup state
    updateLineup({
      ...lineup,
      innings: updatedInnings,
      updatedAt: Date.now()
    });
  }, [lineup, getInningData, updateLineup]);
  
  // Validate the lineup
  const validateLineup = useCallback((): string[] => {
    // Run validation to check for fair play issues
    const issues = getFairPlayIssues(lineup, players); // Changed from checkLineupFairPlay
    
    // Update fair play issues state
    setFairPlayIssues(issues);
    
    return issues;
  }, [lineup, players]);
  
  // Save the lineup
  const saveLineup = useCallback(async (): Promise<Lineup | null> => {
    // Make sure lineup has an ID
    let lineupToSave = lineup;
    if (!lineupToSave.id) {
      lineupToSave = {
        ...lineup,
        id: uuidv4()
      };
    }
    
    // Update timestamps
    lineupToSave = {
      ...lineupToSave,
      updatedAt: Date.now()
    };
    
    // Save to storage
    const success = storageService.lineup.saveLineup(lineupToSave);
    
    if (!success) {
      throw new Error('Failed to save lineup');
    }
    
    // Update local state
    setLineup(lineupToSave);
    setIsModified(false);
    
    return lineupToSave;
  }, [lineup]);
  
  // Run validation whenever lineup changes
  useEffect(() => {
    validateLineup();
  }, [lineup, validateLineup]);
  
  return {
    lineup,
    currentInning,
    setCurrentInning,
    assignPlayerToPosition,
    copyFromPreviousInning,
    validateLineup,
    saveLineup,
    fairPlayIssues,
    isModified
  };
};

export default useLineup;