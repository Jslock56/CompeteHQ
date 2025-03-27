"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useStorage } from '../hooks/use-storage';
import { storageAdapter } from '../services/database/storage-adapter';
import { syncService } from '../services/database/sync-service';

/**
 * Storage context state interface
 */
interface StorageContextState {
  // Status indicators
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  
  // Storage adapter instance
  storage: typeof storageAdapter;
  
  // Actions
  syncChanges: () => Promise<boolean>;
  goOnline: () => Promise<boolean>;
  goOffline: () => void;
  fullSync: () => Promise<boolean>;
  downloadAllData: () => Promise<boolean>;
}

// Create the context with a default empty state
const StorageContext = createContext<StorageContextState | undefined>(undefined);

/**
 * Props for StorageProvider component
 */
interface StorageProviderProps {
  children: ReactNode;
}

/**
 * Provider component for storage
 * Wraps children with the StorageContext provider
 */
export function StorageProvider({ children }: StorageProviderProps) {
  // Use the storage hook to manage storage
  const storageHook = useStorage();
  
  // Context value contains all values and methods from storage hook
  const contextValue: StorageContextState = {
    ...storageHook
  };
  
  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
}

/**
 * Custom hook to use the storage context
 * Must be used within a StorageProvider
 */
export function useStorageContext(): StorageContextState {
  const context = useContext(StorageContext);
  
  if (context === undefined) {
    throw new Error('useStorageContext must be used within a StorageProvider');
  }
  
  return context;
}

export default StorageContext;