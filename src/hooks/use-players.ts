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
  const loadPlayers = useCallback(async () => {
    if (!currentTeam) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Try to load from API first
      try {
        const response = await fetch(`/api/teams/players?teamId=${currentTeam.id}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.players)) {
          console.log('Loaded players from API:', data.players.length);
          setPlayers(data.players);
          setError(null);
          
          // Update local storage with the API data
          data.players.forEach((player: Player) => {
            storageService.player.savePlayer(player);
          });
          
          setIsLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('Failed to load players from API, falling back to local storage:', apiError);
      }
      
      // Fall back to local storage
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
  const createPlayer = useCallback(async (playerData: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>): Promise<Player> => {
    if (!currentTeam) {
      throw new Error('No team selected');
    }
    
    const now = Date.now();
    
    // Create new player for local storage
    const newPlayer: Player = {
      id: uuidv4(),
      teamId: currentTeam.id,
      ...playerData,
      // Ensure name is properly formed for API
      name: `${playerData.firstName} ${playerData.lastName}`.trim(),
      createdAt: now,
      updatedAt: now
    };
    
    try {
      // First save to local storage
      const localSuccess = storageService.player.savePlayer(newPlayer);
      
      if (!localSuccess) {
        throw new Error('Failed to save player to local storage');
      }
      
      // Try saving to API/MongoDB - create a compatible object for the API
      try {
        // Create an API-compatible player object
        const apiPlayer = {
          id: newPlayer.id,
          teamId: newPlayer.teamId,
          name: newPlayer.name, // Combined name for API
          firstName: newPlayer.firstName,
          lastName: newPlayer.lastName,
          jerseyNumber: newPlayer.jerseyNumber,
          primaryPositions: newPlayer.primaryPositions,
          secondaryPositions: newPlayer.secondaryPositions,
          notes: newPlayer.notes,
          battingOrder: newPlayer.battingOrder,
          active: newPlayer.active,
          createdAt: newPlayer.createdAt,
          updatedAt: newPlayer.updatedAt
        };
        
        console.log('Sending player to API:', apiPlayer);
        
        const response = await fetch('/api/teams/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiPlayer),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.error('API save failed but local save succeeded:', data.message);
        } else {
          console.log('Player saved to MongoDB successfully:', data.player);
        }
      } catch (apiError) {
        // Log the error but don't fail the operation since local save succeeded
        console.error('Failed to save player to API (will sync later):', apiError);
      }
      
      // Refresh the players list
      loadPlayers();
      
      return newPlayer;
      
    } catch (error) {
      console.error('Player creation error:', error);
      throw new Error('Failed to save player: ' + String(error));
    }
  }, [currentTeam, loadPlayers]);
  
  /**
   * Update an existing player
   */
  const updatePlayer = useCallback(async (player: Player): Promise<boolean> => {
    // Update the timestamp
    const updatedPlayer: Player = {
      ...player,
      updatedAt: Date.now()
    };
    
    try {
      // First save to local storage
      const localSuccess = storageService.player.savePlayer(updatedPlayer);
      
      if (!localSuccess) {
        throw new Error('Failed to save player to local storage');
      }
      
      // Update local state immediately
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === player.id ? updatedPlayer : p
        )
      );
      
      // Try saving to API/MongoDB
      try {
        const response = await fetch('/api/teams/players', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPlayer),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.error('API update failed but local update succeeded:', data.message);
        } else {
          console.log('Player updated in MongoDB successfully:', data.player);
        }
      } catch (apiError) {
        // Log the error but don't fail the operation since local save succeeded
        console.error('Failed to update player in API (will sync later):', apiError);
      }
      
      return true;
      
    } catch (error) {
      console.error('Player update error:', error);
      return false;
    }
  }, []);
  
  /**
   * Delete a player
   */
  const deletePlayer = useCallback(async (playerId: string): Promise<boolean> => {
    if (!currentTeam) {
      throw new Error('No team selected');
    }
    
    try {
      // First delete from localStorage
      const localSuccess = storageService.player.deletePlayer(playerId);
      
      if (!localSuccess) {
        throw new Error('Failed to delete player from local storage');
      }
      
      // Update local state immediately
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerId));
      
      // Try deleting from API/MongoDB
      try {
        const response = await fetch(`/api/teams/players?playerId=${playerId}&teamId=${currentTeam.id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.error('API delete failed but local delete succeeded:', data.message);
        } else {
          console.log('Player deleted from MongoDB successfully');
        }
      } catch (apiError) {
        // Log the error but don't fail the operation since local delete succeeded
        console.error('Failed to delete player from API (will sync later):', apiError);
      }
      
      return true;
      
    } catch (error) {
      console.error('Player deletion error:', error);
      return false;
    }
  }, [currentTeam]);
  
  /**
   * Toggle a player's active status
   */
  const togglePlayerActive = useCallback(async (playerId: string): Promise<boolean> => {
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      return false;
    }
    
    const updatedPlayer: Player = {
      ...player,
      active: !player.active,
      updatedAt: Date.now()
    };
    
    return await updatePlayer(updatedPlayer);
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
    const fetchPlayers = async () => {
      await loadPlayers();
    };
    
    fetchPlayers();
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