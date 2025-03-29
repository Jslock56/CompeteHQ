// src/services/storage/local-storage.ts
export const STORAGE_KEYS = {
    CURRENT_TEAM: 'competehq_current_team',
    TEAMS: 'competehq_teams', // Array of team IDs
    TEAM_PREFIX: 'competehq_team_', // + teamId
    PLAYER_PREFIX: 'competehq_player_', // + playerId
    PLAYERS_BY_TEAM_PREFIX: 'competehq_players_team_', // + teamId
    GAME_PREFIX: 'competehq_game_', // + gameId
    GAMES_BY_TEAM_PREFIX: 'competehq_games_team_', // + teamId
    LINEUP_PREFIX: 'competehq_lineup_', // + lineupId
    LINEUPS_BY_GAME_PREFIX: 'competehq_lineups_game_', // + gameId
    POSITION_HISTORY_PREFIX: 'competehq_positions_', // + playerId
    PRACTICE_PREFIX: 'competehq_practice_', // + practiceId
    PRACTICES_BY_TEAM_PREFIX: 'competehq_practices_team_', // + teamId
    APP_SETTINGS: 'competehq_settings'
  };
  
  class LocalStorageService {
    private isAvailable: boolean;
  
    constructor() {
      this.isAvailable = this.checkAvailability();
    }
  
    private checkAvailability(): boolean {
      // Check if window is defined (client-side)
      if (typeof window === 'undefined') {
        return false;
      }
      
      // Check if localStorage is available
      const testKey = '__test__';
      try {
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        
        // Setup storage event listener for cross-tab sync
        if (!this.hasSetupListeners) {
          window.addEventListener('storage', (event) => {
            console.log('Storage event:', event.key, event.newValue);
            
            // Dispatch custom events for specific keys
            if (event.key === STORAGE_KEYS.CURRENT_TEAM) {
              console.log('Current team changed in another tab, dispatching event');
              window.dispatchEvent(new CustomEvent('team-changed', { 
                detail: { teamId: JSON.parse(event.newValue || 'null') } 
              }));
            }
          });
          this.hasSetupListeners = true;
        }
        
        return true;
      } catch (e: unknown) {
        console.error('Error checking localStorage availability:', e);
        return false;
      }
    }
    
    // Track if we've already set up event listeners
    private hasSetupListeners = false;
  
    public getItem<T>(key: string): T | null {
      if (!this.isAvailable) return null;
      
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Error getting item from localStorage:', e);
        return null;
      }
    }
  
    public setItem<T>(key: string, value: T): boolean {
      if (!this.isAvailable) return false;
      
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error setting item in localStorage:', e);
        return false;
      }
    }
  
    public removeItem(key: string): boolean {
      if (!this.isAvailable) return false;
      
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('Error removing item from localStorage:', e);
        return false;
      }
    }
  
    public clear(): boolean {
      if (!this.isAvailable) return false;
      
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('Error clearing localStorage:', e);
        return false;
      }
    }
    
    /**
     * Get all items from localStorage
     */
    public getAllItems(): Record<string, any> {
      if (!this.isAvailable) return {};
      
      try {
        const items: Record<string, any> = {};
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              try {
                items[key] = JSON.parse(value);
              } catch {
                items[key] = value;
              }
            }
          }
        }
        
        return items;
      } catch (e) {
        console.error('Error getting all items from localStorage:', e);
        return {};
      }
    }
  
    // Helper methods for specific entities
    
    // Teams
    public getTeams(): string[] {
      return this.getItem<string[]>(STORAGE_KEYS.TEAMS) || [];
    }
    
    public addTeam(teamId: string): boolean {
      const teams = this.getTeams();
      if (!teams.includes(teamId)) {
        teams.push(teamId);
        return this.setItem(STORAGE_KEYS.TEAMS, teams);
      }
      return true;
    }
    
    public removeTeam(teamId: string): boolean {
      const teams = this.getTeams();
      const newTeams = teams.filter(id => id !== teamId);
      return this.setItem(STORAGE_KEYS.TEAMS, newTeams);
    }
    
    // Team players
    public getTeamPlayers(teamId: string): string[] {
      return this.getItem<string[]>(STORAGE_KEYS.PLAYERS_BY_TEAM_PREFIX + teamId) || [];
    }
    
    public addPlayerToTeam(teamId: string, playerId: string): boolean {
      const players = this.getTeamPlayers(teamId);
      if (!players.includes(playerId)) {
        players.push(playerId);
        return this.setItem(STORAGE_KEYS.PLAYERS_BY_TEAM_PREFIX + teamId, players);
      }
      return true;
    }
    
    public removePlayerFromTeam(teamId: string, playerId: string): boolean {
      const players = this.getTeamPlayers(teamId);
      const newPlayers = players.filter(id => id !== playerId);
      return this.setItem(STORAGE_KEYS.PLAYERS_BY_TEAM_PREFIX + teamId, newPlayers);
    }
    
    // Team games
    public getTeamGames(teamId: string): string[] {
      return this.getItem<string[]>(STORAGE_KEYS.GAMES_BY_TEAM_PREFIX + teamId) || [];
    }
    
    public addGameToTeam(teamId: string, gameId: string): boolean {
      const games = this.getTeamGames(teamId);
      if (!games.includes(gameId)) {
        games.push(gameId);
        return this.setItem(STORAGE_KEYS.GAMES_BY_TEAM_PREFIX + teamId, games);
      }
      return true;
    }
    
    public removeGameFromTeam(teamId: string, gameId: string): boolean {
      const games = this.getTeamGames(teamId);
      const newGames = games.filter(id => id !== gameId);
      return this.setItem(STORAGE_KEYS.GAMES_BY_TEAM_PREFIX + teamId, newGames);
    }
    
    // Current team
    public getCurrentTeam(): string | null {
      return this.getItem<string>(STORAGE_KEYS.CURRENT_TEAM);
    }
    
    public setCurrentTeam(teamId: string | null): boolean {
      let result: boolean;
      
      if (teamId === null) {
        result = this.removeItem(STORAGE_KEYS.CURRENT_TEAM);
      } else {
        result = this.setItem(STORAGE_KEYS.CURRENT_TEAM, teamId);
      }
      
      // If successful, dispatch a team-changed event to ensure UI updates
      if (result && typeof window !== 'undefined') {
        console.log('Dispatching team-changed event after setting current team to:', teamId);
        window.dispatchEvent(new CustomEvent('team-changed', { 
          detail: { teamId } 
        }));
      }
      
      return result;
    }
  }
  
  // Singleton pattern
  export const localStorageService = new LocalStorageService();