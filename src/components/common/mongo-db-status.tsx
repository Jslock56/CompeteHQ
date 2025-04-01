import React, { useState, useEffect } from 'react';
import { Box, Badge, Text, Button, Spinner, Flex, useToast } from '@chakra-ui/react';

/**
 * A component that displays MongoDB connection status and offers diagnostic tools
 */
const MongoDBStatus: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    error: string | null;
    details: any;
    loading: boolean;
  }>({
    connected: false,
    error: null,
    details: null,
    loading: true
  });
  
  const [mode, setMode] = useState<'basic' | 'diagnostic'>('basic');
  const toast = useToast();
  
  // Fetch MongoDB status
  const checkConnection = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/debug?operation=testConnection');
      const data = await response.json();
      
      setDbStatus({
        connected: data.connected,
        error: data.connectionError || null,
        details: data,
        loading: false
      });
      
      console.log('MongoDB connection test:', data);
    } catch (error) {
      console.error('Error testing MongoDB connection:', error);
      setDbStatus({
        connected: false,
        error: String(error),
        details: null,
        loading: false
      });
    }
  };
  
  // Test write functionality
  const testWrite = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/debug?operation=testWrite');
      const data = await response.json();
      
      if (data.writeTest) {
        toast({
          title: 'Write test successful',
          description: `Created test record with ID: ${data.testId}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Write test failed',
          description: data.writeError || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Update status
      setDbStatus(prev => ({
        ...prev,
        details: { ...prev.details, writeTest: data },
        loading: false
      }));
    } catch (error) {
      console.error('Error testing MongoDB write:', error);
      toast({
        title: 'Write test error',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setDbStatus(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Create a sample lineup
  const createSampleLineup = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/debug?operation=createSampleLineup');
      const data = await response.json();
      
      if (data.createSuccess) {
        toast({
          title: 'Sample lineup created',
          description: `Created lineup with ID: ${data.sampleLineupId}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Failed to create sample lineup',
          description: data.createError || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Update status
      setDbStatus(prev => ({
        ...prev,
        details: { ...prev.details, sampleLineup: data },
        loading: false
      }));
    } catch (error) {
      console.error('Error creating sample lineup:', error);
      toast({
        title: 'Create sample lineup error',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setDbStatus(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Get existing lineups
  const getLineups = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/debug?operation=getLineups');
      const data = await response.json();
      
      toast({
        title: 'Lineups retrieved',
        description: `Found ${data.count || 0} lineups`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      // Update status
      setDbStatus(prev => ({
        ...prev,
        details: { ...prev.details, lineups: data },
        loading: false
      }));
    } catch (error) {
      console.error('Error getting lineups:', error);
      toast({
        title: 'Get lineups error',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setDbStatus(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Check DB on mount
  useEffect(() => {
    checkConnection();
  }, []);
  
  return (
    <Box p={3} borderWidth="1px" borderRadius="md" mb={4}>
      <Flex align="center" justify="space-between" mb={2}>
        <Flex align="center">
          <Text fontWeight="bold" mr={2}>MongoDB Status:</Text>
          {dbStatus.loading ? (
            <Spinner size="sm" mr={2} />
          ) : dbStatus.connected ? (
            <Badge colorScheme="green">Connected</Badge>
          ) : (
            <Badge colorScheme="red">Disconnected</Badge>
          )}
        </Flex>
        
        <Button size="sm" onClick={() => setMode(mode === 'basic' ? 'diagnostic' : 'basic')}>
          {mode === 'basic' ? 'Show Diagnostics' : 'Hide Diagnostics'}
        </Button>
      </Flex>
      
      {dbStatus.error && (
        <Text fontSize="sm" color="red.500" mb={2}>
          Error: {dbStatus.error}
        </Text>
      )}
      
      {mode === 'diagnostic' && (
        <Box mt={3} pt={3} borderTopWidth="1px">
          <Text fontWeight="bold" mb={2}>Diagnostic Tools</Text>
          <Flex wrap="wrap" gap={2}>
            <Button size="sm" onClick={checkConnection} isLoading={dbStatus.loading}>
              Test Connection
            </Button>
            <Button size="sm" onClick={testWrite} isLoading={dbStatus.loading}>
              Test Write
            </Button>
            <Button size="sm" onClick={createSampleLineup} isLoading={dbStatus.loading}>
              Create Sample Lineup
            </Button>
            <Button size="sm" onClick={getLineups} isLoading={dbStatus.loading}>
              Get Lineups
            </Button>
          </Flex>
          
          {dbStatus.details && dbStatus.details.lineups && (
            <Box mt={3} fontSize="sm">
              <Text fontWeight="bold">Existing Lineups:</Text>
              {dbStatus.details.lineups.count === 0 ? (
                <Text>No lineups found</Text>
              ) : (
                <Box maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" mt={1}>
                  {dbStatus.details.lineups.lineups?.map((lineup: any) => (
                    <Box key={lineup.id} p={1} _hover={{ bg: 'gray.50' }}>
                      <Text fontWeight="medium">{lineup.name}</Text>
                      <Text fontSize="xs">ID: {lineup.id}</Text>
                      <Text fontSize="xs">Team: {lineup.teamId}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MongoDBStatus;