/**
 * Types for lineup management
 */

/**
 * Available baseball positions
 */
export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'BN';

/**
 * Lineup data structure
 */
export interface Lineup {
  /**
   * Unique identifier
   */
  id: string;
  
  /**
   * Associated game ID
   */
  gameId: string;
  
  /**
   * Team ID
   */
  teamId: string;
  
  /**
   * Inning-by-inning lineup data
   */
  innings: LineupInning[];
  
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
      position: Position | 'BN';
    }[];
  }[];
}