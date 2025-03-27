/**
 * Custom hook for using the storage adapter
 * This hook provides a unified interface for all storage operations
 */

import { useState, useEffect, useCallback } from 'react';
import { storageAdapter } from '../services/database/storage-adapter';
import { syncService } from '../services/database/sync-service';

/**
 * Hook for accessing storage adapter functionality
 */
export function useStorage() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Check online status and pending changes on mount
  useEffect(() => {
    const checkStatus = async () => {
      const online = await storageAdapter.isOnline();
      setIsOnline(online);
      
      const pendingCount = syncService.getPendingChangesCount();
      setPendingChanges(pendingCount);
      
      const syncState = syncService.getSyncState();
      setIsSyncing(syncState.isSyncing);
    };
    
    checkStatus();
    
    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      checkStatus(); // Recheck everything when we go online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Periodic check for pending changes
      const interval = setInterval(checkStatus, 30000); // Every 30 seconds
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(interval);
      };
    }
  }, []);
  
  /**
   * Trigger a sync of pending changes
   */
  const syncChanges = useCallback(async () => {
    if (isSyncing || !isOnline) return false;
    
    setIsSyncing(true);
    try {
      const result = await syncService.syncPendingChanges();
      setPendingChanges(syncService.getPendingChangesCount());
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);
  
  /**
   * Force app to go online and connect to MongoDB
   */
  const goOnline = useCallback(async () => {
    const result = await storageAdapter.goOnline();
    setIsOnline(result);
    return result;
  }, []);
  
  /**
   * Force app to use offline mode with localStorage
   */
  const goOffline = useCallback(() => {
    storageAdapter.goOffline();
    setIsOnline(false);
  }, []);
  
  /**
   * Perform a full sync of all data
   */
  const fullSync = useCallback(async () => {
    if (isSyncing || !isOnline) return false;
    
    setIsSyncing(true);
    try {
      const result = await syncService.fullSync();
      setPendingChanges(syncService.getPendingChangesCount());
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);
  
  /**
   * Download all data from MongoDB to localStorage
   */
  const downloadAllData = useCallback(async () => {
    if (isSyncing || !isOnline) return false;
    
    setIsSyncing(true);
    try {
      const result = await syncService.downloadAllData();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);
  
  return {
    // Storage status
    isOnline,
    isSyncing,
    pendingChanges,
    
    // Storage operations
    storage: storageAdapter,
    
    // Sync operations
    syncChanges,
    goOnline,
    goOffline,
    fullSync,
    downloadAllData
  };
}