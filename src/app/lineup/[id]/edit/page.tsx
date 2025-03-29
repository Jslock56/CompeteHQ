"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { withTeam } from '@/contexts/team-context';
import { useTeamContext } from '@/contexts/team-context';
import { usePlayers } from '@/hooks/use-players';
import { Lineup } from '@/types/lineup';
import FieldPositionLineupBuilder from '@/components/lineup/field-position-lineup-builder';
import { storageService } from '@/services/storage/enhanced-storage';

/**
 * Edit an existing field position lineup
 */
function EditLineupPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { currentTeam } = useTeamContext();
  
  // Get lineup ID from URL parameters
  const lineupId = Array.isArray(params.id) ? params.id[0] : params.id as string;
  
  // State
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get players for the team
  const { players } = usePlayers();
  
  // Load lineup data
  useEffect(() => {
    const loadData = async () => {
      if (!lineupId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load lineup
        const lineupData = await storageService.lineup.getLineup(lineupId);
        
        if (!lineupData) {
          setError('Lineup not found');
        } else {
          setLineup(lineupData);
        }
      } catch (err) {
        setError(`Failed to load lineup: ${String(err)}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [lineupId]);
  
  // Handler when lineup is saved
  const handleSave = (lineup: Lineup) => {
    toast({
      title: "Lineup updated",
      description: `Field position lineup "${lineup.name}" has been updated successfully.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // Navigate to the dashboard
    router.push('/lineup/dashboard');
  };
  
  // Handler when cancel is pressed
  const handleCancel = () => {
    router.push('/lineup/dashboard');
  };
  
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="60vh" direction="column">
          <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
          <Text mt={4} color="gray.600">Loading lineup data...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (error || !lineup) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Failed to load lineup data'}
        </Alert>
        
        <Button colorScheme="primary" variant="link" onClick={() => router.push('/lineup/dashboard')}>
          Go Back to Lineups
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      {/* Breadcrumbs */}
      <Breadcrumb 
        separator={<ChevronRightIcon color="gray.500" />} 
        mb={6}
        fontSize="sm"
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={NextLink} href="/lineup/dashboard" color="gray.500">
            Lineups
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text color="gray.500">Edit Lineup</Text>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Page Header */}
      <Flex 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        mb={8}
      >
        <Box mb={{ base: 4, md: 0 }}>
          <Heading size="lg" mb={1}>
            Edit Field Position Lineup
          </Heading>
          <Text color="gray.600">
            {lineup.name} • {lineup.type === 'competitive' ? 'Competitive' : 'Developmental'}
          </Text>
        </Box>
      </Flex>
      
      {/* Lineup Builder */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
        p={{ base: 4, md: 6 }}
      >
        <FieldPositionLineupBuilder
          teamId={currentTeam?.id || ''}
          players={players}
          initialLineup={lineup}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
}

export default withTeam(EditLineupPage);