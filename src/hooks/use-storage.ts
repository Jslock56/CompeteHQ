/**
 * Custom hook for monitoring database connection status
 * This hook provides an interface for checking MongoDB connection
 */

"use client";

import { useState, useEffect, useCallback } from 'react';

// Client-side implementation for MongoDB connection checking
const clientSideDatabaseAdapter = {
  // Check if database is connected
  isDatabaseConnected: async () => {
    try {
      // Check the health endpoint
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
      console.error('Error checking database connection status:', error);
      return false;
    }
  },
  
  // Try to connect to the database
  connectToDatabase: async () => {
    try {
      // Try to connect via the health endpoint
      const response = await fetch('/api/health?connect=true', { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success && data.services.database.connected;
      }
      
      return false;
    } catch (error) {
      console.error('Error connecting to database:', error);
      return false;
    }
  }
};

/**
 * Hook for monitoring database connection status
 */
export function useStorage() {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(true);
  
  // Check database connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await clientSideDatabaseAdapter.isDatabaseConnected();
      setIsDatabaseConnected(connected);
      
      console.log(`Database connection status: ${connected ? 'Connected' : 'Not connected'}`);
    };
    
    checkConnection();
    
    // Set up periodic check for database connection
    const interval = setInterval(checkConnection, 60000); // Every minute
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  /**
   * Try to connect to the database
   */
  const connectToDatabase = useCallback(async () => {
    console.log('Attempting to connect to database...');
    const connected = await clientSideDatabaseAdapter.connectToDatabase();
    setIsDatabaseConnected(connected);
    return connected;
  }, []);
  
  return {
    // Database connection status
    isDatabaseConnected,
    
    // Connect to database method
    connectToDatabase
  };
}