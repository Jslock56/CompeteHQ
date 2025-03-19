"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { withTeam } from '@/contexts/team-context';
import { usePlayers } from '@/hooks/use-players';
import { Game } from '@/types/game';
import { Lineup } from '@/types/lineup';
import { storageService } from '@/services/storage/enhanced-storage';
import LineupBuilder from '../../../components/lineup/lineup-builder-spreadsheet';

/**
 * Page for creating a new lineup using the improved lineup builder
 */
function NewLineupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  // Get game ID from URL parameters
  const gameId = searchParams.get('gameId');
  
  // Game data state
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get players for the team
  const { players } = usePlayers();
  
  // Load game data
  useEffect(() => {
    if (!gameId) {
      setError('No game ID provided');
      setIsLoading(false);
      return;
    }
    
    try {
      const gameData = storageService.game.getGame(gameId);
      
      if (!gameData) {
        setError('Game not found');
      } else {
        setGame(gameData);
        
        // Check if lineup already exists
        if (gameData.lineupId) {
          // Redirect to existing lineup
          toast({
            title: "Lineup already exists",
            description: "Redirecting to existing lineup",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
          
          router.push(`/lineup/${gameData.lineupId}`);
        }
      }
    } catch (err) {
      setError(`Failed to load game: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, router, toast]);
  
  // Handle lineup saved
  const handleLineupSaved = (lineup: Lineup) => {
    // Update game with lineup ID
    if (game && !game.lineupId) {
      const updatedGame = {
        ...game,
        lineupId: lineup.id
      };
      
      storageService.game.saveGame(updatedGame);
    }
    
    // Save the lineup
    const success = storageService.lineup.saveLineup(lineup);
    
    if (success) {
      toast({
        title: "Lineup saved",
        description: "Your lineup has been saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to game page
      router.push(`/games/${game?.id}`);
    } else {
      toast({
        title: "Error saving lineup",
        description: "There was a problem saving your lineup",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.back();
  };
  
  if (isLoading) {
    return (
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" minH="60vh" direction="column">
          <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
          <Text mt={4} color="gray.600">Loading game data...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (error || !game) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Failed to load game data'}
        </Alert>
        
        <Button colorScheme="primary" variant="link" onClick={() => router.push('/games')}>
          Go Back to Games
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxW="6xl" py={8}>
      {/* Breadcrumbs */}
      <Flex align="center" mb={6}>
        <NextLink href="/games" passHref>
          <Button 
            as="a" 
            variant="link" 
            colorScheme="primary" 
            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
            mr={2}
          >
            Games
          </Button>
        </NextLink>
        /
        <NextLink href={`/games/${game.id}`} passHref>
          <Button 
            as="a" 
            variant="link" 
            colorScheme="primary" 
            mx={2}
          >
            vs. {game.opponent}
          </Button>
        </NextLink>
        /
        <Text color="gray.500" ml={2}>Create Lineup</Text>
      </Flex>
      
      {/* Page Header */}
      <Flex 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        mb={8}
      >
        <Box mb={{ base: 4, md: 0 }}>
          <Heading size="lg" mb={1}>
            Create Lineup
          </Heading>
          <Text color="gray.600">
            vs. {game.opponent} • {new Date(game.date).toLocaleDateString()} • {game.location}
          </Text>
        </Box>
        
        <Button colorScheme="gray" onClick={handleCancel}>
          Cancel
        </Button>
      </Flex>
      
      {/* Instructions */}
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="medium">Spreadsheet-Style Lineup Builder</Text>
          <Text fontSize="sm">
            Create your lineup by clicking positions in the grid and selecting players from the roster.
            The system will automatically move to the next position after each selection.
          </Text>
        </Box>
      </Alert>
      
      {/* Improved Lineup Builder */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
        p={{ base: 2, md: 4 }}
      >
        <LineupBuilder
          game={game}
          players={players}
          onSave={handleLineupSaved}
        />
      </Box>
    </Container>
  );
}

export default withTeam(NewLineupPage);