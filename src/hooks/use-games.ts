/**
 * Custom hook for game management
 * Provides methods for creating, reading, updating, and deleting games
 * This module exclusively uses MongoDB for data storage via API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageAdapter } from '../services/database/storage-adapter';
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
   * Load all games for the current team from MongoDB via API
   */
  const loadGames = useCallback(async () => {
    if (!currentTeam) {
      setGames([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use the team-specific endpoint to load games
      try {
        console.log(`Loading games for team ${currentTeam.id} from API...`);
        const response = await fetch(`/api/teams/${currentTeam.id}/games`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.games)) {
            console.log(`Loaded ${data.games.length} games for team ${currentTeam.id} from API`);
            
            // Process games to ensure dates are numbers/timestamps
            const processedGames = data.games.map((game: Game) => {
              // Ensure date is a timestamp/number for consistent comparison
              if (game.date && typeof game.date !== 'number') {
                try {
                  // If it's a string or Date object, convert to timestamp
                  game.date = new Date(game.date).getTime();
                } catch (e) {
                  console.error(`Failed to convert date for game ${game.id}:`, e);
                }
              }
              return game;
            });
            
            setGames(processedGames);
            
            // For debugging only
            processedGames.forEach((game: Game) => {
              console.log(`Game loaded - ID: ${game.id}, Team: ${game.teamId}, Opponent: ${game.opponent}, Date: ${game.date}, Human date: ${new Date(game.date).toLocaleString()}`);
            });
            
            setError(null);
            setIsLoading(false);
            return;
          } else {
            console.warn('API response was OK but data format was unexpected:', data);
          }
        } else {
          console.warn(`API returned status ${response.status} when loading games for team ${currentTeam.id}`);
          setError(`Failed to load games: Server returned ${response.status}`);
        }
      } catch (apiError) {
        console.error(`Failed to load games for team ${currentTeam.id} from API:`, apiError);
        setError(`Failed to load games: ${apiError.message || 'Network error'}`);
      }
    } catch (err) {
      setError('Failed to load games: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);
  
  /**
   * Get a single game by ID from MongoDB via API
   */
  const getGame = useCallback(async (gameId: string): Promise<Game | null> => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.game) {
          console.log(`Loaded game ${gameId} from API`, {
            gameId: data.game.id,
            innings: data.game.innings,
            inningsType: typeof data.game.innings
          });
          
          return data.game;
        } else {
          console.warn('API response was OK but data format was unexpected:', data);
        }
      } else {
        console.warn(`API returned status ${response.status} when loading game ${gameId}`);
        throw new Error(`Failed to load game: Server returned ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
    
    return null;
  }, []);
  
  /**
   * Create a new game in MongoDB via API
   */
  const createGame = useCallback(async (gameData: Omit<Game, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>): Promise<Game> => {
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
    
    // Create game via the team-specific API endpoint
    try {
      console.log(`Creating game for team ${currentTeam.id} via API...`);
      const response = await fetch(`/api/teams/${currentTeam.id}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game: newGame }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.game) {
          console.log(`Successfully created game ${data.game.id} via API`);
          
          // Refresh the games list
          loadGames();
          
          return data.game;
        } else {
          console.warn('API response was OK but data format was unexpected:', data);
          throw new Error('Failed to create game: Unexpected data format');
        }
      } else {
        console.warn(`API returned status ${response.status} when creating game`);
        throw new Error(`Failed to create game: Server returned ${response.status}`);
      }
    } catch (apiError) {
      console.error('Failed to create game via API:', apiError);
      throw apiError;
    }
  }, [currentTeam, loadGames]);
  
  /**
   * Update an existing game in MongoDB via API
   */
  const updateGame = useCallback(async (game: Game): Promise<boolean> => {
    // Update the timestamp
    const updatedGame: Game = {
      ...game,
      updatedAt: Date.now()
    };
    
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game: updatedGame }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.game) {
          console.log(`Successfully updated game ${game.id} via API`);
          
          // Update local state
          setGames(prevGames => 
            prevGames.map(g => 
              g.id === game.id ? data.game : g
            )
          );
          
          return true;
        } else {
          console.warn('API response was OK but data format was unexpected:', data);
          return false;
        }
      } else {
        console.warn(`API returned status ${response.status} when updating game ${game.id}`);
        return false;
      }
    } catch (apiError) {
      console.error(`Failed to update game ${game.id} via API:`, apiError);
      return false;
    }
  }, []);
  
  /**
   * Delete a game from MongoDB via API
   */
  const deleteGame = useCallback(async (gameId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log(`Successfully deleted game ${gameId} via API`);
          
          // Update local state
          setGames(prevGames => prevGames.filter(game => game.id !== gameId));
          
          return true;
        } else {
          console.warn('API response was OK but data format was unexpected:', data);
          return false;
        }
      } else {
        console.warn(`API returned status ${response.status} when deleting game ${gameId}`);
        return false;
      }
    } catch (apiError) {
      console.error(`Failed to delete game ${gameId} via API:`, apiError);
      return false;
    }
  }, []);
  
  // Get upcoming and past games
  const now = Date.now();
  console.log(`Filtering games - current timestamp: ${now}, total games: ${games.length}`);
  
  games.forEach(game => {
    console.log(`Processing game: ID=${game.id}, Opponent=${game.opponent}, Date=${game.date}, IsUpcoming=${game.date > now}`);
  });
  
  const upcomingGames = games.filter(game => game.date > now)
    .sort((a, b) => a.date - b.date); // Sort by date ascending
  
  const pastGames = games.filter(game => game.date <= now)
    .sort((a, b) => b.date - a.date); // Sort by date descending (most recent first)
    
  console.log(`Split into ${upcomingGames.length} upcoming and ${pastGames.length} past games`);
  
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
 * Hook for managing a single game from MongoDB via API
 * @param gameId - ID of the game to manage
 */
export function useSingleGame(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load game data from MongoDB via API
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setIsLoading(false);
      return;
    }
    
    async function loadGame() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/games/${gameId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.game) {
            console.log(`Loaded game ${gameId} from API`);
            setGame(data.game);
            setError(null);
          } else {
            console.warn('API response was OK but data format was unexpected:', data);
            setError('Failed to load game: Unexpected data format');
          }
        } else {
          console.warn(`API returned status ${response.status} when loading game ${gameId}`);
          setError(`Failed to load game: Server returned ${response.status}`);
        }
      } catch (err) {
        console.error(`Failed to load game ${gameId} from API:`, err);
        setError('Failed to load game: ' + String(err));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadGame();
  }, [gameId]);
  
  /**
   * Update the game in MongoDB via API
   */
  const updateGame = useCallback(async (updatedGame: Game): Promise<boolean> => {
    if (!updatedGame) return false;
    
    // Update timestamp
    const gameWithTimestamp: Game = {
      ...updatedGame,
      updatedAt: Date.now()
    };
    
    try {
      const response = await fetch(`/api/games/${updatedGame.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game: gameWithTimestamp }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.game) {
          console.log(`Successfully updated game ${updatedGame.id} via API`);
          setGame(data.game);
          return true;
        } else {
          console.warn('API response was OK but data format was unexpected:', data);
          return false;
        }
      } else {
        console.warn(`API returned status ${response.status} when updating game ${updatedGame.id}`);
        return false;
      }
    } catch (apiError) {
      console.error(`Failed to update game ${updatedGame.id} via API:`, apiError);
      return false;
    }
  }, []);
  
  /**
   * Refresh game data from MongoDB via API
   */
  const refreshGame = useCallback(async () => {
    if (!gameId) return;
    
    try {
      const response = await fetch(`/api/games/${gameId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.game) {
          console.log(`Refreshed game ${gameId} from API`);
          setGame(data.game);
          setError(null);
        } else {
          console.warn('API response was OK but data format was unexpected:', data);
          setError('Failed to refresh game: Unexpected data format');
        }
      } else {
        console.warn(`API returned status ${response.status} when refreshing game ${gameId}`);
        setError(`Failed to refresh game: Server returned ${response.status}`);
      }
    } catch (err) {
      console.error(`Failed to refresh game ${gameId}:`, err);
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