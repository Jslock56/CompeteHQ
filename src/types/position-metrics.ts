import { Position } from './player';
import { PositionType } from '../utils/position-utils';

/**
 * Interface for visualizing a player's position data over time
 */
export interface PositionTimelineEntry {
  /**
   * Game date timestamp
   */
  gameDate: number;
  
  /**
   * Opponent team name
   */
  opponent: string;
  
  /**
   * Position played in each inning
   */
  positions: Position[];
  
  /**
   * First position played in the game
   */
  startingPosition: Position;
}

/**
 * Interface for position data aggregated by time frame
 */
export interface PositionTimeFrame {
  /**
   * Number of innings at each position
   */
  positionCounts: Record<Position, number>;
  
  /**
   * Percentage of innings at each position
   */
  positionPercentages: Record<Position, number>;
  
  /**
   * Number of innings by position type
   */
  positionTypeCounts: Record<PositionType, number>;
  
  /**
   * Percentage of innings by position type
   */
  positionTypePercentages: Record<PositionType, number>;
  
  /**
   * Total innings played in this time frame
   */
  totalInnings: number;
  
  /**
   * Number of games in this time frame
   */
  gameCount: number;
}

/**
 * Interface for displaying position breakdowns in the UI
 */
export interface PositionBreakdown {
  /**
   * Last 1 game position data
   */
  lastGame: PositionTimeFrame | null;
  
  /**
   * Last 3 games position data
   */
  last3Games: PositionTimeFrame | null;
  
  /**
   * Last 5 games position data
   */
  last5Games: PositionTimeFrame | null;
  
  /**
   * Last 10 games position data
   */
  last10Games: PositionTimeFrame | null;
  
  /**
   * Season-to-date position data
   */
  season: PositionTimeFrame;
  
  /**
   * Position timeline for visualization
   */
  timeline: PositionTimelineEntry[];
  
  /**
   * Date of last bench start
   */
  lastBenchStart: number | null;
  
  /**
   * Current streak of innings on bench
   */
  benchStreakCurrent: number;
  
  /**
   * Maximum streak of innings on bench
   */
  benchStreakMax: number;
}

/**
 * Interface for team-level fair play metrics
 */
export interface TeamFairPlayMetrics {
  /**
   * Overall fair play score (0-100)
   */
  fairPlayScore: number;
  
  /**
   * Players with most bench time
   */
  mostBenchTime: Array<{
    playerId: string;
    benchPercentage: number;
  }>;
  
  /**
   * Players with least position variety
   */
  leastVariety: Array<{
    playerId: string;
    varietyScore: number;
  }>;
  
  /**
   * Players needing specific position experience
   */
  needsExperience: Array<{
    playerId: string;
    positionTypes: PositionType[];
  }>;
  
  /**
   * Players with playing time imbalance
   */
  playingTimeImbalance: Array<{
    playerId: string;
    playingTimePercentage: number;
    avgTeamPlayingTime: number;
    difference: number;
  }>;
}

/**
 * Interface for position grid view displaying positions across games
 */
export interface PositionGridEntry {
  /**
   * Game date timestamp
   */
  gameDate: number;
  
  /**
   * Opponent team name
   */
  opponent: string;
  
  /**
   * Positions by inning number
   */
  innings: Array<{
    inning: number;
    position: Position;
  }>;
}

/**
 * Interface for position heatmap data
 */
export interface PositionHeatmap {
  /**
   * Position labels
   */
  positions: Position[];
  
  /**
   * Game labels (dates or opponents)
   */
  games: string[];
  
  /**
   * Matrix of values representing frequency or count
   * [game][position]
   */
  values: number[][];
}