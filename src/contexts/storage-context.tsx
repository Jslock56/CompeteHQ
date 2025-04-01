"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useStorage } from '../hooks/use-storage';
import { storageAdapter } from '../services/database/storage-adapter';

/**
 * Storage context state interface
 * Focused exclusively on MongoDB database connectivity
 */
interface StorageContextState {
  // Connection status indicators
  isDatabaseConnected: boolean;
  
  // Storage adapter instance for database operations
  storage: typeof storageAdapter;
  
  // Actions
  connectToDatabase: () => Promise<boolean>;
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
 * Only monitors and manages MongoDB connectivity
 */
export function StorageProvider({ children }: StorageProviderProps) {
  // Use the storage hook to manage database connectivity
  const { isDatabaseConnected, connectToDatabase } = useStorage();
  
  // Context value contains connectivity status and methods
  const contextValue: StorageContextState = {
    isDatabaseConnected,
    storage: storageAdapter,
    connectToDatabase
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