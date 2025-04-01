/**
 * Hook for managing template lineups
 * These are reusable, single-inning lineup templates
 */

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TemplateLineup, PositionAssignment, FairPlayIssue, Position } from '../types/lineup';
import { Player } from '../types/player';
import storageAdapter from '../services/database/storage-adapter';

interface UseTemplateLineupProps {
  teamId: string;
  players: Player[];
  initialLineup?: TemplateLineup;
  name?: string;
  type?: 'standard' | 'competitive' | 'developmental';
}

export const useTemplateLineup = ({
  teamId,
  players,
  initialLineup,
  name = 'New Lineup',
  type = 'standard'
}: UseTemplateLineupProps) => {
  // Initialize lineup state
  const [lineup, setLineup] = useState<TemplateLineup>(() => {
    if (initialLineup) {
      return initialLineup;
    }
    
    // Create a new template lineup
    return {
      id: uuidv4(),
      teamId,
      name,
      type,
      positions: [],
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });
  
  // State for validation issues
  const [fairPlayIssues, setFairPlayIssues] = useState<FairPlayIssue[]>([]);
  
  /**
   * Assign a player to a position
   */
  const assignPlayerToPosition = (position: Position, playerId: string) => {
    setLineup(prev => {
      // Create a copy of the positions array
      const positions = [...prev.positions];
      
      // Find the existing assignment for this position
      const existingIndex = positions.findIndex(p => p.position === position);
      
      if (existingIndex >= 0) {
        // Update existing assignment
        positions[existingIndex] = { ...positions[existingIndex], playerId };
      } else {
        // Add new assignment
        positions.push({ position, playerId });
      }
      
      return {
        ...prev,
        positions,
        updatedAt: Date.now()
      };
    });
  };
  
  /**
   * Set the lineup name
   */
  const setLineupName = (name: string) => {
    setLineup(prev => ({
      ...prev,
      name,
      updatedAt: Date.now()
    }));
  };
  
  /**
   * Set the lineup type
   */
  const setLineupType = (type: 'standard' | 'competitive' | 'developmental') => {
    setLineup(prev => ({
      ...prev,
      type,
      updatedAt: Date.now()
    }));
  };
  
  /**
   * Set lineup as the default for the team
   */
  const setAsDefault = (isDefault: boolean) => {
    setLineup(prev => ({
      ...prev,
      isDefault,
      updatedAt: Date.now()
    }));
  };
  
  /**
   * Save the lineup
   */
  const saveLineup = async (): Promise<TemplateLineup> => {
    try {
      // Save to storage
      const success = await storageAdapter.saveLineup(lineup as any);
      
      if (!success) {
        throw new Error('Failed to save lineup');
      }
      
      // If this is set as default, update that as well
      if (lineup.isDefault) {
        await storageAdapter.setDefaultTeamLineup(lineup.id, teamId);
      }
      
      return lineup;
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
    
    // Simple validation for template lineups
    // Check if all positions are filled
    const requiredPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    
    for (const pos of requiredPositions) {
      const assignment = lineup.positions.find(p => p.position === pos);
      
      if (!assignment || !assignment.playerId) {
        issues.push({
          type: 'incomplete',
          description: `Position ${pos} is not assigned`,
          severity: 'warning'
        });
      }
    }
    
    // Check for duplicate player assignments
    const playerAssignments = new Map<string, Position[]>();
    
    for (const { position, playerId } of lineup.positions) {
      if (!playerId) continue;
      
      const positions = playerAssignments.get(playerId) || [];
      positions.push(position);
      playerAssignments.set(playerId, positions);
    }
    
    for (const [playerId, positions] of playerAssignments.entries()) {
      if (positions.length > 1) {
        const player = players.find(p => p.id === playerId);
        issues.push({
          type: 'position',
          playerId,
          description: `${player?.firstName || 'Player'} is assigned to multiple positions: ${positions.join(', ')}`,
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
    setLineupName,
    setLineupType,
    setAsDefault,
    validateLineup,
    saveLineup,
    fairPlayIssues
  };
};

export default useTemplateLineup;