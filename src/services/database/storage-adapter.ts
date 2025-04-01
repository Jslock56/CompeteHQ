/**
 * Storage Adapter Service
 * 
 * This service provides a unified interface for storage operations using MongoDB.
 * All data is stored exclusively in MongoDB as this is a cloud-based application.
 */
'use server'; // Mark this module as server-only

import { Team } from '../../types/team';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { Practice } from '../../types/practice';
import { PositionHistory } from '../../types/position-history';
import { AppSettings } from '../../types/app-settings';

// Only using MongoDB for storage
import { mongoDBService } from './mongodb';

// Interface for storage methods
export interface StorageInterface {
  // Team operations
  getAllTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | null>;
  saveTeam(team: Team): Promise<boolean>;
  deleteTeam(id: string): Promise<boolean>;
  
  // Player operations
  getPlayersByTeam(teamId: string): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | null>;
  savePlayer(player: Player): Promise<boolean>;
  deletePlayer(id: string): Promise<boolean>;
  
  // Game operations
  getGamesByTeam(teamId: string): Promise<Game[]>;
  getGame(id: string): Promise<Game | null>;
  saveGame(game: Game): Promise<boolean>;
  deleteGame(id: string): Promise<boolean>;
  getUpcomingGames(teamId: string): Promise<Game[]>;
  getPastGames(teamId: string): Promise<Game[]>;
  
  // Lineup operations
  getLineup(id: string): Promise<Lineup | null>;
  getLineupByGame(gameId: string): Promise<Lineup | null>;
  getNonGameLineupsByTeam(teamId: string): Promise<Lineup[]>;
  getDefaultTeamLineup(teamId: string): Promise<Lineup | null>;
  setDefaultTeamLineup(lineupId: string, teamId: string): Promise<boolean>;
  saveLineup(lineup: Lineup): Promise<boolean>;
  deleteLineup(id: string): Promise<boolean>;
  
  // Position history operations
  getPositionHistory(playerId: string): Promise<PositionHistory | null>;
  savePositionHistory(history: PositionHistory): Promise<boolean>;
  getTeamPositionHistories(teamId: string): Promise<PositionHistory[]>;
  
  // Practice operations
  getPracticesByTeam(teamId: string): Promise<Practice[]>;
  getPractice(id: string): Promise<Practice | null>;
  savePractice(practice: Practice): Promise<boolean>;
  deletePractice(id: string): Promise<boolean>;
  getUpcomingPractices(teamId: string): Promise<Practice[]>;
  getPastPractices(teamId: string): Promise<Practice[]>;
  
  // Settings
  getSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<boolean>;
  
  // Database connection status
  isDatabaseConnected(): Promise<boolean>;
  connectToDatabase(): Promise<boolean>;
}

class StorageAdapter implements StorageInterface {
  private static instance: StorageAdapter;
  
  // Private constructor for singleton pattern
  private constructor() {
    // Initialize MongoDB connection on startup
    this.connectToDatabase().catch(error => {
      console.error('Failed to connect to MongoDB during initialization:', error);
    });
  }
  
  // Get the singleton instance
  static getInstance(): StorageAdapter {
    if (!StorageAdapter.instance) {
      StorageAdapter.instance = new StorageAdapter();
    }
    return StorageAdapter.instance;
  }
  
  /**
   * Check if connected to MongoDB
   */
  async isDatabaseConnected(): Promise<boolean> {
    const isConnected = mongoDBService.isConnectedToDatabase();
    console.log('MongoDB connection status:', isConnected ? 'Connected' : 'Not connected');
    return isConnected;
  }
  
  /**
   * Connect to MongoDB database
   */
  async connectToDatabase(): Promise<boolean> {
    console.log('Connecting to MongoDB database...');
    try {
      const result = await mongoDBService.connect();
      if (result) {
        console.log('Successfully connected to MongoDB');
      } else {
        console.error('Failed to connect to MongoDB');
      }
      return result;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      return false;
    }
  }
  
  /**
   * Team operations
   */
  
  async getAllTeams(): Promise<Team[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getAllTeams();
    } catch (error) {
      console.error('MongoDB error getting all teams:', error);
      throw new Error('Failed to get teams from database');
    }
  }
  
  async getTeam(id: string): Promise<Team | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getTeam(id);
    } catch (error) {
      console.error(`MongoDB error getting team ${id}:`, error);
      throw new Error('Failed to get team from database');
    }
  }
  
  async saveTeam(team: Team): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.saveTeam(team);
    } catch (error) {
      console.error(`MongoDB error saving team ${team.id}:`, error);
      throw new Error('Failed to save team to database');
    }
  }
  
  async deleteTeam(id: string): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.deleteTeam(id);
    } catch (error) {
      console.error(`MongoDB error deleting team ${id}:`, error);
      throw new Error('Failed to delete team from database');
    }
  }
  
  /**
   * Player operations
   */
  
  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPlayersByTeam(teamId);
    } catch (error) {
      console.error(`MongoDB error getting players for team ${teamId}:`, error);
      throw new Error('Failed to get players from database');
    }
  }
  
  async getPlayer(id: string): Promise<Player | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPlayer(id);
    } catch (error) {
      console.error(`MongoDB error getting player ${id}:`, error);
      throw new Error('Failed to get player from database');
    }
  }
  
  async savePlayer(player: Player): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.savePlayer(player);
    } catch (error) {
      console.error(`MongoDB error saving player ${player.id}:`, error);
      throw new Error('Failed to save player to database');
    }
  }
  
  async deletePlayer(id: string): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.deletePlayer(id);
    } catch (error) {
      console.error(`MongoDB error deleting player ${id}:`, error);
      throw new Error('Failed to delete player from database');
    }
  }
  
  /**
   * Game operations
   */
  
  async getGamesByTeam(teamId: string): Promise<Game[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getGamesByTeam(teamId);
    } catch (error) {
      console.error(`MongoDB error getting games for team ${teamId}:`, error);
      throw new Error('Failed to get games from database');
    }
  }
  
  async getGame(id: string): Promise<Game | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getGame(id);
    } catch (error) {
      console.error(`MongoDB error getting game ${id}:`, error);
      throw new Error('Failed to get game from database');
    }
  }
  
  async saveGame(game: Game): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.saveGame(game);
    } catch (error) {
      console.error(`MongoDB error saving game ${game.id}:`, error);
      throw new Error('Failed to save game to database');
    }
  }
  
  async deleteGame(id: string): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.deleteGame(id);
    } catch (error) {
      console.error(`MongoDB error deleting game ${id}:`, error);
      throw new Error('Failed to delete game from database');
    }
  }
  
  async getUpcomingGames(teamId: string): Promise<Game[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getUpcomingGames(teamId);
    } catch (error) {
      console.error(`MongoDB error getting upcoming games for team ${teamId}:`, error);
      throw new Error('Failed to get upcoming games from database');
    }
  }
  
  async getPastGames(teamId: string): Promise<Game[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPastGames(teamId);
    } catch (error) {
      console.error(`MongoDB error getting past games for team ${teamId}:`, error);
      throw new Error('Failed to get past games from database');
    }
  }
  
  /**
   * Lineup operations
   */
  
  async getLineup(id: string): Promise<Lineup | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getLineup(id);
    } catch (error) {
      console.error(`MongoDB error getting lineup ${id}:`, error);
      throw new Error('Failed to get lineup from database');
    }
  }
  
  async getLineupByGame(gameId: string): Promise<Lineup | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getLineupByGame(gameId);
    } catch (error) {
      console.error(`MongoDB error getting lineup for game ${gameId}:`, error);
      throw new Error('Failed to get lineup from database');
    }
  }
  
  async getNonGameLineupsByTeam(teamId: string): Promise<Lineup[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getNonGameLineupsByTeam(teamId);
    } catch (error) {
      console.error(`MongoDB error getting non-game lineups for team ${teamId}:`, error);
      throw new Error('Failed to get lineups from database');
    }
  }
  
  async getDefaultTeamLineup(teamId: string): Promise<Lineup | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getDefaultTeamLineup(teamId);
    } catch (error) {
      console.error(`MongoDB error getting default lineup for team ${teamId}:`, error);
      throw new Error('Failed to get default lineup from database');
    }
  }
  
  async setDefaultTeamLineup(lineupId: string, teamId: string): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.setDefaultTeamLineup(lineupId, teamId);
    } catch (error) {
      console.error(`MongoDB error setting default lineup ${lineupId} for team ${teamId}:`, error);
      throw new Error('Failed to set default lineup in database');
    }
  }
  
  async saveLineup(lineup: Lineup): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.saveLineup(lineup);
    } catch (error) {
      console.error(`MongoDB error saving lineup ${lineup.id}:`, error);
      throw new Error('Failed to save lineup to database');
    }
  }
  
  async deleteLineup(id: string): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.deleteLineup(id);
    } catch (error) {
      console.error(`MongoDB error deleting lineup ${id}:`, error);
      throw new Error('Failed to delete lineup from database');
    }
  }
  
  /**
   * Position history operations
   */
  
  async getPositionHistory(playerId: string): Promise<PositionHistory | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPositionHistory(playerId);
    } catch (error) {
      console.error(`MongoDB error getting position history for player ${playerId}:`, error);
      throw new Error('Failed to get position history from database');
    }
  }
  
  async savePositionHistory(history: PositionHistory): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.savePositionHistory(history);
    } catch (error) {
      console.error(`MongoDB error saving position history for player ${history.playerId}:`, error);
      throw new Error('Failed to save position history to database');
    }
  }
  
  async getTeamPositionHistories(teamId: string): Promise<PositionHistory[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getTeamPositionHistories(teamId);
    } catch (error) {
      console.error(`MongoDB error getting position histories for team ${teamId}:`, error);
      throw new Error('Failed to get position histories from database');
    }
  }
  
  /**
   * Practice operations
   */
  
  async getPracticesByTeam(teamId: string): Promise<Practice[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPracticesByTeam(teamId);
    } catch (error) {
      console.error(`MongoDB error getting practices for team ${teamId}:`, error);
      throw new Error('Failed to get practices from database');
    }
  }
  
  async getPractice(id: string): Promise<Practice | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPractice(id);
    } catch (error) {
      console.error(`MongoDB error getting practice ${id}:`, error);
      throw new Error('Failed to get practice from database');
    }
  }
  
  async savePractice(practice: Practice): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.savePractice(practice);
    } catch (error) {
      console.error(`MongoDB error saving practice ${practice.id}:`, error);
      throw new Error('Failed to save practice to database');
    }
  }
  
  async deletePractice(id: string): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.deletePractice(id);
    } catch (error) {
      console.error(`MongoDB error deleting practice ${id}:`, error);
      throw new Error('Failed to delete practice from database');
    }
  }
  
  async getUpcomingPractices(teamId: string): Promise<Practice[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getUpcomingPractices(teamId);
    } catch (error) {
      console.error(`MongoDB error getting upcoming practices for team ${teamId}:`, error);
      throw new Error('Failed to get upcoming practices from database');
    }
  }
  
  async getPastPractices(teamId: string): Promise<Practice[]> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      return await mongoDBService.getPastPractices(teamId);
    } catch (error) {
      console.error(`MongoDB error getting past practices for team ${teamId}:`, error);
      throw new Error('Failed to get past practices from database');
    }
  }
  
  /**
   * Settings operations
   * 
   * Note: For now, we're using a simple MongoDB collection for settings.
   * In the future, we may want to create a more robust settings service that includes user preferences.
   */
  
  async getSettings(): Promise<AppSettings | null> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      
      // Get the current user ID from the authenticated session
      const db = await mongoDBService.getClient()?.db();
      if (!db) {
        throw new Error('Database not available');
      }
      
      // Use the session collection to get the current user
      const session = await db.collection('sessions').findOne(
        { expires: { $gt: new Date() } }
      );
      
      const userId = session?.userId;
      
      // If no user found, return default settings
      if (!userId) {
        return {
          theme: 'light',
          defaultInnings: 7,
          emailNotifications: true
        };
      }
      
      // Get user-specific settings
      const userSettings = await db.collection('userSettings').findOne({ userId });
      
      if (!userSettings) {
        // Create default settings for this user
        const defaultSettings = {
          userId,
          theme: 'light',
          defaultInnings: 7,
          emailNotifications: true,
          updatedAt: Date.now()
        };
        
        // Save default settings
        await db.collection('userSettings').insertOne(defaultSettings);
        
        return defaultSettings;
      }
      
      return userSettings as AppSettings;
    } catch (error) {
      console.error('Error getting settings from MongoDB:', error);
      // Return default settings on error
      return {
        theme: 'light',
        defaultInnings: 7,
        emailNotifications: true
      };
    }
  }
  
  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      if (!await this.isDatabaseConnected()) {
        await this.connectToDatabase();
      }
      
      // Get database connection
      const db = await mongoDBService.getClient()?.db();
      if (!db) {
        throw new Error('Database not available');
      }
      
      // Get the current user ID from the authenticated session
      const session = await db.collection('sessions').findOne(
        { expires: { $gt: new Date() } }
      );
      
      const userId = session?.userId;
      
      // If no user found, we can't save settings
      if (!userId) {
        console.warn('Cannot save settings: No authenticated user found');
        return false;
      }
      
      // Add timestamp and user ID
      const settingsToSave = {
        ...settings,
        userId,
        updatedAt: Date.now()
      };
      
      // Save to userSettings collection
      const result = await db.collection('userSettings').updateOne(
        { userId },
        { $set: settingsToSave },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Error saving settings to MongoDB:', error);
      return false;
    }
  }
}

// Export the singleton instance
export const storageAdapter = StorageAdapter.getInstance();
export default storageAdapter;