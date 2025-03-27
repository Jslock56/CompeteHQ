/**
 * MongoDB database service
 * Handles connection and CRUD operations for all entities
 */
import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb';
import { Team } from '../../types/team';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { Practice } from '../../types/practice';
import { PositionHistory } from '../../types/position-history';

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'competehq';

// Collections
const COLLECTIONS = {
  TEAMS: 'teams',
  PLAYERS: 'players',
  GAMES: 'games',
  LINEUPS: 'lineups',
  PRACTICES: 'practices',
  POSITION_HISTORIES: 'positionHistories',
  USERS: 'users',
  APP_SETTINGS: 'appSettings'
};

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  // Collections
  private teamsCollection: Collection<Team> | null = null;
  private playersCollection: Collection<Player> | null = null;
  private gamesCollection: Collection<Game> | null = null;
  private lineupsCollection: Collection<Lineup> | null = null;
  private practicesCollection: Collection<Practice> | null = null;
  private positionHistoriesCollection: Collection<PositionHistory> | null = null;

  // Connection status
  private isConnected = false;
  private isConnecting = false;
  private connectionError: Error | null = null;

  // Singleton instance
  private static instance: MongoDBService;

  /**
   * Get the singleton instance
   */
  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Initialize the database connection
   * Should be called during app startup
   */
  async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    if (this.isConnecting) return false;
    
    try {
      this.isConnecting = true;
      this.connectionError = null;

      // Check if MongoDB URI is provided
      if (!MONGODB_URI) {
        throw new Error('MongoDB URI is not defined in environment variables');
      }

      // Create MongoDB client
      this.client = new MongoClient(MONGODB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });

      // Connect to the MongoDB server
      await this.client.connect();
      
      // Get database
      this.db = this.client.db(DB_NAME);
      
      // Initialize collections
      this.teamsCollection = this.db.collection<Team>(COLLECTIONS.TEAMS);
      this.playersCollection = this.db.collection<Player>(COLLECTIONS.PLAYERS);
      this.gamesCollection = this.db.collection<Game>(COLLECTIONS.GAMES);
      this.lineupsCollection = this.db.collection<Lineup>(COLLECTIONS.LINEUPS);
      this.practicesCollection = this.db.collection<Practice>(COLLECTIONS.PRACTICES);
      this.positionHistoriesCollection = this.db.collection<PositionHistory>(COLLECTIONS.POSITION_HISTORIES);

      // Create indexes
      await this.createIndexes();

      this.isConnected = true;
      console.log('Connected to MongoDB');
      return true;
    } catch (error) {
      this.connectionError = error as Error;
      console.error('Failed to connect to MongoDB:', error);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Create necessary indexes for better query performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database is not initialized');

    // Team indexes
    await this.teamsCollection?.createIndex({ id: 1 }, { unique: true });
    
    // Player indexes
    await this.playersCollection?.createIndex({ id: 1 }, { unique: true });
    await this.playersCollection?.createIndex({ teamId: 1 });
    
    // Game indexes
    await this.gamesCollection?.createIndex({ id: 1 }, { unique: true });
    await this.gamesCollection?.createIndex({ teamId: 1 });
    await this.gamesCollection?.createIndex({ date: 1 });
    
    // Lineup indexes
    await this.lineupsCollection?.createIndex({ id: 1 }, { unique: true });
    await this.lineupsCollection?.createIndex({ gameId: 1 });
    await this.lineupsCollection?.createIndex({ teamId: 1 });
    
    // Practice indexes
    await this.practicesCollection?.createIndex({ id: 1 }, { unique: true });
    await this.practicesCollection?.createIndex({ teamId: 1 });
    await this.practicesCollection?.createIndex({ date: 1 });
    
    // Position history indexes
    await this.positionHistoriesCollection?.createIndex({ playerId: 1 }, { unique: true });
  }

  /**
   * Close the database connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected to the database
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  /**
   * Get the connection error if any
   */
  getConnectionError(): Error | null {
    return this.connectionError;
  }

  /**
   * Team-related operations
   */
  
  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    if (!this.teamsCollection) throw new Error('Teams collection is not initialized');
    return this.teamsCollection.find({}).toArray();
  }

  /**
   * Get a team by ID
   */
  async getTeam(id: string): Promise<Team | null> {
    if (!this.teamsCollection) throw new Error('Teams collection is not initialized');
    return this.teamsCollection.findOne({ id });
  }

  /**
   * Save a team
   */
  async saveTeam(team: Team): Promise<boolean> {
    if (!this.teamsCollection) throw new Error('Teams collection is not initialized');
    
    try {
      const result = await this.teamsCollection.updateOne(
        { id: team.id },
        { $set: team },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to save team:', error);
      return false;
    }
  }

  /**
   * Delete a team and all related data
   */
  async deleteTeam(id: string): Promise<boolean> {
    if (!this.teamsCollection) throw new Error('Teams collection is not initialized');
    
    try {
      // Start a session to use transactions
      const session = this.client?.startSession();
      
      try {
        // Start a transaction
        session?.startTransaction();
        
        // Delete team
        const teamResult = await this.teamsCollection?.deleteOne({ id }, { session });
        
        // Delete related players
        const playersResult = await this.playersCollection?.deleteMany({ teamId: id }, { session });
        
        // Get game IDs
        const games = await this.gamesCollection?.find({ teamId: id }, { projection: { id: 1 } }).toArray();
        const gameIds = games?.map(game => game.id) || [];
        
        // Delete lineups for these games
        if (gameIds.length > 0) {
          await this.lineupsCollection?.deleteMany({ gameId: { $in: gameIds } }, { session });
        }
        
        // Delete games
        await this.gamesCollection?.deleteMany({ teamId: id }, { session });
        
        // Delete practices
        await this.practicesCollection?.deleteMany({ teamId: id }, { session });
        
        // Commit the transaction
        await session?.commitTransaction();
        
        return true;
      } catch (error) {
        // Abort the transaction in case of error
        await session?.abortTransaction();
        throw error;
      } finally {
        // End the session
        session?.endSession();
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      return false;
    }
  }

  /**
   * Player-related operations
   */
  
  /**
   * Get all players for a team
   */
  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    if (!this.playersCollection) throw new Error('Players collection is not initialized');
    return this.playersCollection.find({ teamId }).toArray();
  }

  /**
   * Get a player by ID
   */
  async getPlayer(id: string): Promise<Player | null> {
    if (!this.playersCollection) throw new Error('Players collection is not initialized');
    return this.playersCollection.findOne({ id });
  }

  /**
   * Save a player
   */
  async savePlayer(player: Player): Promise<boolean> {
    if (!this.playersCollection) throw new Error('Players collection is not initialized');
    
    try {
      const result = await this.playersCollection.updateOne(
        { id: player.id },
        { $set: player },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to save player:', error);
      return false;
    }
  }

  /**
   * Delete a player
   */
  async deletePlayer(id: string): Promise<boolean> {
    if (!this.playersCollection) throw new Error('Players collection is not initialized');
    
    try {
      // Start a session to use transactions
      const session = this.client?.startSession();
      
      try {
        // Start a transaction
        session?.startTransaction();
        
        // Delete player
        const playerResult = await this.playersCollection?.deleteOne({ id }, { session });
        
        // Delete position history
        await this.positionHistoriesCollection?.deleteOne({ playerId: id }, { session });
        
        // Commit the transaction
        await session?.commitTransaction();
        
        return playerResult?.deletedCount === 1;
      } catch (error) {
        // Abort the transaction in case of error
        await session?.abortTransaction();
        throw error;
      } finally {
        // End the session
        session?.endSession();
      }
    } catch (error) {
      console.error('Failed to delete player:', error);
      return false;
    }
  }

  /**
   * Game-related operations
   */
  
  /**
   * Get all games for a team
   */
  async getGamesByTeam(teamId: string): Promise<Game[]> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    return this.gamesCollection.find({ teamId }).sort({ date: -1 }).toArray();
  }

  /**
   * Get a game by ID
   */
  async getGame(id: string): Promise<Game | null> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    return this.gamesCollection.findOne({ id });
  }

  /**
   * Save a game
   */
  async saveGame(game: Game): Promise<boolean> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    
    try {
      const result = await this.gamesCollection.updateOne(
        { id: game.id },
        { $set: game },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Delete a game
   */
  async deleteGame(id: string): Promise<boolean> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    
    try {
      // Start a session to use transactions
      const session = this.client?.startSession();
      
      try {
        // Start a transaction
        session?.startTransaction();
        
        // Get the game to check if it has a lineup
        const game = await this.gamesCollection?.findOne({ id });
        
        // Delete the lineup if it exists
        if (game?.lineupId) {
          await this.lineupsCollection?.deleteOne({ id: game.lineupId }, { session });
        }
        
        // Delete the game
        const gameResult = await this.gamesCollection?.deleteOne({ id }, { session });
        
        // Commit the transaction
        await session?.commitTransaction();
        
        return gameResult?.deletedCount === 1;
      } catch (error) {
        // Abort the transaction in case of error
        await session?.abortTransaction();
        throw error;
      } finally {
        // End the session
        session?.endSession();
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
      return false;
    }
  }

  /**
   * Get upcoming games for a team
   */
  async getUpcomingGames(teamId: string): Promise<Game[]> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    const now = Date.now();
    return this.gamesCollection.find({ teamId, date: { $gt: now } }).sort({ date: 1 }).toArray();
  }

  /**
   * Get past games for a team
   */
  async getPastGames(teamId: string): Promise<Game[]> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    const now = Date.now();
    return this.gamesCollection.find({ teamId, date: { $lte: now } }).sort({ date: -1 }).toArray();
  }

  /**
   * Lineup-related operations
   */
  
  /**
   * Get a lineup by ID
   */
  async getLineup(id: string): Promise<Lineup | null> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    return this.lineupsCollection.findOne({ id });
  }

  /**
   * Get lineup by game ID
   */
  async getLineupByGame(gameId: string): Promise<Lineup | null> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    return this.lineupsCollection.findOne({ gameId });
  }

  /**
   * Save a lineup
   */
  async saveLineup(lineup: Lineup): Promise<boolean> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    
    try {
      // Start a session to use transactions
      const session = this.client?.startSession();
      
      try {
        // Start a transaction
        session?.startTransaction();
        
        // Save the lineup
        const lineupResult = await this.lineupsCollection.updateOne(
          { id: lineup.id },
          { $set: lineup },
          { upsert: true, session }
        );
        
        // Update the game to reference this lineup
        const game = await this.gamesCollection.findOne({ id: lineup.gameId });
        
        if (game && !game.lineupId) {
          await this.gamesCollection.updateOne(
            { id: lineup.gameId },
            { $set: { lineupId: lineup.id } },
            { session }
          );
        }
        
        // Commit the transaction
        await session?.commitTransaction();
        
        return lineupResult.acknowledged;
      } catch (error) {
        // Abort the transaction in case of error
        await session?.abortTransaction();
        throw error;
      } finally {
        // End the session
        session?.endSession();
      }
    } catch (error) {
      console.error('Failed to save lineup:', error);
      return false;
    }
  }

  /**
   * Delete a lineup
   */
  async deleteLineup(id: string): Promise<boolean> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    
    try {
      // Start a session to use transactions
      const session = this.client?.startSession();
      
      try {
        // Start a transaction
        session?.startTransaction();
        
        // Get the lineup to find the associated game
        const lineup = await this.lineupsCollection.findOne({ id });
        
        // Remove the lineup reference from the game
        if (lineup) {
          await this.gamesCollection.updateOne(
            { id: lineup.gameId, lineupId: id },
            { $unset: { lineupId: "" } },
            { session }
          );
        }
        
        // Delete the lineup
        const lineupResult = await this.lineupsCollection.deleteOne({ id }, { session });
        
        // Commit the transaction
        await session?.commitTransaction();
        
        return lineupResult.deletedCount === 1;
      } catch (error) {
        // Abort the transaction in case of error
        await session?.abortTransaction();
        throw error;
      } finally {
        // End the session
        session?.endSession();
      }
    } catch (error) {
      console.error('Failed to delete lineup:', error);
      return false;
    }
  }

  /**
   * Position history operations
   */
  
  /**
   * Get position history for a player
   */
  async getPositionHistory(playerId: string): Promise<PositionHistory | null> {
    if (!this.positionHistoriesCollection) throw new Error('Position histories collection is not initialized');
    return this.positionHistoriesCollection.findOne({ playerId });
  }

  /**
   * Save position history for a player
   */
  async savePositionHistory(history: PositionHistory): Promise<boolean> {
    if (!this.positionHistoriesCollection) throw new Error('Position histories collection is not initialized');
    
    try {
      const result = await this.positionHistoriesCollection.updateOne(
        { playerId: history.playerId },
        { $set: history },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to save position history:', error);
      return false;
    }
  }

  /**
   * Get position histories for all players in a team
   */
  async getTeamPositionHistories(teamId: string): Promise<PositionHistory[]> {
    if (!this.positionHistoriesCollection) throw new Error('Position histories collection is not initialized');
    if (!this.playersCollection) throw new Error('Players collection is not initialized');
    
    // Get all players for the team
    const players = await this.getPlayersByTeam(teamId);
    const playerIds = players.map(player => player.id);
    
    // Get position histories for these players
    return this.positionHistoriesCollection.find({ playerId: { $in: playerIds } }).toArray();
  }

  /**
   * Practice-related operations
   */
  
  /**
   * Get all practices for a team
   */
  async getPracticesByTeam(teamId: string): Promise<Practice[]> {
    if (!this.practicesCollection) throw new Error('Practices collection is not initialized');
    return this.practicesCollection.find({ teamId }).sort({ date: -1 }).toArray();
  }

  /**
   * Get a practice by ID
   */
  async getPractice(id: string): Promise<Practice | null> {
    if (!this.practicesCollection) throw new Error('Practices collection is not initialized');
    return this.practicesCollection.findOne({ id });
  }

  /**
   * Save a practice
   */
  async savePractice(practice: Practice): Promise<boolean> {
    if (!this.practicesCollection) throw new Error('Practices collection is not initialized');
    
    try {
      const result = await this.practicesCollection.updateOne(
        { id: practice.id },
        { $set: practice },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to save practice:', error);
      return false;
    }
  }

  /**
   * Delete a practice
   */
  async deletePractice(id: string): Promise<boolean> {
    if (!this.practicesCollection) throw new Error('Practices collection is not initialized');
    
    try {
      const result = await this.practicesCollection.deleteOne({ id });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Failed to delete practice:', error);
      return false;
    }
  }

  /**
   * Get upcoming practices for a team
   */
  async getUpcomingPractices(teamId: string): Promise<Practice[]> {
    if (!this.practicesCollection) throw new Error('Practices collection is not initialized');
    const now = Date.now();
    return this.practicesCollection.find({ teamId, date: { $gt: now } }).sort({ date: 1 }).toArray();
  }

  /**
   * Get past practices for a team
   */
  async getPastPractices(teamId: string): Promise<Practice[]> {
    if (!this.practicesCollection) throw new Error('Practices collection is not initialized');
    const now = Date.now();
    return this.practicesCollection.find({ teamId, date: { $lte: now } }).sort({ date: -1 }).toArray();
  }
}

// Export singleton instance
export const mongoDBService = MongoDBService.getInstance();
export default mongoDBService;