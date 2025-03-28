/**
 * Enhanced storage service with type-specific methods for each entity
 * This builds on top of the base local-storage service to provide more
 * targeted methods for working with specific entity types.
 */

import { localStorageService, STORAGE_KEYS } from './local-storage';
import type { Team } from '../../types/team';
import type { Player } from '../../types/player';
import type { Game } from '../../types/game';
import type { Lineup } from '../../types/lineup';
import type { PositionHistory } from '../../types/position-history';
import type { Practice } from '../../types/practice';
import type { AppSettings } from '../../types/app-settings';

/**
 * Team-related storage methods
 */
export const teamStorage = {
  /**
   * Get all team IDs
   */
  getAllTeamIds(): string[] {
    return localStorageService.getTeams();
  },

  /**
   * Get a team by ID
   */
  getTeam(teamId: string): Team | null {
    return localStorageService.getItem<Team>(`${STORAGE_KEYS.TEAM_PREFIX}${teamId}`);
  },

  /**
   * Get all teams
   */
  getAllTeams(): Team[] {
    const teamIds = this.getAllTeamIds();
    const teams: Team[] = [];
    
    for (const teamId of teamIds) {
      const team = this.getTeam(teamId);
      if (team) {
        teams.push(team);
      }
    }
    
    return teams;
  },

  /**
   * Save a team
   */
  saveTeam(team: Team): boolean {
    const success = localStorageService.setItem<Team>(
      `${STORAGE_KEYS.TEAM_PREFIX}${team.id}`, 
      team
    );
    
    if (success) {
      localStorageService.addTeam(team.id);
    }
    
    return success;
  },

  /**
   * Delete a team and all related data
   */
  deleteTeam(teamId: string): boolean {
    // Get all related entities first
    const playerIds = playerStorage.getPlayerIdsByTeam(teamId);
    const gameIds = gameStorage.getGameIdsByTeam(teamId);
    
    // Delete players
    for (const playerId of playerIds) {
      playerStorage.deletePlayer(playerId);
    }
    
    // Delete games and their lineups
    for (const gameId of gameIds) {
      gameStorage.deleteGame(gameId);
    }
    
    // Delete team
    localStorageService.removeTeam(teamId);
    return localStorageService.removeItem(`${STORAGE_KEYS.TEAM_PREFIX}${teamId}`);
  },

  /**
   * Get the current team ID
   */
  getCurrentTeamId(): string | null {
    return localStorageService.getCurrentTeam();
  },

  /**
   * Set the current team ID
   */
  setCurrentTeamId(teamId: string | null): boolean {
    return localStorageService.setCurrentTeam(teamId);
  }
};

/**
 * Player-related storage methods
 */
export const playerStorage = {
  /**
   * Get player IDs for a team
   */
  getPlayerIdsByTeam(teamId: string): string[] {
    return localStorageService.getTeamPlayers(teamId);
  },

  /**
   * Get a player by ID
   */
  getPlayer(playerId: string): Player | null {
    return localStorageService.getItem<Player>(`${STORAGE_KEYS.PLAYER_PREFIX}${playerId}`);
  },

  /**
   * Get all players for a team
   */
  getPlayersByTeam(teamId: string): Player[] {
    const playerIds = this.getPlayerIdsByTeam(teamId);
    const players: Player[] = [];
    
    for (const playerId of playerIds) {
      const player = this.getPlayer(playerId);
      if (player) {
        players.push(player);
      }
    }
    
    return players;
  },

  /**
   * Save a player
   */
  savePlayer(player: Player): boolean {
    const success = localStorageService.setItem<Player>(
      `${STORAGE_KEYS.PLAYER_PREFIX}${player.id}`, 
      player
    );
    
    if (success) {
      localStorageService.addPlayerToTeam(player.teamId, player.id);
    }
    
    return success;
  },

  /**
   * Delete a player
   */
  deletePlayer(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    
    if (player) {
      localStorageService.removePlayerFromTeam(player.teamId, playerId);
      
      // Delete any position history
      positionHistoryStorage.deletePositionHistory(playerId);
    }
    
    return localStorageService.removeItem(`${STORAGE_KEYS.PLAYER_PREFIX}${playerId}`);
  },

  /**
   * Delete all players for a team
   */
  deleteAllTeamPlayers(teamId: string): boolean {
    const playerIds = this.getPlayerIdsByTeam(teamId);
    let success = true;
    
    for (const playerId of playerIds) {
      const result = this.deletePlayer(playerId);
      if (!result) {
        success = false;
      }
    }
    
    return success;
  }
};

/**
 * Game-related storage methods
 */
export const gameStorage = {
  /**
   * Get game IDs for a team
   */
  getGameIdsByTeam(teamId: string): string[] {
    return localStorageService.getTeamGames(teamId);
  },

  /**
   * Get a game by ID
   */
  getGame(gameId: string): Game | null {
    return localStorageService.getItem<Game>(`${STORAGE_KEYS.GAME_PREFIX}${gameId}`);
  },

  /**
   * Get all games for a team
   */
  getGamesByTeam(teamId: string): Game[] {
    const gameIds = this.getGameIdsByTeam(teamId);
    const games: Game[] = [];
    
    for (const gameId of gameIds) {
      const game = this.getGame(gameId);
      if (game) {
        games.push(game);
      }
    }
    
    // Sort by date (most recent first)
    return games.sort((a, b) => b.date - a.date);
  },

  /**
   * Save a game
   */
  saveGame(game: Game): boolean {
    const success = localStorageService.setItem<Game>(
      `${STORAGE_KEYS.GAME_PREFIX}${game.id}`, 
      game
    );
    
    if (success) {
      localStorageService.addGameToTeam(game.teamId, game.id);
    }
    
    return success;
  },

  /**
   * Delete a game and its lineup
   */
  deleteGame(gameId: string): boolean {
    const game = this.getGame(gameId);
    
    if (game) {
      localStorageService.removeGameFromTeam(game.teamId, gameId);
      
      // Delete lineup if it exists
      if (game.lineupId) {
        lineupStorage.deleteLineup(game.lineupId);
      }
    }
    
    return localStorageService.removeItem(`${STORAGE_KEYS.GAME_PREFIX}${gameId}`);
  },

  /**
   * Get upcoming games for a team
   */
  getUpcomingGames(teamId: string): Game[] {
    const games = this.getGamesByTeam(teamId);
    const now = Date.now();
    
    return games
      .filter(game => game.date > now)
      .sort((a, b) => a.date - b.date);
  },

  /**
   * Get past games for a team
   */
  getPastGames(teamId: string): Game[] {
    const games = this.getGamesByTeam(teamId);
    const now = Date.now();
    
    return games
      .filter(game => game.date <= now)
      .sort((a, b) => b.date - a.date);
  }
};

/**
 * Lineup-related storage methods
 */
export const lineupStorage = {
  /**
   * Get a lineup by ID
   */
  getLineup(lineupId: string): Lineup | null {
    return localStorageService.getItem<Lineup>(`${STORAGE_KEYS.LINEUP_PREFIX}${lineupId}`);
  },

  /**
   * Get lineup by game ID
   */
  getLineupByGame(gameId: string): Lineup | null {
    const game = gameStorage.getGame(gameId);
    
    if (game && game.lineupId) {
      return this.getLineup(game.lineupId);
    }
    
    return null;
  },

  /**
   * Save a lineup
   */
  saveLineup(lineup: Lineup): boolean {
    // Update the game to reference this lineup if needed
    const game = gameStorage.getGame(lineup.gameId);
    
    if (game && !game.lineupId) {
      game.lineupId = lineup.id;
      gameStorage.saveGame(game);
    }
    
    // Save the lineup
    return localStorageService.setItem<Lineup>(
      `${STORAGE_KEYS.LINEUP_PREFIX}${lineup.id}`, 
      lineup
    );
  },

  /**
   * Delete a lineup
   */
  deleteLineup(lineupId: string): boolean {
    const lineup = this.getLineup(lineupId);
    
    if (lineup) {
      // Update the game to remove the lineup reference
      const game = gameStorage.getGame(lineup.gameId);
      
      if (game && game.lineupId === lineupId) {
        game.lineupId = undefined;
        gameStorage.saveGame(game);
      }
    }
    
    return localStorageService.removeItem(`${STORAGE_KEYS.LINEUP_PREFIX}${lineupId}`);
  }
};

/**
 * Position history storage methods
 */
export const positionHistoryStorage = {
  /**
   * Get position history for a player
   */
  getPositionHistory(playerId: string): PositionHistory | null {
    return localStorageService.getItem<PositionHistory>(
      `${STORAGE_KEYS.POSITION_HISTORY_PREFIX}${playerId}`
    );
  },

  /**
   * Save position history for a player
   */
  savePositionHistory(positionHistory: PositionHistory): boolean {
    return localStorageService.setItem<PositionHistory>(
      `${STORAGE_KEYS.POSITION_HISTORY_PREFIX}${positionHistory.playerId}`,
      positionHistory
    );
  },

  /**
   * Delete position history for a player
   */
  deletePositionHistory(playerId: string): boolean {
    return localStorageService.removeItem(`${STORAGE_KEYS.POSITION_HISTORY_PREFIX}${playerId}`);
  },

  /**
   * Get position histories for all players in a team
   */
  getTeamPositionHistories(teamId: string): PositionHistory[] {
    const playerIds = playerStorage.getPlayerIdsByTeam(teamId);
    const histories: PositionHistory[] = [];
    
    for (const playerId of playerIds) {
      const history = this.getPositionHistory(playerId);
      if (history) {
        histories.push(history);
      }
    }
    
    return histories;
  }
};

/**
 * Practice-related storage methods
 */
export const practiceStorage = {
  /**
   * Get practice IDs for a team
   */
  getPracticeIdsByTeam(teamId: string): string[] {
    return localStorageService.getItem<string[]>(
      `${STORAGE_KEYS.PRACTICES_BY_TEAM_PREFIX}${teamId}`
    ) || [];
  },

  /**
   * Get a practice by ID
   */
  getPractice(practiceId: string): Practice | null {
    return localStorageService.getItem<Practice>(`${STORAGE_KEYS.PRACTICE_PREFIX}${practiceId}`);
  },

  /**
   * Get all practices for a team
   */
  getPracticesByTeam(teamId: string): Practice[] {
    const practiceIds = this.getPracticeIdsByTeam(teamId);
    const practices: Practice[] = [];
    
    for (const practiceId of practiceIds) {
      const practice = this.getPractice(practiceId);
      if (practice) {
        practices.push(practice);
      }
    }
    
    // Sort by date (most recent first)
    return practices.sort((a, b) => b.date - a.date);
  },

  /**
   * Save a practice
   */
  savePractice(practice: Practice): boolean {
    const practiceIds = this.getPracticeIdsByTeam(practice.teamId);
    
    // Add to team's practices if not already there
    if (!practiceIds.includes(practice.id)) {
      practiceIds.push(practice.id);
      localStorageService.setItem<string[]>(
        `${STORAGE_KEYS.PRACTICES_BY_TEAM_PREFIX}${practice.teamId}`,
        practiceIds
      );
    }
    
    // Save the practice
    return localStorageService.setItem<Practice>(
      `${STORAGE_KEYS.PRACTICE_PREFIX}${practice.id}`,
      practice
    );
  },

  /**
   * Delete a practice
   */
  deletePractice(practiceId: string): boolean {
    const practice = this.getPractice(practiceId);
    
    if (practice) {
      // Remove from team's practices
      const practiceIds = this.getPracticeIdsByTeam(practice.teamId);
      const updatedIds = practiceIds.filter(id => id !== practiceId);
      
      localStorageService.setItem<string[]>(
        `${STORAGE_KEYS.PRACTICES_BY_TEAM_PREFIX}${practice.teamId}`,
        updatedIds
      );
    }
    
    return localStorageService.removeItem(`${STORAGE_KEYS.PRACTICE_PREFIX}${practiceId}`);
  },

  /**
   * Get upcoming practices for a team
   */
  getUpcomingPractices(teamId: string): Practice[] {
    const practices = this.getPracticesByTeam(teamId);
    const now = Date.now();
    
    return practices
      .filter(practice => practice.date > now)
      .sort((a, b) => a.date - b.date);
  },

  /**
   * Get past practices for a team
   */
  getPastPractices(teamId: string): Practice[] {
    const practices = this.getPracticesByTeam(teamId);
    const now = Date.now();
    
    return practices
      .filter(practice => practice.date <= now)
      .sort((a, b) => b.date - a.date);
  }
};

/**
 * App settings storage methods
 */
export const settingsStorage = {
  /**
   * Get app settings
   */
  getSettings(): AppSettings | null {
    return localStorageService.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
  },

  /**
   * Save app settings
   */
  saveSettings(settings: AppSettings): boolean {
    return localStorageService.setItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS, settings);
  },

  /**
   * Get the default app settings
   */
  getDefaultSettings(): AppSettings {
    return {
      currentTeamId: undefined,
      theme: 'light',
      preferOffline: false // Default to online mode to ensure MongoDB syncing
    };
  },

  /**
   * Get the current settings (or default if none exist)
   */
  getCurrentSettings(): AppSettings {
    return this.getSettings() || this.getDefaultSettings();
  }
};

// Export everything for easy access
export const storageService = {
  team: teamStorage,
  player: playerStorage,
  game: gameStorage,
  lineup: lineupStorage,
  positionHistory: positionHistoryStorage,
  practice: practiceStorage,
  settings: settingsStorage,
  raw: localStorageService
};

export default storageService;