"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Container,
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Alert,
  AlertIcon,
  ChakraProvider
} from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { withTeam } from '../../../../../contexts/team-context';
import { useSingleGame } from '../../../../../hooks/use-games';
import { useLineup } from '../../../../../hooks/use-lineup';
import { useTeamContext } from '../../../../../contexts/team-context';
import GameLineupCreator from '../../../../../components/lineup/components/game-lineup-creator';
import LineupGridSpreadsheet from '../../../../../components/lineup/components/lineup-grid-spreadsheet';
import FairPlayChecker from '../../../../../components/lineup/components/FairPlayChecker';
import { storageService } from '../../../../../services/storage/enhanced-storage';
import { Lineup, Position } from '../../../../../types/lineup';

/**
 * Page component for creating a game-specific lineup
 */
function CreateGameLineupPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { currentTeam } = useTeamContext();
  
  const gameId = params.id as string;
  const { game, isLoading: gameLoading, error: gameError } = useSingleGame(gameId);
  
  // State to track which stage of the process we're in
  const [stage, setStage] = useState<'create' | 'edit'>('create');
  
  // State for the active position and inning in the editor
  const [activePosition, setActivePosition] = useState<Position>('P');
  const [activeInning, setActiveInning] = useState<number>(1);
  
  // Generated lineup state
  const [generatedLineup, setGeneratedLineup] = useState<Lineup | null>(null);
  
  // Get available players
  const players = storageService.player.getPlayersByTeam(currentTeam?.id || '');
  
  // Initialize the lineup hook when a lineup is generated
  const {
    lineup,
    assignPlayerToPosition,
    swapPlayers,
    validateLineup,
    saveLineup,
    fairPlayIssues
  } = useLineup({
    gameId,
    teamId: currentTeam?.id || '',
    innings: game?.innings || 6,
    initialLineup: generatedLineup || undefined,
    players,
  });
  
  // Handle lineup generation from the creator component
  const handleLineupGenerated = (newLineup: Lineup) => {
    setGeneratedLineup(newLineup);
    setStage('edit');
  };
  
  // Handle cell click in the lineup grid
  const handleCellClick = (position: Position, inning: number) => {
    if (activePosition === position && activeInning === inning) {
      // Clicking the same cell deselects it
      setActivePosition('P');
      setActiveInning(1);
      return;
    }
    
    if (activePosition && activeInning) {
      // If we already have a selection, perform a swap
      swapPlayers(activeInning, activePosition, inning, position);
      
      // Reset selection after swap
      setActivePosition('P');
      setActiveInning(1);
    } else {
      // Otherwise, set this as the active cell
      setActivePosition(position);
      setActiveInning(inning);
    }
  };
  
  // Handle saving the lineup
  const handleSaveLineup = async () => {
    try {
      const savedLineup = await saveLineup();
      
      if (savedLineup) {
        // If we have a game, update its lineup reference
        if (game && !game.lineupId) {
          // Add lineup ID to the game
          const updatedGame = { 
            ...game, 
            lineupId: savedLineup.id,
            updatedAt: Date.now()
          };
          
          // Save the updated game
          const success = storageService.game.saveGame(updatedGame);
          
          if (!success) {
            console.error('Failed to update game with lineup ID');
          }
        }
        
        toast({
          title: "Lineup saved",
          description: "The lineup has been saved successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Navigate to the lineup view page
        router.push(`/lineup/${savedLineup.id}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to save the lineup. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving lineup:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // If game doesn't exist, handle error
  if (gameError || (!gameLoading && !game)) {
    return (
      <Container maxW="4xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {gameError || 'Game not found. Please check the URL and try again.'}
        </Alert>
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          mt={4} 
          onClick={() => router.push('/games')}
        >
          Back to Games
        </Button>
      </Container>
    );
  }
  
  // If game already has a lineup, redirect to edit
  useEffect(() => {
    if (game?.lineupId) {
      toast({
        title: "Lineup exists",
        description: "This game already has a lineup. Redirecting to edit page.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/lineup/${game.lineupId}/edit`);
    }
  }, [game, router, toast]);
  
  // Loading state
  if (gameLoading) {
    return (
      <Container maxW="4xl" py={8}>
        <Flex 
          align="center" 
          justify="center" 
          minH="60vh" 
          direction="column"
        >
          <Box 
            className="animate-spin" 
            h="12" 
            w="12" 
            borderWidth="2px" 
            borderBottomColor="primary.600" 
            borderRadius="full" 
            mb={4}
          />
          <Text color="gray.600">Loading game details...</Text>
        </Flex>
      </Container>
    );
  }
  
  return (
    <Box py={4}>
      {/* Breadcrumbs */}
      <Container maxW="7xl">
        <Breadcrumb 
          spacing="8px" 
          separator={<ChevronRightIcon color="gray.500" />} 
          mb={4}
          fontSize="sm"
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={NextLink} href="/games" color="gray.500" _hover={{ color: "gray.700" }}>
              Games
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={NextLink} href={`/games/${gameId}`} color="gray.500" _hover={{ color: "gray.700" }}>
              vs. {game?.opponent}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text color="gray.500">Create Lineup</Text>
          </BreadcrumbItem>
        </Breadcrumb>
        
        {/* Page Header */}
        <Flex 
          justify="space-between" 
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          mb={6}
        >
          <Box mb={{ base: 4, md: 0 }}>
            <Heading size="lg">
              Create Game Lineup
            </Heading>
            <Text color="gray.500" mt={1}>
              {stage === 'create' ? 'Configure lineup settings' : 'Fine-tune player positions'}
            </Text>
          </Box>
          
          {stage === 'edit' && (
            <Flex gap={3}>
              <Button 
                variant="outline" 
                onClick={() => setStage('create')}
                leftIcon={<ChevronLeftIcon />}
              >
                Back to Settings
              </Button>
              <Button 
                colorScheme="primary" 
                onClick={handleSaveLineup}
              >
                Save Lineup
              </Button>
            </Flex>
          )}
        </Flex>
      </Container>
      
      {/* Main Content */}
      {stage === 'create' && game && (
        <GameLineupCreator 
          game={game}
          players={players}
          onLineupGenerated={handleLineupGenerated}
        />
      )}
      
      {stage === 'edit' && lineup && (
        <Container maxW="7xl">
          <FairPlayChecker 
            validateLineup={validateLineup}
            fairPlayIssues={fairPlayIssues}
            initialValidation={true}
          />
          
          <Box mb={6}>
            <LineupGridSpreadsheet 
              lineup={lineup}
              activePosition={activePosition}
              activeInning={activeInning}
              onCellClick={handleCellClick}
              players={players}
            />
          </Box>
          
          <Flex justify="flex-end" mb={8} mt={4}>
            <Button 
              colorScheme="primary" 
              size="lg"
              onClick={handleSaveLineup}
            >
              Save Lineup
            </Button>
          </Flex>
        </Container>
      )}
    </Box>
  );
}

export default withTeam(CreateGameLineupPage);