/**
 * MongoDB database service
 * Handles connection and CRUD operations for all entities
 */
// Remove 'use server' as it's causing compatibility issues
import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb';
import { Team } from '../../types/team';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { Practice } from '../../types/practice';
import { PositionHistory } from '../../types/position-history';

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// If MongoDB URI is not provided and we're in production, we should throw an error
if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
  throw new Error('MONGODB_URI is required in production environment');
}
const DB_NAME = 'competehq';

// Mongoose global connection
import mongoose from 'mongoose';

// Global connection status
let isConnected = false;

/**
 * Create a singleton Mongoose connection to be shared across all API routes
 * @returns Promise<boolean> true if connected successfully, false otherwise
 */
export async function connectMongoDB(): Promise<boolean> {
  if (isConnected) {
    console.log('=> Using existing MongoDB connection');
    return true;
  }

  try {
    if (!MONGODB_URI) {
      console.error('MONGODB_URI is not defined in environment variables');
      return false;
    }

    console.log('=> Connecting to MongoDB...');
    
    // Mongoose connection options
    const options = {
      serverSelectionTimeoutMS: 5000,  // 5 seconds
      socketTimeoutMS: 30000,  // 30 seconds
      connectTimeoutMS: 10000,  // 10 seconds
    };

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    console.log('=> MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Collections
const COLLECTIONS = {
  TEAMS: 'teams',
  PLAYERS: 'players',
  GAMES: 'games',
  LINEUPS: 'lineups',
  GAME_LINEUPS: 'gameLineups', // Dedicated collection for game lineups
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
  private gameLineupsCollection: Collection<Lineup> | null = null; // Dedicated collection for game lineups
  private practicesCollection: Collection<Practice> | null = null;
  private positionHistoriesCollection: Collection<PositionHistory> | null = null;
  private usersCollection: Collection<any> | null = null;

  // Connection status
  private isConnected = false;
  private isConnecting = false;
  private connectionError: Error | null = null;

  // Singleton instance
  private static instance: MongoDBService;
  
  /**
   * Get the MongoDB client instance
   * Exposing this for debugging purposes
   */
  getClient(): MongoClient | null {
    return this.client;
  }

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
    // If already successfully connected with all collections initialized, reuse the connection
    if (this.isConnected && this.db && this.client && 
        this.usersCollection && this.teamsCollection && 
        this.playersCollection && this.gamesCollection) {
      console.log('Already connected to MongoDB with all collections initialized, reusing connection');
      return true;
    }
    
    // If another connection is in progress, wait for it with a timeout
    if (this.isConnecting) {
      console.log('MongoDB connection attempt already in progress, waiting...');
      
      // Set a timeout to prevent indefinite waiting
      const connectionTimeout = setTimeout(() => {
        console.warn('Connection attempt timeout - resetting connection lock');
        this.isConnecting = false;
      }, 10000); // 10 second timeout
      
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max wait
      
      // Wait for the existing connection to complete
      while (this.isConnecting && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      clearTimeout(connectionTimeout);
      
      // Check if we're now connected and collections are initialized
      if (this.isConnected && this.db && this.client && this.usersCollection && this.teamsCollection) {
        console.log('MongoDB successfully connected while waiting');
        return true;
      }
      
      // If we timed out or the other connection attempt failed, we'll try again
      console.log('Previous connection attempt finished or timed out, starting new attempt');
    }
    
    // Mark that we're attempting to connect
    this.isConnecting = true;
    this.connectionError = null;
    
    try {
      // Check if MongoDB URI is provided
      if (!MONGODB_URI) {
        console.error('MongoDB URI is not defined in environment variables');
        this.connectionError = new Error('MONGODB_URI is not defined');
        if (process.env.NODE_ENV === 'production') {
          throw this.connectionError;
        }
        console.warn('No MongoDB URI available - database features will not work');
        return false;
      }

      console.log('Connecting to MongoDB...');

      // Create MongoDB client with improved options
      this.client = new MongoClient(MONGODB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 5000,  // 5 seconds
        socketTimeoutMS: 30000,  // 30 seconds
        serverSelectionTimeoutMS: 5000,  // 5 seconds
        maxPoolSize: 10
      });

      // Connect to the MongoDB server
      await this.client.connect();
      
      // Get database
      this.db = this.client.db(DB_NAME);
      
      console.log('Initializing all MongoDB collections...');
      
      // Initialize collections - ensure ALL collections are initialized
      this.teamsCollection = this.db.collection<Team>(COLLECTIONS.TEAMS);
      this.playersCollection = this.db.collection<Player>(COLLECTIONS.PLAYERS);
      this.gamesCollection = this.db.collection<Game>(COLLECTIONS.GAMES);
      this.lineupsCollection = this.db.collection<Lineup>(COLLECTIONS.LINEUPS);
      this.gameLineupsCollection = this.db.collection<Lineup>(COLLECTIONS.GAME_LINEUPS);
      this.practicesCollection = this.db.collection<Practice>(COLLECTIONS.PRACTICES);
      this.positionHistoriesCollection = this.db.collection<PositionHistory>(COLLECTIONS.POSITION_HISTORIES);
      this.usersCollection = this.db.collection(COLLECTIONS.USERS);
      
      // Verify collections are initialized
      if (!this.usersCollection || !this.teamsCollection) {
        throw new Error('Failed to initialize critical MongoDB collections');
      }

      // Create indexes
      await this.createIndexes();

      this.isConnected = true;
      console.log('Connected to MongoDB successfully with all collections initialized');
      return true;
    } catch (error) {
      this.connectionError = error as Error;
      console.error('Failed to connect to MongoDB:', error);
      console.error('Please check your MONGODB_URI in the .env file and ensure Atlas network access is configured correctly.');
      
      // Log more details about the error for debugging
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      }
      
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
    const connectionState = this.isConnected;
    console.log(`MongoDB connection status: ${connectionState ? 'Connected' : 'Not connected'}`);
    return connectionState;
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
    
    try {
      console.log(`MongoDB: Fetching game with ID: ${id}`);
      console.log(`MongoDB: Connection status: ${isConnected ? 'Connected' : 'Not connected'}`);
      console.log(`MongoDB: Games collection name: ${this.gamesCollection?.collectionName}`);
      
      // Use raw find to get the actual document from MongoDB
      const game = await this.gamesCollection.findOne({ id });
      
      if (game) {
        console.log(`MongoDB: Successfully found game: ${id}, opponent: ${game.opponent}`);
        console.log(`MongoDB: Game data details:`, {
          id: game.id,
          opponent: game.opponent,
          innings: game.innings,
          inningsType: typeof game.innings,
          allFields: Object.keys(game).join(', '),
          rawData: JSON.stringify(game)
        });
      } else {
        console.log(`MongoDB: No game found with ID: ${id}`);
      }
      
      return game;
    } catch (error) {
      console.error(`MongoDB: Error fetching game with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Save a game
   */
  async saveGame(game: Game): Promise<boolean> {
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    
    try {
      console.log(`MongoDB: Saving game with ID: ${game.id}, opponent: ${game.opponent}, teamId: ${game.teamId}, innings: ${game.innings}, innings type: ${typeof game.innings}`);
      
      // Handle the lineup reference if present
      if (game.lineupId) {
        console.log(`MongoDB: Game has a lineupId reference: ${game.lineupId}`);
        
        // Verify the lineup exists
        const lineup = await this.getLineup(game.lineupId);
        if (!lineup) {
          console.warn(`MongoDB: Referenced lineup ${game.lineupId} does not exist`);
        } else {
          console.log(`MongoDB: Verified lineup ${game.lineupId} exists`);
        }
      }
      
      // Make a debug copy of the game object to log it
      const gameCopy = {...game};
      console.log(`MongoDB: About to save game with full data:`, JSON.stringify(gameCopy));
      
      // Force innings to be a number if it exists
      if (game.innings !== undefined && typeof game.innings !== 'number') {
        console.warn(`MongoDB: Converting innings from ${typeof game.innings} to number:`, game.innings);
        game.innings = Number(game.innings);
        
        // If conversion fails, use default value
        if (isNaN(game.innings)) {
          console.warn(`MongoDB: Failed to convert innings to number, using default value`);
          game.innings = 7;
        }
      }
      
      // Log the connection status and collection name
      console.log(`MongoDB: Connection status: ${isConnected ? 'Connected' : 'Not connected'}`);
      console.log(`MongoDB: Games collection name: ${this.gamesCollection?.collectionName}`);
      
      const result = await this.gamesCollection.updateOne(
        { id: game.id },
        { $set: game },
        { upsert: true }
      );
      
      console.log(`MongoDB: Game save result - acknowledged: ${result.acknowledged}, upsertedCount: ${result.upsertedCount}, modifiedCount: ${result.modifiedCount}`);
      
      // Verify the game was actually saved by retrieving it
      try {
        const savedGame = await this.getGame(game.id);
        console.log(`MongoDB: Verification - Game retrieved after save:`, {
          id: savedGame?.id,
          innings: savedGame?.innings,
          inningsType: savedGame ? typeof savedGame.innings : 'undefined'
        });
      } catch (verifyError) {
        console.error('MongoDB: Failed to verify game was saved:', verifyError);
      }
      
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
   * Get non-game lineups for a team
   */
  async getNonGameLineupsByTeam(teamId: string): Promise<Lineup[]> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    return this.lineupsCollection.find({ 
      teamId,
      gameId: { $exists: false } 
    }).toArray();
  }
  
  /**
   * Get all lineups for a team (both game and non-game)
   */
  async getLineupsByTeam(teamId: string): Promise<Lineup[]> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    return this.lineupsCollection.find({ 
      teamId 
    }).toArray();
  }
  
  /**
   * Get default lineup for a team
   */
  async getDefaultTeamLineup(teamId: string): Promise<Lineup | null> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    return this.lineupsCollection.findOne({ 
      teamId, 
      isDefault: true,
      gameId: { $exists: false }
    });
  }
  
  /**
   * Set a lineup as the default for a team
   */
  async setDefaultTeamLineup(lineupId: string, teamId: string): Promise<boolean> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    
    try {
      // Start a session to use transactions
      const session = this.client?.startSession();
      
      try {
        // Start a transaction
        session?.startTransaction();
        
        // Unset any existing default
        await this.lineupsCollection.updateMany(
          { teamId, isDefault: true, gameId: { $exists: false } },
          { $set: { isDefault: false } },
          { session }
        );
        
        // Set the new default
        await this.lineupsCollection.updateOne(
          { id: lineupId, teamId },
          { $set: { isDefault: true } },
          { session }
        );
        
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
      console.error('Failed to set default lineup:', error);
      return false;
    }
  }

  /**
   * Save a lineup
   */
  async saveLineup(lineup: Lineup): Promise<boolean> {
    if (!this.lineupsCollection) throw new Error('Lineups collection is not initialized');
    if (!this.gamesCollection) throw new Error('Games collection is not initialized');
    
    try {
      console.log(`MongoDB: Saving lineup with ID: ${lineup.id}, name: ${lineup.name}, teamId: ${lineup.teamId}, gameId: ${lineup.gameId || 'N/A'}`);
      
      // To ensure we're not relying on transactions (which may fail in some MongoDB setups),
      // we'll use a simpler approach for non-game lineups
      if (!lineup.gameId) {
        // For non-game lineups, call the specific non-game method
        return this.saveNonGameLineup(lineup);
      }
      
      // For game lineups, use a transaction
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
        
        console.log(`MongoDB: Lineup save result - acknowledged: ${lineupResult.acknowledged}, upsertedCount: ${lineupResult.upsertedCount}, modifiedCount: ${lineupResult.modifiedCount}`);
        
        // Only if this is a game lineup
        if (lineup.gameId) {
          console.log(`MongoDB: This is a game lineup, checking game reference for gameId: ${lineup.gameId}`);
          // Update the game to reference this lineup
          const game = await this.gamesCollection.findOne({ id: lineup.gameId });
          
          if (game && !game.lineupId) {
            console.log(`MongoDB: Updating game to reference lineup ${lineup.id}`);
            await this.gamesCollection.updateOne(
              { id: lineup.gameId },
              { $set: { lineupId: lineup.id } },
              { session }
            );
          }
        }
        
        // Commit the transaction
        await session?.commitTransaction();
        console.log(`MongoDB: Successfully committed transaction for lineup save`);
        
        return lineupResult.acknowledged;
      } catch (error) {
        // Abort the transaction in case of error
        console.error(`MongoDB: Error during lineup save transaction:`, error);
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
   * Save a non-game lineup - simpler implementation without transactions
   * This is a more reliable method for non-game lineups that avoids transaction issues
   */
  async saveNonGameLineup(lineup: Lineup): Promise<boolean> {
    if (!this.lineupsCollection) {
      console.error('MongoDB: Lineups collection is not initialized when saving non-game lineup');
      throw new Error('Lineups collection is not initialized');
    }
    
    try {
      // Ensure this is a non-game lineup
      delete lineup.gameId;
      
      // Ensure all required fields
      if (!lineup.id || !lineup.teamId) {
        console.error(`MongoDB: Missing required fields for non-game lineup: id=${lineup.id}, teamId=${lineup.teamId}`);
        return false;
      }

      console.log(`MongoDB: Saving non-game lineup with direct method - ID: ${lineup.id}, name: ${lineup.name}, teamId: ${lineup.teamId}`);
      
      // Force the _id field to be the same as id to avoid duplicate documents
      const lineupWithId = {
        ...lineup,
        _id: lineup.id
      };
      
      // Use insertOne for new documents, updateOne for existing
      let lineupResult;
      try {
        // Check if document exists first
        const existingDoc = await this.lineupsCollection.findOne({ id: lineup.id });
        
        if (existingDoc) {
          console.log(`MongoDB: Updating existing non-game lineup with id: ${lineup.id}`);
          lineupResult = await this.lineupsCollection.updateOne(
            { id: lineup.id },
            { $set: lineup }
          );
        } else {
          console.log(`MongoDB: Creating new non-game lineup with id: ${lineup.id}`);
          // Use insertOne to create a new document
          lineupResult = await this.lineupsCollection.insertOne(lineupWithId);
        }
      } catch (dbError) {
        console.error('MongoDB specific error during non-game lineup save:', dbError);
        
        // Last resort fallback - try with regular updateOne + upsert
        console.log('MongoDB: Falling back to updateOne with upsert=true');
        lineupResult = await this.lineupsCollection.updateOne(
          { id: lineup.id },
          { $set: lineup },
          { upsert: true }
        );
      }
      
      console.log(`MongoDB: Non-game lineup direct save result:`, lineupResult);
      
      return lineupResult.acknowledged;
    } catch (error) {
      console.error('Failed to save non-game lineup with direct method:', error);
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      }
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
   * Get a user by auth token - using JWT verification instead of DB token lookup
   */
  async getUserByAuthToken(authToken: string): Promise<any | null> {
    try {
      console.log('MongoDB: Getting user by auth token using JWT verification');
      
      // Directly import auth service to avoid circular dependencies
      const { verify } = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET;
      
      if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return null;
      }
      
      // First verify the token cryptographically - this is the secure way
      let decoded;
      try {
        decoded = verify(authToken, JWT_SECRET) as { userId: string; email: string };
        console.log('MongoDB: JWT token verified successfully, userId:', decoded.userId);
      } catch (verifyError) {
        console.error('MongoDB: JWT token verification failed:', verifyError);
        return null;
      }
      
      if (!decoded || !decoded.userId) {
        console.error('MongoDB: JWT token invalid or missing userId');
        return null;
      }
      
      // Ensure connection and initialize collections
      await this.ensureConnection();
      
      if (!this.usersCollection) {
        console.error('MongoDB: Users collection not initialized after connection');
        return null;
      }
      
      // Get user by ID from the decoded token
      console.log(`MongoDB: Looking up user by ID: ${decoded.userId}`);
      
      // First, try to find the user directly through the Mongoose model
      // This handles ObjectId conversion automatically
      try {
        const { User } = await import('../../models/user');
        console.log(`MongoDB: Looking up user through Mongoose model with ID: ${decoded.userId}`);
        
        const mongooseUser = await User.findById(decoded.userId);
        if (mongooseUser) {
          console.log(`MongoDB: Found user through Mongoose: ${mongooseUser.email}`);
          return mongooseUser;
        }
      } catch (mongooseError) {
        console.error('MongoDB: Error finding user through Mongoose:', mongooseError);
      }
      
      // Fall back to direct collection access with multiple ID formats
      let user = await this.usersCollection.findOne({ _id: decoded.userId });
      
      // If not found by _id directly, try with ObjectId string
      if (!user) {
        console.log(`MongoDB: No user found with exact ID match, trying string ID`);
        user = await this.usersCollection.findOne({ _id: { $in: [decoded.userId, String(decoded.userId)] } });
      }
      
      // Try again with different field
      if (!user) {
        console.log(`MongoDB: Trying with 'id' field instead of '_id'`);
        user = await this.usersCollection.findOne({ id: decoded.userId });
      }
      
      // If still not found, try by email if available
      if (!user && decoded.email) {
        console.log(`MongoDB: No user found with ID, trying by email: ${decoded.email}`);
        user = await this.usersCollection.findOne({ email: decoded.email });
      }
      
      if (!user) {
        console.log(`MongoDB: No user found with ID or email: ${decoded.userId}, ${decoded.email || 'no email'}`);
      } else {
        console.log(`MongoDB: Found user: ${user.email}, ID: ${user._id}`);
      }
      
      return user;
    } catch (error) {
      console.error('MongoDB: Failed to get user by auth token:', error);
      return null;
    }
  }
  
  /**
   * Ensure MongoDB is connected and collections are initialized
   * @returns true if connected, false otherwise
   */
  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected && this.db && this.usersCollection) {
      return true;
    }
    
    return await this.connect();
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