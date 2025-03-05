import { Position } from './player';

/**
 * Represents a player's position history across multiple games
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