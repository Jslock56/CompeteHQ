import { Position, Player } from '../types/player';
import { Game } from '../types/game';
import { Lineup, LineupInning, PositionAssignment } from '../types/lineup';
import { 
  PositionHistory, 
  GamePositions, 
  InningPosition,
  PositionSummary,
  FairPlayMetrics,
  GameWithPosition,
  PositionDistribution,
  PositionMetrics,
  TeamPositionDistribution 
} from '../types/position-history';
import { PositionType } from './position-utils';
import { 
  PositionTimelineEntry, 
  PositionTimeFrame, 
  PositionGridEntry, 
  PositionHeatmap,
  PositionBreakdown,
  TeamFairPlayMetrics 
} from '../types/position-metrics';

/**
 * Position tracking utility functions for advanced analytics
 */

/**
 * Calculates the fair play ratio for a player
 * Considers innings played vs bench time and position variety
 */
export const calculateFairPlayRatio = (
  playerId: string,
  positionMetrics: PositionMetrics
): number => {
  // Extract relevant metrics
  const playingTime = positionMetrics.playingTimePercentage;
  const varietyScore = positionMetrics.varietyScore;
  
  // Weight the scores (60% playing time, 40% variety)
  return (playingTime * 0.6) + (varietyScore * 0.4);
};

/**
 * Analyzes a player's position trends to identify player development areas
 */
export const getPlayerDevelopmentInsights = (
  player: Player,
  positionMetrics: PositionMetrics
): string[] => {
  const insights: string[] = [];
  
  // Check for low playing time
  if (positionMetrics.playingTimePercentage < 50) {
    insights.push(`Needs more playing time (currently ${positionMetrics.playingTimePercentage.toFixed(0)}%)`);
  }
  
  // Check for position variety
  if (positionMetrics.varietyScore < 40) {
    insights.push('Needs experience in more positions');
  }
  
  // Check for specific position type gaps
  const positionCounts = positionMetrics.allGames.positionCounts;
  const hasInfield = positionCounts['1B'] + positionCounts['2B'] + positionCounts['3B'] + positionCounts['SS'] > 0;
  const hasOutfield = positionCounts['LF'] + positionCounts['CF'] + positionCounts['RF'] > 0;
  
  if (!hasInfield && player.primaryPositions.some(p => ['P', 'C'].includes(p))) {
    insights.push('Needs infield experience');
  }
  
  if (!hasOutfield && hasInfield) {
    insights.push('Needs outfield experience');
  }
  
  return insights;
};

/**
 * Calculates position recommendation for upcoming games
 * Ensures fair play and player development
 */
export const getPositionRecommendations = (
  player: Player,
  positionMetrics: PositionMetrics
): Position[] => {
  const recommendations: Position[] = [];
  const playedPositions = Object.entries(positionMetrics.allGames.positionCounts)
    .filter(([_, count]) => count > 0)
    .map(([pos]) => pos as Position);
  
  // Add primary positions first if they're not overplayed
  player.primaryPositions.forEach(pos => {
    const playPercent = positionMetrics.allGames.positionPercentages[pos] || 0;
    if (playPercent < 30) {
      recommendations.push(pos);
    }
  });
  
  // Consider positions with low experience
  const allPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  allPositions.forEach(pos => {
    if (!playedPositions.includes(pos) && !recommendations.includes(pos)) {
      recommendations.push(pos);
    }
  });
  
  // If player has been on bench a lot, prioritize any position
  if (positionMetrics.allGames.positionPercentages['BN'] > 40) {
    if (recommendations.length === 0) {
      recommendations.push(...player.primaryPositions);
      recommendations.push(...player.secondaryPositions);
    }
  }
  
  return recommendations.length > 0 ? recommendations : player.primaryPositions;
};

/**
 * Analyzes position distribution within a team
 * Identifies inequalities in playing time or position assignments
 */
export const analyzeTeamPositionEquality = (
  teamPositionDistribution: TeamPositionDistribution
): {
  overplayedPlayers: string[];
  underplayedPlayers: string[];
  inequalityScore: number;
} => {
  const playerIds = Object.keys(teamPositionDistribution.playerDistributions);
  
  // Calculate average bench time
  const benchPercentages = playerIds.map(
    id => teamPositionDistribution.playerDistributions[id].positionPercentages['BN']
  );
  const avgBenchTime = benchPercentages.reduce((sum, pct) => sum + pct, 0) / benchPercentages.length;
  
  // Find overplayed/underplayed players
  const overplayedPlayers = playerIds.filter(
    id => teamPositionDistribution.playerDistributions[id].positionPercentages['BN'] < avgBenchTime - 15
  );
  
  const underplayedPlayers = playerIds.filter(
    id => teamPositionDistribution.playerDistributions[id].positionPercentages['BN'] > avgBenchTime + 15
  );
  
  // Inequality score is based on variance in bench time
  const inequalityScore = Math.min(100, teamPositionDistribution.benchTimeVariance * 2);
  
  return {
    overplayedPlayers,
    underplayedPlayers,
    inequalityScore
  };
};

/**
 * Generates position comparison data between two players
 */
export const comparePlayerPositions = (
  player1Metrics: PositionMetrics,
  player2Metrics: PositionMetrics
): {
  playingTimeDifference: number;
  varietyDifference: number;
  commonPositions: Position[];
  uniquePositions: {
    player1: Position[];
    player2: Position[];
  }
} => {
  // Calculate differences
  const playingTimeDifference = 
    player1Metrics.playingTimePercentage - player2Metrics.playingTimePercentage;
  
  const varietyDifference = 
    player1Metrics.varietyScore - player2Metrics.varietyScore;
  
  // Find common and unique positions
  const player1Positions = Object.entries(player1Metrics.allGames.positionCounts)
    .filter(([pos, count]) => count > 0 && pos !== 'BN')
    .map(([pos]) => pos as Position);
    
  const player2Positions = Object.entries(player2Metrics.allGames.positionCounts)
    .filter(([pos, count]) => count > 0 && pos !== 'BN')
    .map(([pos]) => pos as Position);
    
  const commonPositions = player1Positions.filter(pos => player2Positions.includes(pos));
  
  const uniqueToPlayer1 = player1Positions.filter(pos => !player2Positions.includes(pos));
  const uniqueToPlayer2 = player2Positions.filter(pos => !player1Positions.includes(pos));
  
  return {
    playingTimeDifference,
    varietyDifference,
    commonPositions,
    uniquePositions: {
      player1: uniqueToPlayer1,
      player2: uniqueToPlayer2
    }
  };
};

/**
 * Calculates optimal position rotation for upcoming games
 * to improve fair play metrics
 */
export const calculateOptimalRotation = (
  players: Player[],
  playerMetrics: Record<string, PositionMetrics>,
  numGames: number = 3,
  inningsPerGame: number = 6
): Record<string, Position[][]> => {
  const rotation: Record<string, Position[][]> = {};
  
  // Initialize with empty arrays
  players.forEach(player => {
    rotation[player.id] = Array(numGames).fill(null).map(() => Array(inningsPerGame).fill(null));
  });
  
  // Analyze each player's needs
  players.forEach(player => {
    const metrics = playerMetrics[player.id];
    if (!metrics) return;
    
    // Get positions that need more play time
    const underrepresentedPositions = Object.entries(metrics.allGames.positionPercentages)
      .filter(([pos, percent]) => pos !== 'BN' && percent < 10)
      .map(([pos]) => pos as Position);
    
    // Fill rotation with primary positions and underrepresented positions
    for (let gameIdx = 0; gameIdx < numGames; gameIdx++) {
      for (let inningIdx = 0; inningIdx < inningsPerGame; inningIdx++) {
        // Alternate between primary and needed positions
        if ((gameIdx + inningIdx) % 3 === 0 && player.primaryPositions.length > 0) {
          rotation[player.id][gameIdx][inningIdx] = player.primaryPositions[0];
        } else if (underrepresentedPositions.length > 0) {
          const posIndex = (gameIdx + inningIdx) % underrepresentedPositions.length;
          rotation[player.id][gameIdx][inningIdx] = underrepresentedPositions[posIndex];
        } else if (player.secondaryPositions.length > 0) {
          const posIndex = (gameIdx + inningIdx) % player.secondaryPositions.length;
          rotation[player.id][gameIdx][inningIdx] = player.secondaryPositions[posIndex];
        } else {
          // Default to bench if no position is specified
          rotation[player.id][gameIdx][inningIdx] = 'BN';
        }
      }
    }
  });
  
  return rotation;
};