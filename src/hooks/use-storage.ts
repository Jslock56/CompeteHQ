/**
 * Custom hook for using the storage adapter
 * This hook provides a unified interface for all storage operations
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage/enhanced-storage';

// Client-side implementation of the StorageAdapter
// Focuses on connectivity checks and online/offline status
const clientSideStorageAdapter = {
  // Check if server is online and database is connected
  isOnline: async () => {
    try {
      // First check browser online status
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        return false; // If browser is offline, we're definitely offline
      }
      
      // Then try the health check endpoint
      const response = await fetch('/api/health', { 
        method: 'GET',
        // Cache control to ensure fresh response
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success && data.services.database.connected;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking online status:', error);
      return false;
    }
  },
  
  // Force offline mode
  goOffline: () => {
    // Store preference in local storage
    try {
      const settings = localStorage.getItem('competeHQ_settings');
      const parsedSettings = settings ? JSON.parse(settings) : {};
      parsedSettings.preferOffline = true;
      localStorage.setItem('competeHQ_settings', JSON.stringify(parsedSettings));
    } catch (error) {
      console.error('Error setting offline mode:', error);
    }
  },
  
  // Try to go online
  goOnline: async () => {
    try {
      // Update settings
      const settings = localStorage.getItem('competeHQ_settings');
      const parsedSettings = settings ? JSON.parse(settings) : {};
      parsedSettings.preferOffline = false;
      localStorage.setItem('competeHQ_settings', JSON.stringify(parsedSettings));
      
      // Check connectivity
      return await clientSideStorageAdapter.isOnline();
    } catch (error) {
      console.error('Error setting online mode:', error);
      return false;
    }
  }
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
      // Check online status from browser and server
      const browserOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const serverOnline = await clientSideStorageAdapter.isOnline();
      
      // We're online if both browser and server indicate we're online
      const online = browserOnline && serverOnline;
      setIsOnline(online);
      
      console.log(`Online status: ${online ? 'Online' : 'Offline'} (Browser: ${browserOnline}, Server: ${serverOnline})`);
      
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