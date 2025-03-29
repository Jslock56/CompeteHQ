/**
 * Storage Adapter Service
 * 
 * This service provides a unified interface for storage operations,
 * intelligently switching between MongoDB (online) and LocalStorage (offline)
 * based on network availability and configuration.
 */
'use server'; // Mark this module as server-only

import { Team } from '../../types/team';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { Practice } from '../../types/practice';
import { PositionHistory } from '../../types/position-history';
import { AppSettings } from '../../types/app-settings';

import { storageService as localStorageService } from '../storage/enhanced-storage';
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
  
  // Connection status
  isOnline(): Promise<boolean>;
  goOffline(): void;
  goOnline(): Promise<boolean>;
}

class StorageAdapter implements StorageInterface {
  private static instance: StorageAdapter;
  private isOfflineMode: boolean = false;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  // Get the singleton instance
  static getInstance(): StorageAdapter {
    if (!StorageAdapter.instance) {
      StorageAdapter.instance = new StorageAdapter();
    }
    return StorageAdapter.instance;
  }
  
  /**
   * Check if we're in offline mode
   */
  private async checkOfflineMode(): Promise<boolean> {
    // If offline mode is explicitly set, respect that
    if (this.isOfflineMode) return true;
    
    // Check settings for preferred mode
    const settings = await this.getSettings();
    if (settings?.preferOffline) {
      // For debugging: instead of forcing offline mode, log a message but try to use MongoDB
      console.log('preferOffline is set, but trying MongoDB connection anyway for player data');
    }
    
    // Try MongoDB connection
    return !mongoDBService.isConnectedToDatabase();
  }
  
  /**
   * Force offline mode
   */
  goOffline(): void {
    this.isOfflineMode = true;
  }
  
  /**
   * Try to go online
   */
  async goOnline(): Promise<boolean> {
    this.isOfflineMode = false;
    return await mongoDBService.connect();
  }
  
  /**
   * Check if online
   */
  async isOnline(): Promise<boolean> {
    return !(await this.checkOfflineMode());
  }
  
  /**
   * Team operations
   */
  
  async getAllTeams(): Promise<Team[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.team.getAllTeams();
    } else {
      try {
        return await mongoDBService.getAllTeams();
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.team.getAllTeams();
      }
    }
  }
  
  async getTeam(id: string): Promise<Team | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.team.getTeam(id);
    } else {
      try {
        return await mongoDBService.getTeam(id);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.team.getTeam(id);
      }
    }
  }
  
  async saveTeam(team: Team): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.team.saveTeam(team);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.saveTeam(team);
      } catch (error) {
        console.error('MongoDB error, data only saved locally:', error);
        return localSuccess;
      }
    }
  }
  
  async deleteTeam(id: string): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always delete from localStorage
    const localSuccess = localStorageService.team.deleteTeam(id);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also delete from MongoDB if online
        return await mongoDBService.deleteTeam(id);
      } catch (error) {
        console.error('MongoDB error, data only deleted locally:', error);
        return localSuccess;
      }
    }
  }
  
  /**
   * Player operations
   */
  
  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.player.getPlayersByTeam(teamId);
    } else {
      try {
        return await mongoDBService.getPlayersByTeam(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.player.getPlayersByTeam(teamId);
      }
    }
  }
  
  async getPlayer(id: string): Promise<Player | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.player.getPlayer(id);
    } else {
      try {
        return await mongoDBService.getPlayer(id);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.player.getPlayer(id);
      }
    }
  }
  
  async savePlayer(player: Player): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.player.savePlayer(player);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.savePlayer(player);
      } catch (error) {
        console.error('MongoDB error, data only saved locally:', error);
        return localSuccess;
      }
    }
  }
  
  async deletePlayer(id: string): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always delete from localStorage
    const localSuccess = localStorageService.player.deletePlayer(id);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also delete from MongoDB if online
        return await mongoDBService.deletePlayer(id);
      } catch (error) {
        console.error('MongoDB error, data only deleted locally:', error);
        return localSuccess;
      }
    }
  }
  
  /**
   * Game operations
   */
  
  async getGamesByTeam(teamId: string): Promise<Game[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.game.getGamesByTeam(teamId);
    } else {
      try {
        return await mongoDBService.getGamesByTeam(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.game.getGamesByTeam(teamId);
      }
    }
  }
  
  async getGame(id: string): Promise<Game | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.game.getGame(id);
    } else {
      try {
        return await mongoDBService.getGame(id);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.game.getGame(id);
      }
    }
  }
  
  async saveGame(game: Game): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.game.saveGame(game);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.saveGame(game);
      } catch (error) {
        console.error('MongoDB error, data only saved locally:', error);
        return localSuccess;
      }
    }
  }
  
  async deleteGame(id: string): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always delete from localStorage
    const localSuccess = localStorageService.game.deleteGame(id);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also delete from MongoDB if online
        return await mongoDBService.deleteGame(id);
      } catch (error) {
        console.error('MongoDB error, data only deleted locally:', error);
        return localSuccess;
      }
    }
  }
  
  async getUpcomingGames(teamId: string): Promise<Game[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.game.getUpcomingGames(teamId);
    } else {
      try {
        return await mongoDBService.getUpcomingGames(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.game.getUpcomingGames(teamId);
      }
    }
  }
  
  async getPastGames(teamId: string): Promise<Game[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.game.getPastGames(teamId);
    } else {
      try {
        return await mongoDBService.getPastGames(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.game.getPastGames(teamId);
      }
    }
  }
  
  /**
   * Lineup operations
   */
  
  async getLineup(id: string): Promise<Lineup | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.lineup.getLineup(id);
    } else {
      try {
        return await mongoDBService.getLineup(id);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.lineup.getLineup(id);
      }
    }
  }
  
  async getLineupByGame(gameId: string): Promise<Lineup | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.lineup.getLineupByGame(gameId);
    } else {
      try {
        return await mongoDBService.getLineupByGame(gameId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.lineup.getLineupByGame(gameId);
      }
    }
  }
  
  async getNonGameLineupsByTeam(teamId: string): Promise<Lineup[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.lineup.getNonGameLineupsByTeam(teamId);
    } else {
      try {
        return await mongoDBService.getNonGameLineupsByTeam(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.lineup.getNonGameLineupsByTeam(teamId);
      }
    }
  }
  
  async getDefaultTeamLineup(teamId: string): Promise<Lineup | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.lineup.getDefaultTeamLineup(teamId);
    } else {
      try {
        return await mongoDBService.getDefaultTeamLineup(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.lineup.getDefaultTeamLineup(teamId);
      }
    }
  }
  
  async setDefaultTeamLineup(lineupId: string, teamId: string): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.lineup.setDefaultTeamLineup(lineupId, teamId);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.setDefaultTeamLineup(lineupId, teamId);
      } catch (error) {
        console.error('MongoDB error, default lineup only set locally:', error);
        return localSuccess;
      }
    }
  }
  
  async saveLineup(lineup: Lineup): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.lineup.saveLineup(lineup);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.saveLineup(lineup);
      } catch (error) {
        console.error('MongoDB error, data only saved locally:', error);
        return localSuccess;
      }
    }
  }
  
  async deleteLineup(id: string): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always delete from localStorage
    const localSuccess = localStorageService.lineup.deleteLineup(id);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also delete from MongoDB if online
        return await mongoDBService.deleteLineup(id);
      } catch (error) {
        console.error('MongoDB error, data only deleted locally:', error);
        return localSuccess;
      }
    }
  }
  
  /**
   * Position history operations
   */
  
  async getPositionHistory(playerId: string): Promise<PositionHistory | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.positionHistory.getPositionHistory(playerId);
    } else {
      try {
        return await mongoDBService.getPositionHistory(playerId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.positionHistory.getPositionHistory(playerId);
      }
    }
  }
  
  async savePositionHistory(history: PositionHistory): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.positionHistory.savePositionHistory(history);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.savePositionHistory(history);
      } catch (error) {
        console.error('MongoDB error, data only saved locally:', error);
        return localSuccess;
      }
    }
  }
  
  async getTeamPositionHistories(teamId: string): Promise<PositionHistory[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.positionHistory.getTeamPositionHistories(teamId);
    } else {
      try {
        return await mongoDBService.getTeamPositionHistories(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.positionHistory.getTeamPositionHistories(teamId);
      }
    }
  }
  
  /**
   * Practice operations
   */
  
  async getPracticesByTeam(teamId: string): Promise<Practice[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.practice.getPracticesByTeam(teamId);
    } else {
      try {
        return await mongoDBService.getPracticesByTeam(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.practice.getPracticesByTeam(teamId);
      }
    }
  }
  
  async getPractice(id: string): Promise<Practice | null> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.practice.getPractice(id);
    } else {
      try {
        return await mongoDBService.getPractice(id);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.practice.getPractice(id);
      }
    }
  }
  
  async savePractice(practice: Practice): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always save to localStorage for offline access
    const localSuccess = localStorageService.practice.savePractice(practice);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also save to MongoDB if online
        return await mongoDBService.savePractice(practice);
      } catch (error) {
        console.error('MongoDB error, data only saved locally:', error);
        return localSuccess;
      }
    }
  }
  
  async deletePractice(id: string): Promise<boolean> {
    const offlineMode = await this.checkOfflineMode();
    
    // Always delete from localStorage
    const localSuccess = localStorageService.practice.deletePractice(id);
    
    if (offlineMode) {
      return localSuccess;
    } else {
      try {
        // Also delete from MongoDB if online
        return await mongoDBService.deletePractice(id);
      } catch (error) {
        console.error('MongoDB error, data only deleted locally:', error);
        return localSuccess;
      }
    }
  }
  
  async getUpcomingPractices(teamId: string): Promise<Practice[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.practice.getUpcomingPractices(teamId);
    } else {
      try {
        return await mongoDBService.getUpcomingPractices(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.practice.getUpcomingPractices(teamId);
      }
    }
  }
  
  async getPastPractices(teamId: string): Promise<Practice[]> {
    const offlineMode = await this.checkOfflineMode();
    
    if (offlineMode) {
      return localStorageService.practice.getPastPractices(teamId);
    } else {
      try {
        return await mongoDBService.getPastPractices(teamId);
      } catch (error) {
        console.error('MongoDB error, falling back to localStorage:', error);
        return localStorageService.practice.getPastPractices(teamId);
      }
    }
  }
  
  /**
   * Settings operations
   */
  
  async getSettings(): Promise<AppSettings | null> {
    try {
      return localStorageService.settings.getSettings();
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }
  
  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      return localStorageService.settings.saveSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
  
  /**
   * Sync data between local storage and MongoDB
   * Call this when going online after being offline
   */
  async syncData(): Promise<boolean> {
    // Implementation will depend on how you want to handle conflicts
    // This is a placeholder for future implementation
    console.log('Data sync not yet implemented');
    return false;
  }
}

// Export the singleton instance
export const storageAdapter = StorageAdapter.getInstance();
export default storageAdapter;