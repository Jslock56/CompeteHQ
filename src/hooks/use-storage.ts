/**
 * Custom hook for using the storage adapter
 * This hook provides a unified interface for all storage operations
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage/enhanced-storage';

// Stub for the server-side storageAdapter
// This provides client-side type compatibility without importing server-only code
// The actual implementation will be provided through server actions
const clientSideStorageAdapter = {
  isOnline: async () => {
    // Check browser online status as a fallback
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return false;
  },
  goOffline: () => {},
  goOnline: async () => false,
  // Add other methods as needed, but they will be minimal client-side implementations
  // Actual data operations will be performed via API routes
};

// Stub for the syncService with minimal client-side implementation
const clientSideSyncService = {
  syncPendingChanges: async () => false,
  getPendingChangesCount: () => 0,
  getSyncState: () => ({ lastSyncTime: 0, isSyncing: false, syncError: null, pendingChanges: {} }),
  fullSync: async () => false,
  downloadAllData: async () => false,
};

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
      const online = await clientSideStorageAdapter.isOnline();
      setIsOnline(online);
      
      const pendingCount = clientSideSyncService.getPendingChangesCount();
      setPendingChanges(pendingCount);
      
      const syncState = clientSideSyncService.getSyncState();
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
      const result = await clientSideSyncService.syncPendingChanges();
      setPendingChanges(clientSideSyncService.getPendingChangesCount());
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);
  
  /**
   * Force app to go online and connect to MongoDB
   */
  const goOnline = useCallback(async () => {
    const result = await clientSideStorageAdapter.goOnline();
    setIsOnline(result);
    return result;
  }, []);
  
  /**
   * Force app to use offline mode with localStorage
   */
  const goOffline = useCallback(() => {
    clientSideStorageAdapter.goOffline();
    setIsOnline(false);
  }, []);
  
  /**
   * Perform a full sync of all data
   */
  const fullSync = useCallback(async () => {
    if (isSyncing || !isOnline) return false;
    
    setIsSyncing(true);
    try {
      const result = await clientSideSyncService.fullSync();
      setPendingChanges(clientSideSyncService.getPendingChangesCount());
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
      const result = await clientSideSyncService.downloadAllData();
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
    storage: storageService, // Use only local storage on the client side
    
    // Sync operations
    syncChanges,
    goOnline,
    goOffline,
    fullSync,
    downloadAllData
  };
}