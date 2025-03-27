/**
 * Sync Service
 * 
 * Provides functionality to synchronize data between local storage and MongoDB.
 * This is crucial for the offline-first experience, allowing users to work
 * offline and later sync their changes when they go back online.
 */

import { storageAdapter } from './storage-adapter';
import { localStorageService } from '../storage/enhanced-storage';
import { mongoDBService } from './mongodb';
import { Team } from '../../types/team';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { Practice } from '../../types/practice';
import { PositionHistory } from '../../types/position-history';

// Track sync state
interface SyncState {
  lastSyncTime: number;
  isSyncing: boolean;
  syncError: string | null;
  pendingChanges: Record<string, string[]>; // Entity type -> array of IDs
}

class SyncService {
  private static instance: SyncService;
  
  private state: SyncState = {
    lastSyncTime: 0,
    isSyncing: false,
    syncError: null,
    pendingChanges: {
      teams: [],
      players: [],
      games: [],
      lineups: [],
      practices: [],
      positionHistories: []
    }
  };
  
  // Private constructor for singleton pattern
  private constructor() {
    // Initialize sync state from localStorage if available
    this.loadSyncState();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }
  
  // Get the singleton instance
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }
  
  /**
   * Load sync state from localStorage
   */
  private loadSyncState(): void {
    try {
      const storedState = localStorage.getItem('competehq_sync_state');
      if (storedState) {
        this.state = JSON.parse(storedState);
      }
    } catch (error) {
      console.error('Error loading sync state:', error);
    }
  }
  
  /**
   * Save sync state to localStorage
   */
  private saveSyncState(): void {
    try {
      localStorage.setItem('competehq_sync_state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }
  
  /**
   * Handle going online
   */
  private async handleOnline(): Promise<void> {
    console.log('Device is online, checking for pending changes to sync');
    
    // Connect to MongoDB
    const connected = await mongoDBService.connect();
    
    if (connected) {
      // Attempt to sync any pending changes
      this.syncPendingChanges();
    }
  }
  
  /**
   * Handle going offline
   */
  private handleOffline(): void {
    console.log('Device is offline, switching to local storage');
    storageAdapter.goOffline();
  }
  
  /**
   * Check if we're online
   */
  async isOnline(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    
    // If we can't check navigator, try connecting to MongoDB
    return mongoDBService.isConnectedToDatabase();
  }
  
  /**
   * Add a pending change to be synced later
   */
  trackChange(entityType: 'teams' | 'players' | 'games' | 'lineups' | 'practices' | 'positionHistories', id: string): void {
    if (!this.state.pendingChanges[entityType]) {
      this.state.pendingChanges[entityType] = [];
    }
    
    if (!this.state.pendingChanges[entityType].includes(id)) {
      this.state.pendingChanges[entityType].push(id);
      this.saveSyncState();
    }
  }
  
  /**
   * Remove a tracked change after it's been synced
   */
  private removeTrackedChange(entityType: string, id: string): void {
    if (this.state.pendingChanges[entityType]) {
      this.state.pendingChanges[entityType] = this.state.pendingChanges[entityType].filter(itemId => itemId !== id);
      this.saveSyncState();
    }
  }
  
  /**
   * Get count of pending changes
   */
  getPendingChangesCount(): number {
    return Object.values(this.state.pendingChanges).reduce((total, changes) => total + changes.length, 0);
  }
  
  /**
   * Sync all pending changes
   */
  async syncPendingChanges(): Promise<boolean> {
    if (this.state.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }
    
    if (!await this.isOnline()) {
      console.log('Cannot sync while offline');
      return false;
    }
    
    try {
      this.state.isSyncing = true;
      this.state.syncError = null;
      this.saveSyncState();
      
      // Sync teams
      await this.syncEntityType('teams', 
        async (id) => localStorageService.team.getTeam(id),
        async (item) => mongoDBService.saveTeam(item as Team)
      );
      
      // Sync players
      await this.syncEntityType('players', 
        async (id) => localStorageService.player.getPlayer(id),
        async (item) => mongoDBService.savePlayer(item as Player)
      );
      
      // Sync games
      await this.syncEntityType('games', 
        async (id) => localStorageService.game.getGame(id),
        async (item) => mongoDBService.saveGame(item as Game)
      );
      
      // Sync lineups
      await this.syncEntityType('lineups', 
        async (id) => localStorageService.lineup.getLineup(id),
        async (item) => mongoDBService.saveLineup(item as Lineup)
      );
      
      // Sync practices
      await this.syncEntityType('practices', 
        async (id) => localStorageService.practice.getPractice(id),
        async (item) => mongoDBService.savePractice(item as Practice)
      );
      
      // Sync position histories
      await this.syncEntityType('positionHistories', 
        async (id) => localStorageService.positionHistory.getPositionHistory(id),
        async (item) => mongoDBService.savePositionHistory(item as PositionHistory)
      );
      
      // Update last sync time
      this.state.lastSyncTime = Date.now();
      this.saveSyncState();
      
      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      this.state.syncError = error instanceof Error ? error.message : String(error);
      this.saveSyncState();
      return false;
    } finally {
      this.state.isSyncing = false;
      this.saveSyncState();
    }
  }
  
  /**
   * Sync a specific type of entity
   */
  private async syncEntityType<T>(
    entityType: string,
    getter: (id: string) => Promise<T | null>,
    setter: (item: T) => Promise<boolean>
  ): Promise<void> {
    const pendingIds = this.state.pendingChanges[entityType] || [];
    
    for (const id of pendingIds) {
      try {
        const item = await getter(id);
        
        if (item) {
          const success = await setter(item);
          
          if (success) {
            this.removeTrackedChange(entityType, id);
          }
        } else {
          // Item not found in local storage, might have been deleted
          this.removeTrackedChange(entityType, id);
        }
      } catch (error) {
        console.error(`Error syncing ${entityType} item ${id}:`, error);
      }
    }
  }
  
  /**
   * Force a full sync of all data
   * This should be used sparingly as it's an expensive operation
   */
  async fullSync(): Promise<boolean> {
    if (!await this.isOnline()) {
      return false;
    }
    
    try {
      this.state.isSyncing = true;
      this.saveSyncState();
      
      // 1. Sync all teams
      const teams = localStorageService.team.getAllTeams();
      for (const team of teams) {
        await mongoDBService.saveTeam(team);
      }
      
      // For each team, sync all related data
      for (const team of teams) {
        // 2. Sync players
        const players = localStorageService.player.getPlayersByTeam(team.id);
        for (const player of players) {
          await mongoDBService.savePlayer(player);
        }
        
        // 3. Sync games
        const games = localStorageService.game.getGamesByTeam(team.id);
        for (const game of games) {
          await mongoDBService.saveGame(game);
          
          // 4. Sync lineups
          if (game.lineupId) {
            const lineup = localStorageService.lineup.getLineup(game.lineupId);
            if (lineup) {
              await mongoDBService.saveLineup(lineup);
            }
          }
        }
        
        // 5. Sync practices
        const practices = localStorageService.practice.getPracticesByTeam(team.id);
        for (const practice of practices) {
          await mongoDBService.savePractice(practice);
        }
        
        // 6. Sync position histories
        for (const player of players) {
          const history = localStorageService.positionHistory.getPositionHistory(player.id);
          if (history) {
            await mongoDBService.savePositionHistory(history);
          }
        }
      }
      
      // Clear all pending changes
      this.state.pendingChanges = {
        teams: [],
        players: [],
        games: [],
        lineups: [],
        practices: [],
        positionHistories: []
      };
      
      // Update last sync time
      this.state.lastSyncTime = Date.now();
      this.saveSyncState();
      
      return true;
    } catch (error) {
      console.error('Error during full sync:', error);
      this.state.syncError = error instanceof Error ? error.message : String(error);
      this.saveSyncState();
      return false;
    } finally {
      this.state.isSyncing = false;
      this.saveSyncState();
    }
  }
  
  /**
   * Download all data from MongoDB to local storage
   * Useful for initializing the app on a new device
   */
  async downloadAllData(): Promise<boolean> {
    if (!await this.isOnline()) {
      return false;
    }
    
    try {
      this.state.isSyncing = true;
      this.saveSyncState();
      
      // 1. Get all teams
      const teams = await mongoDBService.getAllTeams();
      
      // Save teams to localStorage
      for (const team of teams) {
        localStorageService.team.saveTeam(team);
      }
      
      // For each team, get all related data
      for (const team of teams) {
        // 2. Get and save players
        const players = await mongoDBService.getPlayersByTeam(team.id);
        for (const player of players) {
          localStorageService.player.savePlayer(player);
        }
        
        // 3. Get and save games
        const games = await mongoDBService.getGamesByTeam(team.id);
        for (const game of games) {
          localStorageService.game.saveGame(game);
          
          // 4. Get and save lineups
          if (game.lineupId) {
            const lineup = await mongoDBService.getLineup(game.lineupId);
            if (lineup) {
              localStorageService.lineup.saveLineup(lineup);
            }
          }
        }
        
        // 5. Get and save practices
        const practices = await mongoDBService.getPracticesByTeam(team.id);
        for (const practice of practices) {
          localStorageService.practice.savePractice(practice);
        }
        
        // 6. Get and save position histories
        for (const player of players) {
          const history = await mongoDBService.getPositionHistory(player.id);
          if (history) {
            localStorageService.positionHistory.savePositionHistory(history);
          }
        }
      }
      
      // Update last sync time
      this.state.lastSyncTime = Date.now();
      this.saveSyncState();
      
      return true;
    } catch (error) {
      console.error('Error during data download:', error);
      this.state.syncError = error instanceof Error ? error.message : String(error);
      this.saveSyncState();
      return false;
    } finally {
      this.state.isSyncing = false;
      this.saveSyncState();
    }
  }
  
  /**
   * Get the current sync state
   */
  getSyncState(): SyncState {
    return { ...this.state };
  }
}

// Export the singleton instance
export const syncService = SyncService.getInstance();
export default syncService;