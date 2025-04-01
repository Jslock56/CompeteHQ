/**
 * ⚠️ DEPRECATED ⚠️
 * 
 * Custom React hook for interacting with localStorage.
 * 
 * This hook is deprecated and should not be used for new development.
 * CompeteHQ is now a cloud-based application with MongoDB as the primary storage mechanism.
 * Local storage capabilities will be added in a future version for specific offline functionality.
 * 
 * Use direct API calls to MongoDB services instead.
 */

import { useState, useEffect, useCallback } from 'react';
import { localStorageService, STORAGE_KEYS } from '../services/storage/local-storage';

/**
 * Options for useLocalStorage hook
 */
interface UseLocalStorageOptions<T> {
  /** Default value to use if key doesn't exist in localStorage */
  defaultValue?: T;
  /** 
   * How to handle serialization errors
   * - 'fallback': Use defaultValue (default behavior)
   * - 'throw': Throw an error
   */
  onError?: 'fallback' | 'throw';
  /** 
   * Whether to sync state across browser tabs/windows
   * If true, changes in other tabs will be reflected in current tab
   */
  syncTabs?: boolean;
}

/**
 * React hook to persist and retrieve data from localStorage with reactive state
 * 
 * @param key - The key to store data under in localStorage
 * @param options - Configuration options for the hook
 * @returns [value, setValue, removeValue] - Tuple with value, setter, and removal function
 * 
 * @example
 * // Simple usage with a string
 * const [username, setUsername] = useLocalStorage<string>('user_name');
 * 
 * @example
 * // With a default value and options
 * const [settings, setSettings, removeSettings] = useLocalStorage<Settings>(
 *   'app_settings',
 *   { defaultValue: DEFAULT_SETTINGS, syncTabs: true }
 * );
 */
function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): [T | undefined, (value: T) => void, () => void] {
  const { defaultValue, onError = 'fallback', syncTabs = false } = options;
  
  // Get initial value from localStorage or use default
  const getInitialValue = (): T | undefined => {
    try {
      const item = localStorageService.getItem<T>(key);
      return item !== null ? item : defaultValue;
    } catch (error) {
      if (onError === 'throw') {
        throw new Error(`Error reading from localStorage key "${key}": ${error}`);
      }
      return defaultValue;
    }
  };
  
  // State to store our value
  const [storedValue, setStoredValue] = useState<T | undefined>(getInitialValue);
  
  // Return a wrapped version of localStorage's setItem function that
  // updates the React state when we update localStorage
  const setValue = useCallback((value: T): void => {
    try {
      // Save to localStorage
      const success = localStorageService.setItem<T>(key, value);
      
      if (!success && onError === 'throw') {
        throw new Error(`Failed to save value to localStorage key "${key}"`);
      }
      
      // Save to state
      setStoredValue(value);
    } catch (error) {
      if (onError === 'throw') {
        throw new Error(`Error saving to localStorage key "${key}": ${error}`);
      }
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, onError]);
  
  // Remove the item from localStorage and state
  const removeValue = useCallback((): void => {
    try {
      localStorageService.removeItem(key);
      setStoredValue(undefined);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);
  
  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    if (!syncTabs) return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) return;
      
      try {
        // If the key was removed
        if (event.newValue === null) {
          setStoredValue(defaultValue);
          return;
        }
        
        // Otherwise, update our state with the new value
        const newValue = JSON.parse(event.newValue) as T;
        setStoredValue(newValue);
      } catch (error) {
        console.error(`Error processing storage event for key "${key}":`, error);
      }
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, syncTabs]);
  
  return [storedValue, setValue, removeValue];
}

/**
 * Hook specifically for managing the current team
 * @returns [currentTeamId, setCurrentTeamId, clearCurrentTeamId]
 */
export function useCurrentTeam(): [string | null, (teamId: string) => void, () => void] {
  const [currentTeamId, setCurrentTeamId, clearCurrentTeamId] = useLocalStorage<string>(
    STORAGE_KEYS.CURRENT_TEAM
  );
  
  return [
    currentTeamId || null,
    setCurrentTeamId,
    clearCurrentTeamId
  ];
}

/**
 * Hook for getting all team IDs
 * @returns [teamIds, addTeamId, removeTeamId]
 */
export function useTeamIds(): [
  string[], 
  (teamId: string) => void, 
  (teamId: string) => void
] {
  const [teamIds, setTeamIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.TEAMS,
    { defaultValue: [] }
  );
  
  const addTeamId = useCallback((teamId: string) => {
    if (!teamIds) return;
    if (teamIds.includes(teamId)) return;
    
    setTeamIds([...teamIds, teamId]);
    localStorageService.addTeam(teamId);
  }, [teamIds, setTeamIds]);
  
  const removeTeamId = useCallback((teamId: string) => {
    if (!teamIds) return;
    
    setTeamIds(teamIds.filter(id => id !== teamId));
    localStorageService.removeTeam(teamId);
  }, [teamIds, setTeamIds]);
  
  return [teamIds || [], addTeamId, removeTeamId];
}

/**
 * Hook for getting all player IDs for a team
 * @param teamId - The team ID
 * @returns [playerIds, addPlayerId, removePlayerId]
 */
export function useTeamPlayerIds(teamId: string): [
  string[],
  (playerId: string) => void,
  (playerId: string) => void
] {
  const [playerIds, setPlayerIds] = useLocalStorage<string[]>(
    `${STORAGE_KEYS.PLAYERS_BY_TEAM_PREFIX}${teamId}`,
    { defaultValue: [] }
  );
  
  const addPlayerId = useCallback((playerId: string) => {
    if (!playerIds || !teamId) return;
    if (playerIds.includes(playerId)) return;
    
    setPlayerIds([...playerIds, playerId]);
    localStorageService.addPlayerToTeam(teamId, playerId);
  }, [playerIds, setPlayerIds, teamId]);
  
  const removePlayerId = useCallback((playerId: string) => {
    if (!playerIds || !teamId) return;
    
    setPlayerIds(playerIds.filter(id => id !== playerId));
    localStorageService.removePlayerFromTeam(teamId, playerId);
  }, [playerIds, setPlayerIds, teamId]);
  
  return [playerIds || [], addPlayerId, removePlayerId];
}

/**
 * Hook for getting all game IDs for a team
 * @param teamId - The team ID
 * @returns [gameIds, addGameId, removeGameId]
 */
export function useTeamGameIds(teamId: string): [
  string[],
  (gameId: string) => void,
  (gameId: string) => void
] {
  const [gameIds, setGameIds] = useLocalStorage<string[]>(
    `${STORAGE_KEYS.GAMES_BY_TEAM_PREFIX}${teamId}`,
    { defaultValue: [] }
  );
  
  const addGameId = useCallback((gameId: string) => {
    if (!gameIds || !teamId) return;
    if (gameIds.includes(gameId)) return;
    
    setGameIds([...gameIds, gameId]);
    localStorageService.addGameToTeam(teamId, gameId);
  }, [gameIds, setGameIds, teamId]);
  
  const removeGameId = useCallback((gameId: string) => {
    if (!gameIds || !teamId) return;
    
    setGameIds(gameIds.filter(id => id !== gameId));
    localStorageService.removeGameFromTeam(teamId, gameId);
  }, [gameIds, setGameIds, teamId]);
  
  return [gameIds || [], addGameId, removeGameId];
}

/**
 * Generic hook for managing any entity type in localStorage
 * @param prefix - Storage key prefix (from STORAGE_KEYS)
 * @param id - Entity ID
 * @returns [entity, saveEntity, removeEntity]
 */
export function useStoredEntity<T>(
  prefix: string,
  id: string
): [T | undefined, (entity: T) => void, () => void] {
  return useLocalStorage<T>(`${prefix}${id}`);
}

export default useLocalStorage;