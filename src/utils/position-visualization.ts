import { Position, Player } from '../types/player';
import { Game } from '../types/game';
import { Lineup } from '../types/lineup';
import { 
  PositionTimelineEntry, 
  PositionTimeFrame, 
  PositionGridEntry, 
  PositionHeatmap 
} from '../types/position-metrics';
import { 
  GameWithPosition, 
  getPositionDistribution, 
  getPositionType, 
  PositionType 
} from './position-utils';

/**
 * Generates timeline data for visualizing a player's position history
 */
export const generatePositionTimeline = (
  gamesWithPositions: GameWithPosition[]
): PositionTimelineEntry[] => {
  return gamesWithPositions.map(game => {
    const positions = game.inningPositions.map(inning => inning.position);
    
    return {
      gameDate: game.gameDate,
      opponent: game.opponent,
      positions,
      startingPosition: game.startingPosition
    };
  });
};

/**
 * Generates position breakdown data for different time frames
 */
export const generatePositionBreakdown = (
  playerId: string,
  gamesWithPositions: GameWithPosition[]
): {
  lastGame: PositionTimeFrame | null;
  last3Games: PositionTimeFrame | null;
  last5Games: PositionTimeFrame | null;
  last10Games: PositionTimeFrame | null;
  season: PositionTimeFrame;
} => {
  // Get distribution for each time frame
  const lastGameDist = gamesWithPositions.length >= 1 
    ? getPositionDistribution(playerId, gamesWithPositions, 1)
    : null;
    
  const last3GamesDist = gamesWithPositions.length >= 3 
    ? getPositionDistribution(playerId, gamesWithPositions, 3)
    : null;
    
  const last5GamesDist = gamesWithPositions.length >= 5 
    ? getPositionDistribution(playerId, gamesWithPositions, 5)
    : null;
    
  const last10GamesDist = gamesWithPositions.length >= 10 
    ? getPositionDistribution(playerId, gamesWithPositions, 10)
    : null;
    
  const seasonDist = getPositionDistribution(playerId, gamesWithPositions);
  
  // Convert distributions to time frames
  const lastGame = lastGameDist ? convertToTimeFrame(lastGameDist) : null;
  const last3Games = last3GamesDist ? convertToTimeFrame(last3GamesDist) : null;
  const last5Games = last5GamesDist ? convertToTimeFrame(last5GamesDist) : null;
  const last10Games = last10GamesDist ? convertToTimeFrame(last10GamesDist) : null;
  const season = convertToTimeFrame(seasonDist);
  
  return {
    lastGame,
    last3Games,
    last5Games,
    last10Games,
    season
  };
};

/**
 * Converts a position distribution to a time frame structure
 */
const convertToTimeFrame = (dist: any): PositionTimeFrame => {
  return {
    positionCounts: dist.positionCounts,
    positionPercentages: dist.positionPercentages,
    positionTypeCounts: dist.positionTypeCounts,
    positionTypePercentages: dist.positionTypePercentages,
    totalInnings: dist.totalInnings,
    gameCount: dist.gameCount
  };
};

/**
 * Generates data for a position grid view showing positions across games
 */
export const generatePositionGrid = (
  gamesWithPositions: GameWithPosition[]
): PositionGridEntry[] => {
  return gamesWithPositions.map(game => ({
    gameDate: game.gameDate,
    opponent: game.opponent,
    innings: game.inningPositions
  }));
};

/**
 * Generates heatmap data for visualizing position frequency
 */
export const generatePositionHeatmap = (
  gamesWithPositions: GameWithPosition[],
  usePercentages: boolean = false
): PositionHeatmap => {
  // Define positions to include (exclude bench for visualization)
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  
  // Get games sorted by date (oldest first for chronological view)
  const sortedGames = [...gamesWithPositions].sort((a, b) => a.gameDate - b.gameDate);
  
  // Format game labels (e.g., dates or opponent names)
  const games = sortedGames.map(game => {
    const date = new Date(game.gameDate);
    return `${date.getMonth() + 1}/${date.getDate()} ${game.opponent}`;
  });
  
  // Initialize matrix with zeros
  const values: number[][] = Array(sortedGames.length)
    .fill(null)
    .map(() => Array(positions.length).fill(0));
  
  // Fill matrix with position counts or percentages
  sortedGames.forEach((game, gameIndex) => {
    // Count positions in this game
    const gameCounts: Record<Position, number> = {} as Record<Position, number>;
    positions.forEach(pos => { gameCounts[pos] = 0; });
    
    // Count each position occurrence
    game.inningPositions.forEach(inning => {
      if (positions.includes(inning.position)) {
        gameCounts[inning.position]++;
      }
    });
    
    // Calculate total (non-bench) innings
    const totalInnings = Object.values(gameCounts).reduce((sum, count) => sum + count, 0);
    
    // Fill values
    positions.forEach((position, posIndex) => {
      if (usePercentages) {
        values[gameIndex][posIndex] = totalInnings > 0 
          ? (gameCounts[position] / totalInnings) * 100 
          : 0;
      } else {
        values[gameIndex][posIndex] = gameCounts[position];
      }
    });
  });
  
  return {
    positions,
    games,
    values
  };
};

/**
 * Generates data for a position type chart showing innings by position category
 */
export const generatePositionTypeChart = (
  gamesWithPositions: GameWithPosition[],
  gameCount?: number
): Record<PositionType, number> => {
  // Get subset of games if requested
  const games = gameCount 
    ? gamesWithPositions.slice(0, Math.min(gameCount, gamesWithPositions.length)) 
    : gamesWithPositions;
  
  // Initialize counts
  const counts: Record<PositionType, number> = {
    [PositionType.PITCHER]: 0,
    [PositionType.CATCHER]: 0,
    [PositionType.INFIELD]: 0,
    [PositionType.OUTFIELD]: 0,
    [PositionType.BENCH]: 0,
    [PositionType.DH]: 0
  };
  
  // Count positions by type
  games.forEach(game => {
    game.inningPositions.forEach(inning => {
      const posType = getPositionType(inning.position);
      counts[posType]++;
    });
  });
  
  return counts;
};