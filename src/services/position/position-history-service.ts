/**
 * Position History Service
 * Handles storage and calculation of player position history using the reference-based approach
 * This service exclusively uses MongoDB for storage - no local storage is utilized
 */
import { v4 as uuidv4 } from 'uuid';
import { PlayerPositionHistory, TimeframePositionMetrics } from '../../types/position-history';
import { Lineup } from '../../types/lineup';
import { Game } from '../../types/game';
import { Position } from '../../types/player';
import { PositionType, getPositionType } from '../../utils/position-utils';
// No local storage imports - using MongoDB exclusively

// Check if code is running on server or client
const isServer = typeof window === 'undefined';

// Only import MongoDB-specific modules on the server side
// These imports will be excluded from client bundles
let PositionHistoryModel: any;
let connectMongoDB: any;

if (isServer) {
  // Dynamic import for server-side only
  import('../../models/position-history').then(module => {
    PositionHistoryModel = module.PositionHistory;
  });
  import('../database/mongodb').then(module => {
    connectMongoDB = module.connectMongoDB;
  });
}

/**
 * Creates empty metrics structure with default values
 */
const createEmptyMetrics = (): TimeframePositionMetrics => {
  // Initialize counts for all positions
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'BN'];
  const positionCounts: Record<Position, number> = {} as Record<Position, number>;
  const positionPercentages: Record<Position, number> = {} as Record<Position, number>;
  
  positions.forEach(pos => {
    positionCounts[pos] = 0;
    positionPercentages[pos] = 0;
  });
  
  // Initialize counts for position types
  const positionTypes: PositionType[] = [
    PositionType.PITCHER,
    PositionType.CATCHER,
    PositionType.INFIELD,
    PositionType.OUTFIELD,
    PositionType.DH,
    PositionType.BENCH
  ];
  
  const positionTypeCounts: Record<PositionType, number> = {} as Record<PositionType, number>;
  const positionTypePercentages: Record<PositionType, number> = {} as Record<PositionType, number>;
  
  positionTypes.forEach(type => {
    positionTypeCounts[type] = 0;
    positionTypePercentages[type] = 0;
  });
  
  return {
    positionCounts,
    positionPercentages,
    positionTypeCounts,
    positionTypePercentages,
    benchPercentage: 0,
    varietyScore: 0,
    consecutiveBench: 0,
    benchStreak: {
      current: 0,
      max: 0
    },
    needsInfield: false,
    needsOutfield: false,
    totalInnings: 0,
    gamesPlayed: 0,
    playingTimePercentage: 0,
    samePositionStreak: {
      position: null,
      count: 0
    }
  };
};

/**
 * Get unique player IDs from a lineup
 */
const getUniquePlayerIds = (lineup: Lineup): string[] => {
  const playerIds = new Set<string>();
  
  lineup.innings.forEach(inning => {
    inning.positions.forEach(pos => {
      if (pos.playerId) {
        playerIds.add(pos.playerId);
      }
    });
  });
  
  return Array.from(playerIds);
};

/**
 * Get positions played by a player in a specific game
 */
const getPlayerPositionsInGame = (playerId: string, lineup: Lineup): InningPosition[] => {
  const positions: InningPosition[] = [];
  
  lineup.innings.forEach(inning => {
    const position = inning.positions.find(pos => pos.playerId === playerId);
    
    if (position) {
      positions.push({
        inning: inning.inning,
        position: position.position
      });
    } else {
      // If player not found in this inning, they were on bench
      positions.push({
        inning: inning.inning,
        position: 'BN'
      });
    }
  });
  
  return positions;
};

interface InningPosition {
  inning: number;
  position: Position;
}

/**
 * Calculate metrics for a player based on their position history
 */
const calculateMetrics = (
  playerId: string,
  positions: InningPosition[],
  timeframe: string
): TimeframePositionMetrics => {
  // Create a new metrics object
  const metrics = createEmptyMetrics();
  
  // No positions means no metrics to calculate
  if (positions.length === 0) {
    return metrics;
  }
  
  metrics.totalInnings = positions.length;
  metrics.gamesPlayed = new Set(positions.map(() => 1)).size; // This is a placeholder
  
  // Count positions and position types
  positions.forEach(pos => {
    // Increment position count
    metrics.positionCounts[pos.position]++;
    
    // Increment position type count
    const positionType = getPositionType(pos.position);
    metrics.positionTypeCounts[positionType]++;
  });
  
  // Calculate percentages
  const totalInnings = metrics.totalInnings;
  
  Object.keys(metrics.positionCounts).forEach(pos => {
    const position = pos as Position;
    metrics.positionPercentages[position] = totalInnings > 0
      ? (metrics.positionCounts[position] / totalInnings) * 100
      : 0;
  });
  
  Object.keys(metrics.positionTypeCounts).forEach(type => {
    const positionType = type as PositionType;
    metrics.positionTypePercentages[positionType] = totalInnings > 0
      ? (metrics.positionTypeCounts[positionType] / totalInnings) * 100
      : 0;
  });
  
  // Calculate bench percentage
  metrics.benchPercentage = metrics.positionPercentages['BN'] || 0;
  
  // Calculate playing time percentage (inverse of bench percentage)
  metrics.playingTimePercentage = 100 - metrics.benchPercentage;
  
  // Calculate bench streak
  let currentBenchStreak = 0;
  let maxBenchStreak = 0;
  
  positions.forEach(pos => {
    if (pos.position === 'BN') {
      currentBenchStreak++;
      maxBenchStreak = Math.max(maxBenchStreak, currentBenchStreak);
    } else {
      currentBenchStreak = 0;
    }
  });
  
  metrics.benchStreak.current = currentBenchStreak;
  metrics.benchStreak.max = maxBenchStreak;
  
  // Calculate same position streak
  let currentPosStreak = 1;
  let currentPos: Position | null = positions[0]?.position || null;
  let samePositionStreakCount = 1;
  
  for (let i = 1; i < positions.length; i++) {
    if (positions[i].position === currentPos && currentPos !== 'BN') {
      currentPosStreak++;
    } else {
      currentPosStreak = 1;
      currentPos = positions[i].position;
    }
    
    samePositionStreakCount = Math.max(samePositionStreakCount, currentPosStreak);
  }
  
  metrics.samePositionStreak = {
    position: currentPos,
    count: samePositionStreakCount
  };
  
  // Calculate position variety score (0-100)
  const uniquePositions = new Set(
    positions
      .filter(pos => pos.position !== 'BN')
      .map(pos => pos.position)
  ).size;
  
  const totalPositions = 9; // All field positions excluding bench
  metrics.varietyScore = Math.min(100, (uniquePositions / totalPositions) * 100);
  
  // Determine position needs
  const hasInfield = metrics.positionTypeCounts[PositionType.INFIELD] > 0;
  const hasOutfield = metrics.positionTypeCounts[PositionType.OUTFIELD] > 0;
  
  metrics.needsInfield = !hasInfield && (
    metrics.positionTypeCounts[PositionType.PITCHER] > 0 ||
    metrics.positionTypeCounts[PositionType.CATCHER] > 0
  );
  
  metrics.needsOutfield = !hasOutfield && hasInfield;
  
  // Calculate consecutive bench innings
  metrics.consecutiveBench = positions
    .reverse() // Look at most recent innings first
    .findIndex(pos => pos.position !== 'BN');
  
  metrics.consecutiveBench = metrics.consecutiveBench === -1 
    ? positions.length 
    : metrics.consecutiveBench;
  
  return metrics;
};

/**
 * Position History Service implementation
 */
export const positionHistoryService = {
  /**
   * Get position history for a player
   */
  async getPlayerPositionHistory(
    playerId: string,
    teamId: string, 
    season: string = new Date().getFullYear().toString()
  ): Promise<PlayerPositionHistory | null> {
    try {
      // Check if running in browser or server
      if (!isServer) {
        // Use API endpoint in browser
        const response = await fetch(`/api/players/position-history?playerId=${playerId}&teamId=${teamId}${season ? `&season=${season}` : ''}`);
        if (!response.ok) {
          console.error('API error fetching position history:', await response.text());
          return null;
        }
        
        const data = await response.json();
        return data.success ? data.positionHistory : null;
      } else {
        // Server-side MongoDB access
        // Ensure MongoDB modules are loaded
        if (!PositionHistoryModel || !connectMongoDB) {
          console.error('MongoDB modules not loaded yet');
          return null;
        }
        
        // Connect to MongoDB
        await connectMongoDB();
        
        // Find the position history
        const dbHistory = await PositionHistoryModel.findOne({
          playerId,
          teamId,
          season
        });
        
        if (!dbHistory) {
          return null;
        }
        
        // Return the position history
        return {
          id: dbHistory.id,
          playerId: dbHistory.playerId,
          teamId: dbHistory.teamId,
          season: dbHistory.season,
          gamesPlayed: dbHistory.gamesPlayed,
          metrics: dbHistory.metrics,
          updatedAt: dbHistory.updatedAt
        };
      }
    } catch (error) {
      console.error('Error fetching position history:', error);
      return null;
    }
  },
  
  /**
   * Get position histories for all players in a team
   */
  async getTeamPositionHistories(
    teamId: string,
    season: string = new Date().getFullYear().toString()
  ): Promise<PlayerPositionHistory[]> {
    try {
      // Check if running in browser or server
      if (!isServer) {
        // Use API endpoint in browser
        const response = await fetch(`/api/players/position-history/team?teamId=${teamId}${season ? `&season=${season}` : ''}`);
        if (!response.ok) {
          console.error('API error fetching team position histories:', await response.text());
          return [];
        }
        
        const data = await response.json();
        return data.success ? data.positionHistories : [];
      } else {
        // Server-side MongoDB access
        // Ensure MongoDB modules are loaded
        if (!PositionHistoryModel || !connectMongoDB) {
          console.error('MongoDB modules not loaded yet');
          return [];
        }
        
        // Connect to MongoDB
        await connectMongoDB();
        
        // Find all position histories for the team
        const dbHistories = await PositionHistoryModel.find({
          teamId,
          season
        });
        
        // Return the position histories
        return dbHistories.map(history => ({
          id: history.id,
          playerId: history.playerId,
          teamId: history.teamId,
          season: history.season,
          gamesPlayed: history.gamesPlayed,
          metrics: history.metrics,
          updatedAt: history.updatedAt
        }));
      }
    } catch (error) {
      console.error('Error fetching team position histories:', error);
      return [];
    }
  },
  
  /**
   * Update position history after game lineup changes
   */
  async updatePositionHistory(
    gameId: string,
    lineup: Lineup
  ): Promise<void> {
    try {
      // This method should only be called from the server side or in API routes
      // Client components should never call this directly
      if (!isServer) {
        console.warn('updatePositionHistory should not be called from client components');
        return;
      }
      
      // Ensure MongoDB modules are loaded
      if (!PositionHistoryModel || !connectMongoDB) {
        console.error('MongoDB modules not loaded yet');
        return;
      }
      
      // Connect to MongoDB
      await connectMongoDB();
      
      // Connect to MongoDB to fetch game data
      const client = await (await import('mongodb')).MongoClient.connect(process.env.MONGODB_URI || '');
      const db = client.db();
      
      // Get game data for season information from MongoDB
      const game = await db.collection('games').findOne({ id: gameId });
      if (!game) {
        console.error(`Game ${gameId} not found for position history update`);
        await client.close();
        return;
      }
      
      // Extract season from the game date
      const gameDate = new Date(game.date);
      const season = gameDate.getFullYear().toString();
      
      // Get all players involved in this game
      const playerIds = getUniquePlayerIds(lineup);
      
      // Update each player's position history
      const updatePromises = playerIds.map(async (playerId) => {
        // Get existing history or create new one
        let history = await this.getPlayerPositionHistory(playerId, lineup.teamId, season);
        
        if (!history) {
          // Create new history
          history = {
            id: `ph_${playerId}_${uuidv4()}`,
            playerId,
            teamId: lineup.teamId,
            season,
            gamesPlayed: [],
            metrics: {
              season: createEmptyMetrics(),
              last5Games: createEmptyMetrics(),
              last3Games: createEmptyMetrics(),
              lastGame: createEmptyMetrics()
            },
            updatedAt: Date.now()
          };
        }
        
        // Add game to played games if not already there
        if (!history.gamesPlayed.includes(gameId)) {
          history.gamesPlayed.unshift(gameId); // Add to beginning for newest-first order
        }
        
        // Recalculate metrics
        await this.recalculateMetrics(history);
        
        // Save updated history
        await this.savePositionHistory(history);
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating position history:', error);
    }
  },
  
  /**
   * Recalculate metrics for a player's position history
   */
  async recalculateMetrics(history: PlayerPositionHistory): Promise<void> {
    try {
      // This method should only be called from the server side or in API routes
      if (!isServer) {
        console.warn('recalculateMetrics should not be called from client components');
        return;
      }
      
      // Connect to MongoDB to fetch games and lineups
      const client = await (await import('mongodb')).MongoClient.connect(process.env.MONGODB_URI || '');
      const db = client.db();
      
      // Get all games with their lineups from MongoDB
      const gameLineups = await Promise.all(
        history.gamesPlayed.map(async (gameId) => {
          // Get game from MongoDB
          const game = await db.collection('games').findOne({ id: gameId });
          
          // Get lineup from MongoDB if game has a lineupId
          const lineup = game?.lineupId 
            ? await db.collection('gameLineups').findOne({ id: game.lineupId }) || 
              await db.collection('lineups').findOne({ id: game.lineupId })
            : null;
          
          return { game, lineup };
        })
      );
      
      // Close MongoDB connection
      await client.close();
      
      // Filter out any games/lineups that couldn't be found
      const validGameLineups = gameLineups.filter(
        ({ game, lineup }) => game !== null && lineup !== null
      ) as { game: Game, lineup: Lineup }[];
      
      // Sort by date (newest first)
      validGameLineups.sort((a, b) => b.game.date - a.game.date);
      
      // Create arrays of positions for different timeframes
      const allInnings: InningPosition[] = [];
      const last5GamesInnings: InningPosition[] = [];
      const last3GamesInnings: InningPosition[] = [];
      const lastGameInnings: InningPosition[] = [];
      
      // Get all innings
      validGameLineups.forEach(({ game, lineup }, index) => {
        const positions = getPlayerPositionsInGame(history.playerId, lineup);
        
        // Add to all innings
        allInnings.push(...positions);
        
        // Add to appropriate timeframe arrays
        if (index < 5) {
          last5GamesInnings.push(...positions);
        }
        
        if (index < 3) {
          last3GamesInnings.push(...positions);
        }
        
        if (index === 0) {
          lastGameInnings.push(...positions);
        }
      });
      
      // Calculate metrics for each timeframe
      history.metrics.season = calculateMetrics(history.playerId, allInnings, 'season');
      history.metrics.last5Games = calculateMetrics(history.playerId, last5GamesInnings, 'last5Games');
      history.metrics.last3Games = calculateMetrics(history.playerId, last3GamesInnings, 'last3Games');
      history.metrics.lastGame = calculateMetrics(history.playerId, lastGameInnings, 'lastGame');
      
      // Update the games played count for each timeframe
      history.metrics.season.gamesPlayed = validGameLineups.length;
      history.metrics.last5Games.gamesPlayed = Math.min(validGameLineups.length, 5);
      history.metrics.last3Games.gamesPlayed = Math.min(validGameLineups.length, 3);
      history.metrics.lastGame.gamesPlayed = validGameLineups.length > 0 ? 1 : 0;
      
      // Update timestamp
      history.updatedAt = Date.now();
    } catch (error) {
      console.error('Error recalculating metrics:', error);
    }
  },
  
  /**
   * Save position history to MongoDB
   */
  async savePositionHistory(history: PlayerPositionHistory): Promise<boolean> {
    try {
      // This method should only be called from the server side or in API routes
      if (!isServer) {
        console.warn('savePositionHistory should not be called from client components');
        return false;
      }
      
      // Ensure MongoDB modules are loaded
      if (!PositionHistoryModel || !connectMongoDB) {
        console.error('MongoDB modules not loaded yet');
        return false;
      }
      
      // Connect to MongoDB
      await connectMongoDB();
      
      // Save to MongoDB
      await PositionHistoryModel.findOneAndUpdate(
        { 
          playerId: history.playerId,
          teamId: history.teamId,
          season: history.season
        },
        history,
        { upsert: true, new: true }
      );
      
      return true;
    } catch (error) {
      console.error('Error saving position history:', error);
      return false;
    }
  },
  
  /**
   * Delete position history for a player
   */
  async deletePositionHistory(
    playerId: string,
    teamId: string,
    season: string = new Date().getFullYear().toString()
  ): Promise<boolean> {
    try {
      // This method should only be called from the server side or in API routes
      if (!isServer) {
        console.warn('deletePositionHistory should not be called from client components');
        return false;
      }
      
      // Ensure MongoDB modules are loaded
      if (!PositionHistoryModel || !connectMongoDB) {
        console.error('MongoDB modules not loaded yet');
        return false;
      }
      
      // Connect to MongoDB
      await connectMongoDB();
      
      // Delete from MongoDB
      await PositionHistoryModel.deleteOne({
        playerId,
        teamId,
        season
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting position history:', error);
      return false;
    }
  }
};

export default positionHistoryService;