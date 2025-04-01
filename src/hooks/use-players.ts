/**
 * Custom hook for player management
 * Provides methods for creating, reading, updating, and deleting players
 * using MongoDB as the data store
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
   * Load all players for the current team from MongoDB
   */
  const loadPlayers = useCallback(async () => {
    if (!currentTeam) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Load from MongoDB via API
      const response = await fetch(`/api/teams/players?teamId=${currentTeam.id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching players: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.players)) {
        console.log('Loaded players from MongoDB:', data.players.length);
        setPlayers(data.players);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to load players from database');
      }
    } catch (err) {
      console.error('Failed to load players:', err);
      setError('Failed to load players: ' + String(err));
      // Provide empty array as fallback
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);
  
  /**
   * Get a single player by ID
   */
  const getPlayer = useCallback((playerId: string): Player | null => {
    // Find player in the already loaded players array
    return players.find(player => player.id === playerId) || null;
  }, [players]);
  
  /**
   * Create a new player
   */
  const createPlayer = useCallback(async (playerData: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>): Promise<Player> => {
    if (!currentTeam) {
      throw new Error('No team selected');
    }
    
    const now = Date.now();
    
    // Create new player
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
      // Save to MongoDB via API
      console.log('Creating player in MongoDB:', newPlayer);
      
      const response = await fetch('/api/teams/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlayer),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating player: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create player in database');
      }
      
      console.log('Player created in MongoDB successfully:', data.player);
      
      // Refresh the players list
      loadPlayers();
      
      return data.player || newPlayer;
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
      // Save to MongoDB via API
      console.log('Updating player in MongoDB:', updatedPlayer);
      
      const response = await fetch('/api/teams/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPlayer),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating player: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update player in database');
      }
      
      console.log('Player updated in MongoDB successfully:', data.player);
      
      // Update local state immediately
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === player.id ? updatedPlayer : p
        )
      );
      
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
      // Delete from MongoDB via API
      console.log('Deleting player from MongoDB:', playerId);
      
      const response = await fetch(`/api/teams/players?playerId=${playerId}&teamId=${currentTeam.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting player: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete player from database');
      }
      
      console.log('Player deleted from MongoDB successfully');
      
      // Update local state immediately
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerId));
      
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
  
  // Load player data from MongoDB
  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      setIsLoading(false);
      return;
    }
    
    const fetchPlayer = async () => {
      setIsLoading(true);
      try {
        // Fetch player from MongoDB via API
        const response = await fetch(`/api/teams/players?playerId=${playerId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching player: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.player) {
          setPlayer(data.player);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load player from database');
        }
      } catch (err) {
        console.error('Failed to load player:', err);
        setError('Failed to load player: ' + String(err));
        setPlayer(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayer();
  }, [playerId]);
  
  /**
   * Update the player
   */
  const updatePlayer = useCallback(async (updatedPlayer: Player): Promise<boolean> => {
    if (!updatedPlayer) return false;
    
    // Update timestamp
    const playerWithTimestamp: Player = {
      ...updatedPlayer,
      updatedAt: Date.now()
    };
    
    try {
      // Update in MongoDB via API
      const response = await fetch('/api/teams/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerWithTimestamp),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating player: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update player in database');
      }
      
      console.log('Player updated in MongoDB successfully');
      setPlayer(playerWithTimestamp);
      return true;
    } catch (error) {
      console.error('Player update error:', error);
      return false;
    }
  }, []);
  
  /**
   * Refresh player data from MongoDB
   */
  const refreshPlayer = useCallback(async () => {
    if (!playerId) return;
    
    try {
      // Fetch from MongoDB via API
      const response = await fetch(`/api/teams/players?playerId=${playerId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching player: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.player) {
        setPlayer(data.player);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to refresh player from database');
      }
    } catch (err) {
      console.error('Failed to refresh player:', err);
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