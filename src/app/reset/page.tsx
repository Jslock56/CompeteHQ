"use client";

import React, { useState } from 'react';
import { Box, Button, Container, Heading, Text, VStack, Code, Alert, AlertIcon, Divider } from '@chakra-ui/react';

/**
 * Reset page for troubleshooting database and storage
 */
export default function ResetPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Run direct MongoDB test
  const runDirectTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/direct-mongodb-test');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Run fix lineups operation
  const fixLineups = async (operation: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fix-lineups?operation=${operation}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Clear IndexedDB
  const clearIndexedDB = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This is a safe way to attempt to delete all IndexedDB databases
      const databases = await window.indexedDB.databases();
      
      // Create results object
      const clearResults = {
        operation: 'clearIndexedDB',
        timestamp: new Date().toISOString(),
        databases: databases.map(db => db.name),
        results: {}
      };
      
      // Delete each database
      for (const db of databases) {
        if (db.name) {
          try {
            await new Promise<void>((resolve, reject) => {
              const request = window.indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => {
                clearResults.results[db.name!] = 'deleted';
                resolve();
              };
              request.onerror = () => {
                clearResults.results[db.name!] = 'error';
                reject(new Error(`Failed to delete database ${db.name}`));
              };
            });
          } catch (dbErr) {
            clearResults.results[db.name] = String(dbErr);
          }
        }
      }
      
      setResults(clearResults);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Clear localStorage
  const clearLocalStorage = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the count of items before clearing
      const itemCount = localStorage.length;
      const keys = [];
      
      // Collect all keys
      for (let i = 0; i < itemCount; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      
      // Clear storage
      localStorage.clear();
      
      setResults({
        operation: 'clearLocalStorage',
        timestamp: new Date().toISOString(),
        itemsCleared: itemCount,
        keys
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>Database Diagnostics & Reset</Heading>
          <Text>Use these tools to diagnose and fix database issues.</Text>
        </Box>
        
        <Alert status="warning">
          <AlertIcon />
          These operations can modify or delete data. Use with caution.
        </Alert>
        
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Heading as="h2" size="md" mb={4}>MongoDB Diagnostics</Heading>
          <VStack spacing={4} align="stretch">
            <Button 
              colorScheme="blue" 
              onClick={runDirectTest} 
              isLoading={loading}
            >
              Run Direct MongoDB Test
            </Button>
            
            <Button 
              onClick={() => fixLineups('check')} 
              isLoading={loading}
            >
              Check Lineups Collection
            </Button>
            
            <Button 
              colorScheme="orange" 
              onClick={() => fixLineups('fix')} 
              isLoading={loading}
            >
              Create Test Lineup Directly
            </Button>
            
            <Button 
              colorScheme="red" 
              onClick={() => fixLineups('reset')} 
              isLoading={loading}
            >
              Reset Lineups Collection
            </Button>
          </VStack>
        </Box>
        
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Heading as="h2" size="md" mb={4}>Local Storage Reset</Heading>
          <VStack spacing={4} align="stretch">
            <Button 
              colorScheme="red" 
              onClick={clearIndexedDB} 
              isLoading={loading}
            >
              Clear IndexedDB
            </Button>
            
            <Button 
              colorScheme="red" 
              onClick={clearLocalStorage} 
              isLoading={loading}
            >
              Clear LocalStorage
            </Button>
          </VStack>
        </Box>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {results && (
          <Box borderWidth="1px" borderRadius="lg" p={4}>
            <Heading as="h2" size="md" mb={4}>Results</Heading>
            <Box maxH="400px" overflowY="auto">
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                <Code width="100%" p={2}>
                  {JSON.stringify(results, null, 2)}
                </Code>
              </pre>
            </Box>
          </Box>
        )}
      </VStack>
    </Container>
  );
}