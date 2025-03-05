/**
 * Custom hook for game management
 * Provides methods for creating, reading, updating, and deleting games
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storage/enhanced-storage';
import { Game } from '../types/game';
import { useTeamContext } from '../contexts/team-context';

/**
 * Result from the useGames hook
 */
interface UseGamesResult {
  /**
   * All games for the current team
   */
  games: Game[];
  
  /**
   * Upcoming games (games with dates in the future)
   */
  upcomingGames: Game[];
  
  /**
   * Past games (games with dates in the past)
   */
  pastGames: Game[];
  
  /**
   * Is data still loading
   */
  isLoading: boolean;
  
  /**
   * Error message (if any)
   */
  error: string | null;
  
  /**
   * Create a new game
   */
  createGame: (gameData: Omit<Game, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>) => Game;
  
  /**
   * Update an existing game
   */
  updateGame: (game: Game) => boolean;
  
  /**
   * Delete a game
   */
  deleteGame: (gameId: string) => boolean;
  
  /**
   * Get a single game by ID
   */
  getGame: (gameId: string) => Game | null;
  
  /**
   * Reload game data from storage
   */
  refreshGames: () => void;
}

/**
 * Hook for managing games for the current team
 */
export function useGames(): UseGamesResult {
  const { currentTeam } = useTeamContext();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load all games for the current team
   */
  const loadGames = useCallback(() => {
    if (!currentTeam) {
      setGames([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const teamGames = storageService.game.getGamesByTeam(currentTeam.id);
      setGames(teamGames);
      setError(null);
    } catch (err) {
      setError('Failed to load games: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);
  
  /**
   * Get a single game by ID
   */
  const getGame = useCallback((gameId: string): Game | null => {
    return storageService.game.getGame(gameId);
  }, []);
  
  /**
   * Create a new game
   */
  const createGame = useCallback((gameData: Omit<Game, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>): Game => {
    if (!currentTeam) {
      throw new Error('No team selected');
    }
    
    const now = Date.now();
    
    const newGame: Game = {
      id: uuidv4(),
      teamId: currentTeam.id,
      ...gameData,
      createdAt: now,
      updatedAt: now
    };
    
    const success = storageService.game.saveGame(newGame);
    
    if (!success) {
      throw new Error('Failed to save game');
    }
    
    // Refresh the games list
    loadGames();
    
    return newGame;
  }, [currentTeam, loadGames]);
  
  /**
   * Update an existing game
   */
  const updateGame = useCallback((game: Game): boolean => {
    // Update the timestamp
    const updatedGame: Game = {
      ...game,
      updatedAt: Date.now()
    };
    
    const success = storageService.game.saveGame(updatedGame);
    
    if (success) {
      // Update local state
      setGames(prevGames => 
        prevGames.map(g => 
          g.id === game.id ? updatedGame : g
        )
      );
    }
    
    return success;
  }, []);
  
  /**
   * Delete a game
   */
  const deleteGame = useCallback((gameId: string): boolean => {
    const success = storageService.game.deleteGame(gameId);
    
    if (success) {
      // Update local state
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
    }
    
    return success;
  }, []);
  
  // Get upcoming and past games
  const now = Date.now();
  const upcomingGames = games.filter(game => game.date > now)
    .sort((a, b) => a.date - b.date); // Sort by date ascending
  
  const pastGames = games.filter(game => game.date <= now)
    .sort((a, b) => b.date - a.date); // Sort by date descending (most recent first)
  
  // Load games on initial mount and when current team changes
  useEffect(() => {
    loadGames();
  }, [loadGames]);
  
  return {
    games,
    upcomingGames,
    pastGames,
    isLoading,
    error,
    createGame,
    updateGame,
    deleteGame,
    getGame,
    refreshGames: loadGames
  };
}

/**
 * Hook for managing a single game
 * @param gameId - ID of the game to manage
 */
export function useSingleGame(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load game data
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const gameData = storageService.game.getGame(gameId);
      setGame(gameData);
      setError(null);
    } catch (err) {
      setError('Failed to load game: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);
  
  /**
   * Update the game
   */
  const updateGame = useCallback((updatedGame: Game): boolean => {
    if (!updatedGame) return false;
    
    // Update timestamp
    const gameWithTimestamp: Game = {
      ...updatedGame,
      updatedAt: Date.now()
    };
    
    const success = storageService.game.saveGame(gameWithTimestamp);
    
    if (success) {
      setGame(gameWithTimestamp);
    }
    
    return success;
  }, []);
  
  /**
   * Refresh game data from storage
   */
  const refreshGame = useCallback(() => {
    if (!gameId) return;
    
    try {
      const gameData = storageService.game.getGame(gameId);
      setGame(gameData);
      setError(null);
    } catch (err) {
      setError('Failed to refresh game: ' + String(err));
    }
  }, [gameId]);
  
  return {
    game,
    isLoading,
    error,
    updateGame,
    refreshGame
  };
}

export default useGames;