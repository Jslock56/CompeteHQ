/**
 * Hook for managing game lineups
 * These are game-specific, multi-inning lineups
 */

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameLineup, LineupInning, PositionAssignment, FairPlayIssue, Position } from '../types/lineup';
import { Player } from '../types/player';
import storageAdapter from '../services/database/storage-adapter';

interface UseGameLineupProps {
  gameId: string;
  teamId: string;
  innings: number;
  players: Player[];
  initialLineup?: GameLineup;
}

export const useGameLineup = ({
  gameId,
  teamId,
  innings,
  players,
  initialLineup
}: UseGameLineupProps) => {
  // Initialize lineup state
  const [lineup, setLineup] = useState<GameLineup>(() => {
    if (initialLineup) {
      return initialLineup;
    }
    
    // Create a new game lineup with empty innings
    const newInnings: LineupInning[] = [];
    
    for (let i = 1; i <= innings; i++) {
      newInnings.push({
        inning: i,
        positions: []
      });
    }
    
    return {
      id: uuidv4(),
      gameId,
      teamId,
      innings: newInnings,
      status: 'draft',
      collectionType: 'gameLineups',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });
  
  // State for validation issues
  const [fairPlayIssues, setFairPlayIssues] = useState<FairPlayIssue[]>([]);
  
  /**
   * Initialize from a template lineup
   */
  const initFromTemplate = (templatePositions: PositionAssignment[]) => {
    setLineup(prev => {
      const newInnings = prev.innings.map(inning => {
        // For the first inning, use the template
        if (inning.inning === 1) {
          return {
            ...inning,
            positions: [...templatePositions]
          };
        }
        return inning;
      });
      
      return {
        ...prev,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  };
  
  /**
   * Assign a player to a position for a specific inning
   */
  const assignPlayerToPosition = (inning: number, position: Position, playerId: string) => {
    setLineup(prev => {
      // Create a copy of the innings array
      const newInnings = [...prev.innings];
      
      // Find the inning
      const inningIndex = newInnings.findIndex(i => i.inning === inning);
      
      if (inningIndex >= 0) {
        // Create a copy of the positions for this inning
        const positions = [...newInnings[inningIndex].positions];
        
        // Find the existing assignment for this position
        const existingIndex = positions.findIndex(p => p.position === position);
        
        if (existingIndex >= 0) {
          // Update existing assignment
          positions[existingIndex] = { ...positions[existingIndex], playerId };
        } else {
          // Add new assignment
          positions.push({ position, playerId });
        }
        
        // Update the inning with the new positions
        newInnings[inningIndex] = {
          ...newInnings[inningIndex],
          positions
        };
      }
      
      return {
        ...prev,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  };
  
  /**
   * Copy positions from one inning to another
   */
  const copyInning = (fromInning: number, toInning: number) => {
    setLineup(prev => {
      // Find the source inning
      const sourceInning = prev.innings.find(i => i.inning === fromInning);
      
      if (!sourceInning) {
        return prev;
      }
      
      // Create a copy of the innings array
      const newInnings = prev.innings.map(inning => {
        if (inning.inning === toInning) {
          return {
            ...inning,
            positions: [...sourceInning.positions]
          };
        }
        return inning;
      });
      
      return {
        ...prev,
        innings: newInnings,
        updatedAt: Date.now()
      };
    });
  };
  
  /**
   * Save the lineup
   */
  const saveLineup = async (): Promise<GameLineup> => {
    try {
      // Ensure it has the collection type for database organization
      const lineupToSave: GameLineup = {
        ...lineup,
        collectionType: 'gameLineups',
        updatedAt: Date.now()
      };
      
      // Save to storage
      const success = await storageAdapter.saveLineup(lineupToSave as any);
      
      if (!success) {
        throw new Error('Failed to save lineup');
      }
      
      return lineupToSave;
    } catch (error) {
      console.error('Error saving lineup:', error);
      throw error;
    }
  };
  
  /**
   * Validate the lineup for fair play issues
   */
  const validateLineup = (): FairPlayIssue[] => {
    const issues: FairPlayIssue[] = [];
    
    // Check if all positions are filled for each inning
    const requiredPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    
    for (const inning of lineup.innings) {
      for (const pos of requiredPositions) {
        const assignment = inning.positions.find(p => p.position === pos);
        
        if (!assignment || !assignment.playerId) {
          issues.push({
            type: 'incomplete',
            description: `Inning ${inning.inning}: Position ${pos} is not assigned`,
            innings: [inning.inning],
            severity: 'warning'
          });
        }
      }
    }
    
    // Validate fair play rules
    // (For now, this is a simplified version - the real implementation would be more complex)
    
    // Track how many innings each player is on the bench
    const benchCounts: Record<string, number> = {};
    
    // Initialize bench counts for all players
    players.forEach(player => {
      benchCounts[player.id] = 0;
    });
    
    // Count bench innings
    for (const inning of lineup.innings) {
      // Find players who are not in this inning
      const playersInInning = new Set(
        inning.positions
          .filter(p => p.position !== 'BN')
          .map(p => p.playerId)
      );
      
      players.forEach(player => {
        if (!playersInInning.has(player.id)) {
          benchCounts[player.id] = (benchCounts[player.id] || 0) + 1;
        }
      });
    }
    
    // Check for bench time fairness
    const activePlayerCount = players.filter(p => p.active).length;
    const maxBenchDiff = Math.ceil(innings / activePlayerCount) + 1;
    
    const benchValues = Object.values(benchCounts).filter(v => v > 0);
    const minBench = Math.min(...benchValues);
    const maxBench = Math.max(...benchValues);
    
    if (maxBench - minBench > maxBenchDiff) {
      // Find players with too much bench time
      const playersWithTooMuchBench = Object.entries(benchCounts)
        .filter(([_, count]) => count === maxBench)
        .map(([playerId]) => playerId);
      
      for (const playerId of playersWithTooMuchBench) {
        const player = players.find(p => p.id === playerId);
        
        issues.push({
          type: 'bench',
          playerId,
          description: `${player?.firstName || 'Player'} is benched too often (${maxBench} innings vs. min ${minBench})`,
          severity: 'error'
        });
      }
    }
    
    setFairPlayIssues(issues);
    return issues;
  };
  
  return {
    lineup,
    assignPlayerToPosition,
    initFromTemplate,
    copyInning,
    validateLineup,
    saveLineup,
    fairPlayIssues
  };
};

export default useGameLineup;