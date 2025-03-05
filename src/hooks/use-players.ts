/**
 * Custom hook for player management
 * Provides methods for creating, reading, updating, and deleting players
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storage/enhanced-storage';
import { Player, Position } from '../types/player';
import { useTeamContext } from '../contexts/team-context';

/**
 * Result from the usePlayers hook
 */
interface UsePlayersResult {
  /**
   * All players in the current team
   */
  players: Player[];
  
  /**
   * Active players only (where active === true)
   */
  activePlayers: Player[];
  
  /**
   * Is data still loading
   */
  isLoading: boolean;
  
  /**
   * Error message (if any)
   */
  error: string | null;
  
  /**
   * Create a new player
   */
  createPlayer: (playerData: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>) => Player;
  
  /**
   * Update an existing player
   */
  updatePlayer: (player: Player) => boolean;
  
  /**
   * Delete a player
   */
  deletePlayer: (playerId: string) => boolean;
  
  /**
   * Toggle a player's active status
   */
  togglePlayerActive: (playerId: string) => boolean;
  
  /**
   * Get a single player by ID
   */
  getPlayer: (playerId: string) => Player | null;
  
  /**
   * Get players by position
   */
  getPlayersByPosition: (position: Position) => Player[];
  
  /**
   * Reload player data from storage
   */
  refreshPlayers: () => void;
}

/**
 * Hook for managing players for the current team
 */
export function usePlayers(): UsePlayersResult {
  const { currentTeam } = useTeamContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load all players for the current team
   */
  const loadPlayers = useCallback(() => {
    if (!currentTeam) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const teamPlayers = storageService.player.getPlayersByTeam(currentTeam.id);
      setPlayers(teamPlayers);
      setError(null);
    } catch (err) {
      setError('Failed to load players: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);
  
  /**
   * Get a single player by ID
   */
  const getPlayer = useCallback((playerId: string): Player | null => {
    return storageService.player.getPlayer(playerId);
  }, []);
  
  /**
   * Create a new player
   */
  const createPlayer = useCallback((playerData: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>): Player => {
    if (!currentTeam) {
      throw new Error('No team selected');
    }
    
    const now = Date.now();
    
    const newPlayer: Player = {
      id: uuidv4(),
      teamId: currentTeam.id,
      ...playerData,
      createdAt: now,
      updatedAt: now
    };
    
    const success = storageService.player.savePlayer(newPlayer);
    
    if (!success) {
      throw new Error('Failed to save player');
    }
    
    // Refresh the players list
    loadPlayers();
    
    return newPlayer;
  }, [currentTeam, loadPlayers]);
  
  /**
   * Update an existing player
   */
  const updatePlayer = useCallback((player: Player): boolean => {
    // Update the timestamp
    const updatedPlayer: Player = {
      ...player,
      updatedAt: Date.now()
    };
    
    const success = storageService.player.savePlayer(updatedPlayer);
    
    if (success) {
      // Update local state
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === player.id ? updatedPlayer : p
        )
      );
    }
    
    return success;
  }, []);
  
  /**
   * Delete a player
   */
  const deletePlayer = useCallback((playerId: string): boolean => {
    const success = storageService.player.deletePlayer(playerId);
    
    if (success) {
      // Update local state
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerId));
    }
    
    return success;
  }, []);
  
  /**
   * Toggle a player's active status
   */
  const togglePlayerActive = useCallback((playerId: string): boolean => {
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      return false;
    }
    
    const updatedPlayer: Player = {
      ...player,
      active: !player.active,
      updatedAt: Date.now()
    };
    
    return updatePlayer(updatedPlayer);
  }, [players, updatePlayer]);
  
  /**
   * Get players by position (primary or secondary)
   */
  const getPlayersByPosition = useCallback((position: Position): Player[] => {
    return players.filter(player => 
      player.primaryPositions.includes(position) || 
      player.secondaryPositions.includes(position)
    );
  }, [players]);
  
  // Filter for active players
  const activePlayers = players.filter(player => player.active);
  
  // Load players on initial mount and when current team changes
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);
  
  return {
    players,
    activePlayers,
    isLoading,
    error,
    createPlayer,
    updatePlayer,
    deletePlayer,
    togglePlayerActive,
    getPlayer,
    getPlayersByPosition,
    refreshPlayers: loadPlayers
  };
}

/**
 * Hook for managing a single player
 * @param playerId - ID of the player to manage
 */
export function useSinglePlayer(playerId: string | null) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load player data
  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const playerData = storageService.player.getPlayer(playerId);
      setPlayer(playerData);
      setError(null);
    } catch (err) {
      setError('Failed to load player: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);
  
  /**
   * Update the player
   */
  const updatePlayer = useCallback((updatedPlayer: Player): boolean => {
    if (!updatedPlayer) return false;
    
    // Update timestamp
    const playerWithTimestamp: Player = {
      ...updatedPlayer,
      updatedAt: Date.now()
    };
    
    const success = storageService.player.savePlayer(playerWithTimestamp);
    
    if (success) {
      setPlayer(playerWithTimestamp);
    }
    
    return success;
  }, []);
  
  /**
   * Refresh player data from storage
   */
  const refreshPlayer = useCallback(() => {
    if (!playerId) return;
    
    try {
      const playerData = storageService.player.getPlayer(playerId);
      setPlayer(playerData);
      setError(null);
    } catch (err) {
      setError('Failed to refresh player: ' + String(err));
    }
  }, [playerId]);
  
  return {
    player,
    isLoading,
    error,
    updatePlayer,
    refreshPlayer
  };
}

export default usePlayers;