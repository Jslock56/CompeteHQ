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

/**
 * Position type categorization
 */
export enum PositionType {
  PITCHER = 'pitcher',
  CATCHER = 'catcher',
  INFIELD = 'infield',
  OUTFIELD = 'outfield',
  BENCH = 'bench',
  DH = 'dh'
}

/**
 * Checks if a position is an infield position
 */
export const isInfieldPosition = (position: Position): boolean => {
  return ['P', 'C', '1B', '2B', '3B', 'SS'].includes(position);
};

/**
 * Checks if a position is an outfield position
 */
export const isOutfieldPosition = (position: Position): boolean => {
  return ['LF', 'CF', 'RF'].includes(position);
};

/**
 * Returns true if the position is a pitcher
 */
export const isPitcher = (position: Position): boolean => {
  return position === 'P';
};

/**
 * Returns true if the position is a catcher
 */
export const isCatcher = (position: Position): boolean => {
  return position === 'C';
};

/**
 * Returns true if the player is on the bench
 */
export const isBench = (position: Position): boolean => {
  return position === 'BN';
};

/**
 * Returns the position type for a given position
 */
export const getPositionType = (position: Position): PositionType => {
  if (isPitcher(position)) return PositionType.PITCHER;
  if (isCatcher(position)) return PositionType.CATCHER;
  if (isInfieldPosition(position) && !isPitcher(position) && !isCatcher(position)) 
    return PositionType.INFIELD;
  if (isOutfieldPosition(position)) return PositionType.OUTFIELD;
  if (isBench(position)) return PositionType.BENCH;
  return PositionType.DH; // DH is the only one left
};

/**
 * Returns a mapping of position codes to full names
 */
export const getPositionNames = (): Record<Position, string> => {
  return {
    'P': 'Pitcher',
    'C': 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    'SS': 'Shortstop',
    'LF': 'Left Field',
    'CF': 'Center Field',
    'RF': 'Right Field',
    'DH': 'Designated Hitter',
    'BN': 'Bench'
  };
};

/**
 * Get position color for visualization
 */
export const getPositionColor = (position: Position): string => {
  const positionColors: Record<Position, string> = {
    'P': 'red.500',
    'C': 'blue.500',
    '1B': 'green.500',
    '2B': 'orange.500',
    '3B': 'purple.500',
    'SS': 'pink.500',
    'LF': 'teal.500',
    'CF': 'cyan.500',
    'RF': 'blue.300',
    'BN': 'gray.500',
    'DH': 'blue.400',
  };
  
  return positionColors[position] || 'gray.500';
};

/**
 * Creates a new position history record for a player
 */
export const createPositionHistory = (playerId: string, teamId: string): PositionHistory => {
  return {
    id: `ph_${playerId}`,
    playerId,
    teamId,
    gamePositions: [],
    updatedAt: Date.now()
  };
};

/**
 * Retrieves a player's position history from a list of games and their lineups
 * This is used when position history is not already stored in the database
 */
export const getPlayerPositionHistory = (
  playerId: string,
  games: Game[],
  lineups: Record<string, Lineup>
): PositionHistory => {
  // Create a new position history
  const history: PositionHistory = {
    id: `ph_${playerId}`,
    playerId,
    teamId: games.length > 0 ? games[0].teamId : '',
    gamePositions: [],
    updatedAt: Date.now()
  };

  // Sort games by date (newest first for most operations)
  const sortedGames = [...games].sort((a, b) => b.date - a.date);

  // Process each game
  sortedGames.forEach(game => {
    const lineup = lineups[game.lineupId || ''];
    if (!lineup || lineup.status !== 'final') return;

    const gamePositions: GamePositions = {
      gameId: game.id,
      gameDate: game.date,
      innings: []
    };

    // Extract player's positions from each inning
    lineup.innings.forEach(inning => {
      const assignment = inning.positions.find(pos => pos.playerId === playerId);
      
      if (assignment) {
        gamePositions.innings.push({
          inning: inning.inning,
          position: assignment.position
        });
      } else {
        // Player was on bench for this inning
        gamePositions.innings.push({
          inning: inning.inning,
          position: 'BN'
        });
      }
    });

    history.gamePositions.push(gamePositions);
  });

  return history;
};

/**
 * Updates position history with positions from a new game
 */
export const updatePositionHistory = (
  positionHistory: PositionHistory | null, 
  gameId: string, 
  gameDate: number,
  lineup: Lineup,
  playerId: string
): PositionHistory => {
  // Create new history if none exists
  if (!positionHistory) {
    positionHistory = createPositionHistory(playerId, lineup.teamId);
  }
  
  // Check if game already exists in history
  const existingGameIndex = positionHistory.gamePositions.findIndex(g => g.gameId === gameId);
  
  // Create new game positions object
  const gamePositions: GamePositions = {
    gameId,
    gameDate,
    innings: []
  };
  
  // Extract player's positions from lineup
  lineup.innings.forEach(inning => {
    const playerAssignment = inning.positions.find(pos => pos.playerId === playerId);
    
    if (playerAssignment) {
      gamePositions.innings.push({
        inning: inning.inning,
        position: playerAssignment.position
      });
    } else {
      // Player was on bench for this inning
      gamePositions.innings.push({
        inning: inning.inning,
        position: 'BN'
      });
    }
  });
  
  // Add or update game positions in history
  if (existingGameIndex >= 0) {
    positionHistory.gamePositions[existingGameIndex] = gamePositions;
  } else {
    positionHistory.gamePositions.push(gamePositions);
  }
  
  // Sort games by date (newest first)
  positionHistory.gamePositions.sort((a, b) => b.gameDate - a.gameDate);
  
  // Update timestamp
  positionHistory.updatedAt = Date.now();
  
  return positionHistory;
};

/**
 * Gets all games with position details for a player
 */
export const getGamesWithPositions = (
  playerId: string,
  games: Game[],
  lineups: Record<string, Lineup>
): GameWithPosition[] => {
  const result: GameWithPosition[] = [];
  
  // Sort games by date (newest first)
  const sortedGames = [...games].sort((a, b) => b.date - a.date);
  
  for (const game of sortedGames) {
    const lineup = lineups[game.lineupId || ''];
    if (!lineup || lineup.status !== 'final') continue;
    
    // Get first inning to determine starting position
    const firstInning = lineup.innings.find(inning => inning.inning === 1);
    if (!firstInning) continue;
    
    const firstAssignment = firstInning.positions.find(pos => pos.playerId === playerId);
    const startingPosition = firstAssignment ? firstAssignment.position : 'BN';
    
    // Get positions for all innings
    const inningPositions: InningPosition[] = [];
    
    lineup.innings.forEach(inning => {
      const pos = inning.positions.find(p => p.playerId === playerId);
      inningPositions.push({
        inning: inning.inning,
        position: pos ? pos.position : 'BN'
      });
    });
    
    result.push({
      gameId: game.id,
      gameDate: game.date,
      opponent: game.opponent,
      startingPosition,
      inningPositions
    });
  }
  
  return result;
};

/**
 * Returns the last game where the player started on the bench
 */
export const getLastBenchStart = (
  playerId: string,
  games: Game[],
  lineups: Record<string, Lineup>
): GameWithPosition | undefined => {
  // Sort games by date (newest first)
  const sortedGames = [...games].sort((a, b) => b.date - a.date);
  
  for (const game of sortedGames) {
    const lineup = lineups[game.lineupId || ''];
    if (!lineup || lineup.status !== 'final') continue;
    
    // Check if player started on bench (first inning)
    const firstInning = lineup.innings.find(inning => inning.inning === 1);
    if (!firstInning) continue;
    
    const assignment = firstInning.positions.find(pos => pos.playerId === playerId);
    if (!assignment || assignment.position === 'BN') {
      // Player started on bench, create GameWithPosition
      const inningPositions: InningPosition[] = [];
      
      lineup.innings.forEach(inning => {
        const pos = inning.positions.find(p => p.playerId === playerId);
        inningPositions.push({
          inning: inning.inning,
          position: pos ? pos.position : 'BN'
        });
      });
      
      return {
        gameId: game.id,
        gameDate: game.date,
        opponent: game.opponent,
        startingPosition: 'BN',
        inningPositions
      };
    }
  }
  
  return undefined;
};

/**
 * Returns the position distribution for a player over the last N games
 */
export const getPositionDistribution = (
  playerId: string,
  gamesWithPositions: GameWithPosition[],
  gameCount?: number
): PositionDistribution => {
  // Filter to the requested number of games
  const games = gameCount 
    ? gamesWithPositions.slice(0, Math.min(gameCount, gamesWithPositions.length)) 
    : gamesWithPositions;
  
  // Initialize position counts
  const startingPositionCounts: Record<Position, number> = {
    'P': 0, 'C': 0, '1B': 0, '2B': 0, '3B': 0, 'SS': 0, 
    'LF': 0, 'CF': 0, 'RF': 0, 'DH': 0, 'BN': 0
  };
  
  const positionCounts: Record<Position, number> = {
    'P': 0, 'C': 0, '1B': 0, '2B': 0, '3B': 0, 'SS': 0, 
    'LF': 0, 'CF': 0, 'RF': 0, 'DH': 0, 'BN': 0
  };
  
  // Initialize position type counts
  const positionTypeCounts: Record<PositionType, number> = {
    [PositionType.PITCHER]: 0,
    [PositionType.CATCHER]: 0,
    [PositionType.INFIELD]: 0,
    [PositionType.OUTFIELD]: 0,
    [PositionType.BENCH]: 0,
    [PositionType.DH]: 0
  };
  
  // Count starting positions
  let startedOnBench = 0;
  let lastBenchStart: GameWithPosition | undefined;
  
  games.forEach(game => {
    // Count starting position
    startingPositionCounts[game.startingPosition]++;
    
    if (game.startingPosition === 'BN') {
      startedOnBench++;
      if (!lastBenchStart || game.gameDate > lastBenchStart.gameDate) {
        lastBenchStart = game;
      }
    }
    
    // Count all positions in all innings
    game.inningPositions.forEach(inning => {
      positionCounts[inning.position]++;
      positionTypeCounts[getPositionType(inning.position)]++;
    });
  });
  
  // Calculate total innings
  const totalInnings = Object.values(positionCounts).reduce((sum, count) => sum + count, 0);
  
  // Calculate percentages
  const positionPercentages: Record<Position, number> = {} as Record<Position, number>;
  const positionTypePercentages: Record<PositionType, number> = {} as Record<PositionType, number>;
  
  Object.entries(positionCounts).forEach(([position, count]) => {
    positionPercentages[position as Position] = totalInnings > 0 
      ? (count / totalInnings) * 100 
      : 0;
  });
  
  Object.entries(positionTypeCounts).forEach(([type, count]) => {
    positionTypePercentages[type as PositionType] = totalInnings > 0 
      ? (count / totalInnings) * 100 
      : 0;
  });
  
  return {
    playerId,
    gameCount: games.length,
    totalInnings,
    startingPositionCounts,
    positionCounts,
    positionPercentages,
    positionTypeCounts,
    positionTypePercentages,
    startedOnBench,
    lastBenchStart
  };
};

/**
 * Returns innings played by position type for a player over the last N games
 */
export const getInningsByPositionType = (
  playerId: string,
  gamesWithPositions: GameWithPosition[],
  gameCount?: number
): Record<PositionType, number> => {
  const distribution = getPositionDistribution(playerId, gamesWithPositions, gameCount);
  return distribution.positionTypeCounts;
};

/**
 * Calculates full position metrics for a player
 */
export const getPositionMetrics = (
  playerId: string,
  gamesWithPositions: GameWithPosition[],
): PositionMetrics => {
  const allGames = getPositionDistribution(playerId, gamesWithPositions);
  
  // Calculate metrics for different time frames
  const last1Game = gamesWithPositions.length >= 1 
    ? getPositionDistribution(playerId, gamesWithPositions, 1)
    : null;
    
  const last3Games = gamesWithPositions.length >= 3 
    ? getPositionDistribution(playerId, gamesWithPositions, 3)
    : null;
    
  const last5Games = gamesWithPositions.length >= 5 
    ? getPositionDistribution(playerId, gamesWithPositions, 5)
    : null;
    
  const last10Games = gamesWithPositions.length >= 10 
    ? getPositionDistribution(playerId, gamesWithPositions, 10)
    : null;
  
  // Calculate bench streak metrics
  let benchStreakCurrent = 0;
  let benchStreakMax = 0;
  let currentStreak = 0;
  
  // Flatten all innings across all games and sort chronologically
  const chronologicalInnings: {gameDate: number, inning: number, position: Position}[] = [];
  gamesWithPositions.forEach(game => {
    game.inningPositions.forEach(inningPos => {
      chronologicalInnings.push({
        gameDate: game.gameDate,
        inning: inningPos.inning,
        position: inningPos.position
      });
    });
  });
  
  // Sort by date and then inning
  chronologicalInnings.sort((a, b) => {
    if (a.gameDate !== b.gameDate) {
      return a.gameDate - b.gameDate;
    }
    return a.inning - b.inning;
  });
  
  // Calculate current and max bench streaks
  chronologicalInnings.forEach(inning => {
    if (inning.position === 'BN') {
      currentStreak++;
      benchStreakMax = Math.max(benchStreakMax, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  benchStreakCurrent = currentStreak;
  
  // Calculate position streak metrics
  let samePositionStreakCurrent: Position | null = null;
  let samePositionStreakMax = 0;
  let currentPositionStreak = 0;
  let previousPosition: Position | null = null;
  
  chronologicalInnings.forEach(inning => {
    if (inning.position === previousPosition && inning.position !== 'BN') {
      currentPositionStreak++;
      if (currentPositionStreak > samePositionStreakMax) {
        samePositionStreakMax = currentPositionStreak;
        samePositionStreakCurrent = inning.position;
      }
    } else {
      currentPositionStreak = 1;
    }
    previousPosition = inning.position;
  });
  
  // Calculate variety score (0-100)
  let uniquePositionsPlayed = 0;
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  positions.forEach(position => {
    if (allGames.positionCounts[position] > 0) {
      uniquePositionsPlayed++;
    }
  });
  
  const varietyScore = Math.min(100, (uniquePositionsPlayed / positions.length) * 100);
  
  // Calculate playing time percentage
  const totalGameInnings = gamesWithPositions.reduce((sum, game) => 
    sum + game.inningPositions.length, 0);
  
  const nonBenchInnings = allGames.totalInnings - allGames.positionCounts['BN'];
  const playingTimePercentage = totalGameInnings > 0 
    ? (nonBenchInnings / totalGameInnings) * 100 
    : 0;
  
  return {
    playerId,
    totalGames: gamesWithPositions.length,
    totalInnings: allGames.totalInnings,
    last1Game,
    last3Games,
    last5Games,
    last10Games,
    allGames,
    // Take up to 10 most recent games for the grid
    positionGrid: gamesWithPositions.slice(0, 10),
    benchStreakCurrent,
    benchStreakMax,
    samePositionStreakCurrent,
    samePositionStreakMax,
    playingTimePercentage,
    varietyScore
  };
};

/**
 * Returns team-level position distribution metrics
 */
export const getTeamPositionDistribution = (
  teamId: string,
  players: Player[],
  gamesWithPositionsByPlayer: Record<string, GameWithPosition[]>,
  gameCount?: number
): TeamPositionDistribution => {
  const playerDistributions: Record<string, PositionDistribution> = {};
  
  // Calculate position distribution for each player
  players.forEach(player => {
    const playerGames = gamesWithPositionsByPlayer[player.id] || [];
    const filteredGames = gameCount 
      ? playerGames.slice(0, Math.min(gameCount, playerGames.length))
      : playerGames;
      
    playerDistributions[player.id] = getPositionDistribution(player.id, filteredGames);
  });
  
  // Calculate bench time variance
  const benchPercentages = Object.values(playerDistributions).map(
    dist => dist.positionPercentages['BN']
  );
  
  const benchTimeVariance = calculateVariance(benchPercentages);
  
  // Calculate position variety scores and variance
  const varietyScores = Object.keys(playerDistributions).map(playerId => {
    const gamesForPlayer = gamesWithPositionsByPlayer[playerId] || [];
    return getPositionMetrics(playerId, gamesForPlayer).varietyScore;
  });
  
  const positionVarietyVariance = calculateVariance(varietyScores);
  
  // Calculate overall fair play score (0-100)
  // Lower variance is better, so we convert to a 0-100 scale
  const benchTimeScore = Math.max(0, 100 - (benchTimeVariance * 2));
  const varietyScore = Math.max(0, 100 - (positionVarietyVariance * 2));
  
  const fairPlayScore = (benchTimeScore * 0.6) + (varietyScore * 0.4);
  
  // Identify players needing attention
  const activePlayers = players.filter(p => p.active).map(p => p.id);
  
  // Players with most bench time
  const mostBench = activePlayers
    .sort((a, b) => 
      (playerDistributions[b]?.positionPercentages['BN'] || 0) - 
      (playerDistributions[a]?.positionPercentages['BN'] || 0)
    )
    .slice(0, 3);
  
  // Players with least position variety
  const leastVariety = activePlayers
    .map(playerId => ({
      playerId,
      varietyScore: getPositionMetrics(playerId, gamesWithPositionsByPlayer[playerId] || []).varietyScore
    }))
    .sort((a, b) => a.varietyScore - b.varietyScore)
    .map(item => item.playerId)
    .slice(0, 3);
  
  // Players needing infield experience
  const needsInfield = activePlayers.filter(playerId => {
    const metrics = getInningsByPositionType(
      playerId, 
      gamesWithPositionsByPlayer[playerId] || []
    );
    
    return (
      metrics[PositionType.INFIELD] === 0 && 
      metrics[PositionType.PITCHER] + metrics[PositionType.CATCHER] > 0
    );
  });
  
  // Players needing outfield experience
  const needsOutfield = activePlayers.filter(playerId => {
    const metrics = getInningsByPositionType(
      playerId, 
      gamesWithPositionsByPlayer[playerId] || []
    );
    
    return (
      metrics[PositionType.OUTFIELD] === 0 && 
      metrics[PositionType.INFIELD] > 0
    );
  });
  
  return {
    teamId,
    gameCount: gameCount || Math.max(...Object.values(playerDistributions).map(d => d.gameCount), 0),
    playerDistributions,
    benchTimeVariance,
    positionVarietyVariance,
    fairPlayScore,
    mostBench,
    leastVariety,
    needsInfield,
    needsOutfield
  };
};

/**
 * Returns fair play metrics for a team
 */
export const getFairPlayMetrics = (
  teamId: string,
  players: Player[],
  gamesWithPositionsByPlayer: Record<string, GameWithPosition[]>,
  gameCount?: number
): TeamPositionDistribution => {
  return getTeamPositionDistribution(teamId, players, gamesWithPositionsByPlayer, gameCount);
};

/**
 * Helper function to calculate variance of an array of numbers
 */
export const calculateVariance = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  const squaredDiffs = numbers.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / numbers.length;
};