/**
 * Types for lineup management
 */

import { Position } from './shared-types';

/**
 * Base lineup properties shared by all lineup types
 */
export interface BaseLineup {
  /**
   * Unique identifier
   */
  id: string;
  
  /**
   * Team ID
   */
  teamId: string;
  
  /**
   * Lineup name
   */
  name?: string;
  
  /**
   * Lineup type
   */
  type?: 'standard' | 'competitive' | 'developmental';
  
  /**
   * Lineup status
   */
  status: 'draft' | 'final';
  
  /**
   * Creation timestamp
   */
  createdAt: number;
  
  /**
   * Last updated timestamp
   */
  updatedAt: number;
}

/**
 * Template lineup (single-inning, reusable)
 */
export interface TemplateLineup extends BaseLineup {
  /**
   * Whether this is the default template lineup for the team
   */
  isDefault?: boolean;
  
  /**
   * Position assignments (single inning representation)
   */
  positions: PositionAssignment[];
}

/**
 * Game-specific lineup (multi-inning)
 */
export interface GameLineup extends BaseLineup {
  /**
   * Associated game ID
   */
  gameId: string;
  
  /**
   * Inning-by-inning lineup data
   */
  innings: LineupInning[];
  
  /**
   * Storage collection type for database organization
   */
  collectionType?: 'gameLineups';
}

/**
 * Union type for backward compatibility
 */
export type Lineup = TemplateLineup | GameLineup;

/**
 * Type guard to check if a lineup is a game lineup
 */
export const isGameLineup = (lineup: Lineup): lineup is GameLineup => {
  return 'gameId' in lineup && 'innings' in lineup;
};

/**
 * Type guard to check if a lineup is a template lineup
 */
export const isTemplateLineup = (lineup: Lineup): lineup is TemplateLineup => {
  return !('gameId' in lineup) && 'positions' in lineup;
};

/**
 * Lineup data for a single inning
 */
export interface LineupInning {
  /**
   * Inning number (1-based)
   */
  inning: number;
  
  /**
   * Position assignments for this inning
   */
  positions: PositionAssignment[];
}

/**
 * Assignment of a player to a position
 */
export interface PositionAssignment {
  /**
   * Position code
   */
  position: Position;
  
  /**
   * ID of the assigned player
   */
  playerId: string;
}

/**
 * Fair play issue type
 */
export interface FairPlayIssue {
  /**
   * Type of issue
   */
  type: 'bench' | 'position' | 'infield' | 'outfield' | 'pitching' | 'incomplete';
  
  /**
   * Player ID associated with the issue
   */
  playerId?: string;
  
  /**
   * Description of the issue
   */
  description: string;
  
  /**
   * Innings affected
   */
  innings?: number[];
  
  /**
   * Severity level
   */
  severity: 'warning' | 'error';
}

/**
 * Position history derived from lineups
 */
export interface PlayerPositionHistory {
  /**
   * Player ID
   */
  playerId: string;
  
  /**
   * Team ID
   */
  teamId: string;
  
  /**
   * Total innings played per position
   */
  positionCounts: Record<Position, number>;
  
  /**
   * Total bench time (innings)
   */
  benchCount: number;
  
  /**
   * Total innings played
   */
  totalInnings: number;
  
  /**
   * Recent position assignments (most recent first)
   */
  recentPositions: {
    gameId: string;
    date: number;
    positions: {
      inning: number;
      position: Position;
    }[];
  }[];
}