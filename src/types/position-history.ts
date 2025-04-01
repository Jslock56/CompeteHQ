import { Position } from './player';
import { PositionType } from '../utils/position-utils';

/**
 * Represents a player's position history across multiple games
 * LEGACY: Kept for backward compatibility during transition
 */
export interface PositionHistory {
  id: string;
  playerId: string;
  teamId: string;
  gamePositions: GamePositions[];
  updatedAt: number; // timestamp
}

/**
 * Represents a player's positions for a specific game
 * LEGACY: Kept for backward compatibility during transition
 */
export interface GamePositions {
  gameId: string;
  gameDate: number; // timestamp
  innings: InningPosition[];
}

/**
 * Represents a player's position in a specific inning
 */
export interface InningPosition {
  inning: number;
  position: Position;
}

/**
 * Summary statistics for a player's position history
 */
export interface PositionSummary {
  playerId: string;
  totalInnings: number;
  positionCounts: Record<Position, number>;
  recentPositions: InningPosition[]; // Last 5 positions played
  mostPlayedPosition: Position;
  leastPlayedPosition: Position;
  needsExperience: Position[]; // Positions with less than threshold % of innings
}

/**
 * Represents fair play metrics derived from position history
 */
export interface FairPlayMetrics {
  playerId: string;
  playingTimePercentage: number; // % of total innings played
  positionVarietyScore: number; // 0-100 score based on position distribution
  inningGapMax: number; // Maximum number of consecutive innings not played
  defensiveInningsPercentage: number; // % of innings in defensive positions (not bench)
  primaryPositionPercentage: number; // % of innings at primary position
  desirabilityScore: number; // Score based on playing desirable positions
  fairPlayScore: number; // Overall fair play score (0-100)
}

/**
 * Parameters for calculating fair play metrics
 */
export interface FairPlayParameters {
  positionDesirability: Record<Position, number>; // 1-10 score for each position (10 = most desirable)
  varietyThreshold: number; // Minimum % of innings at each position to avoid "needs experience" flag
  idealPrimaryPositionPercentage: number; // Target % for time at primary position
  benchWeighting: number; // How heavily to weigh bench time in fair play calculations
  recentGamesWeighting: number; // Higher weight given to recent games (0-1)
}

/**
 * Position data for a specific game with details for visualization
 */
export interface GameWithPosition {
  gameId: string;
  gameDate: number;
  opponent: string;
  startingPosition: Position;
  inningPositions: InningPosition[];
}

/**
 * Interface for position distribution statistics
 */
export interface PositionDistribution {
  playerId: string;
  gameCount: number;
  totalInnings: number;
  startingPositionCounts: Record<Position, number>;
  positionCounts: Record<Position, number>;
  positionPercentages: Record<Position, number>;
  positionTypeCounts: Record<string, number>;
  positionTypePercentages: Record<string, number>;
  startedOnBench: number; // Number of games started on bench
  lastBenchStart?: GameWithPosition; // Last game where player started on bench
}

/**
 * Interface for pre-computed metrics at a specific time scale
 * Used in the reference-based position history system
 */
export interface TimeframePositionMetrics {
  // Position counts and percentages
  positionCounts: Record<Position, number>;
  positionPercentages: Record<Position, number>;
  
  // Position type counts and percentages
  positionTypeCounts: Record<PositionType, number>;
  positionTypePercentages: Record<PositionType, number>;
  
  // Fair play metrics
  benchPercentage: number;
  varietyScore: number;
  consecutiveBench: number;
  benchStreak: {
    current: number;
    max: number;
  };
  
  // Position needs
  needsInfield: boolean;
  needsOutfield: boolean;
  
  // Total stats
  totalInnings: number;
  gamesPlayed: number;
  
  // Additional metrics for fair play calculations
  playingTimePercentage: number;
  samePositionStreak?: {
    position: Position | null;
    count: number;
  };
}

/**
 * Legacy/full PositionMetrics interface
 * LEGACY: Kept for backward compatibility during transition
 */
export interface PositionMetrics {
  playerId: string;
  totalGames: number;
  totalInnings: number;
  // Metrics by time frame
  last1Game: PositionDistribution | null;
  last3Games: PositionDistribution | null;
  last5Games: PositionDistribution | null;
  last10Games: PositionDistribution | null;
  allGames: PositionDistribution;
  // Grid of innings played at each position for the last 10 games
  positionGrid: GameWithPosition[];
  // Fair play metrics
  benchStreakCurrent: number; // Current consecutive innings on bench
  benchStreakMax: number; // Max consecutive innings on bench
  samePositionStreakCurrent: Position | null; // Current streak of same position
  samePositionStreakMax: number; // Max innings at same position
  playingTimePercentage: number; // % of total innings played
  varietyScore: number; // 0-100 score for position variety
}

/**
 * NEW Reference-based player position history
 * Stores game references and pre-computed metrics at different time scales
 */
export interface PlayerPositionHistory {
  id: string;
  playerId: string;
  teamId: string;
  season: string;
  
  // Only store references to games, not position data itself
  gamesPlayed: string[]; // Array of gameIds
  
  // Pre-computed metrics that get updated after each game
  metrics: {
    season: TimeframePositionMetrics;
    last5Games: TimeframePositionMetrics; 
    last3Games: TimeframePositionMetrics;
    lastGame: TimeframePositionMetrics;
  };
  
  // Last updated timestamp
  updatedAt: number;
}

/**
 * Interface for a team-level position distribution
 */
export interface TeamPositionDistribution {
  teamId: string;
  gameCount: number;
  playerDistributions: Record<string, PositionDistribution>;
  // Metrics about how balanced the playing time is across the team
  benchTimeVariance: number; // Statistical variance of bench time
  positionVarietyVariance: number; // Variance of position variety scores
  fairPlayScore: number; // 0-100 score for overall team fair play
  // Players who may need more attention
  mostBench: string[]; // Player IDs with most bench time
  leastVariety: string[]; // Player IDs with least position variety
  needsInfield: string[]; // Player IDs needing infield experience
  needsOutfield: string[]; // Player IDs needing outfield experience
}