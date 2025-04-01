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
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel
} from '@chakra-ui/react';
import { ChevronRightIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
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
  
  // State for the active position and inning in the editor
  const [activePosition, setActivePosition] = useState<Position>('P');
  const [activeInning, setActiveInning] = useState<number>(1);
  
  // Get available players
  const players = storageService.player.getPlayersByTeam(currentTeam?.id || '');
  
  // Current lineup state (existing or generated)
  const [currentLineup, setCurrentLineup] = useState<Lineup | null>(null);
  
  // Track active tab (0 = Settings, 1 = Edit Lineup)
  const [activeTab, setActiveTab] = useState(0);
  
  // Initialize the lineup hook
  const {
    lineup,
    assignPlayerToPosition,
    swapPlayers,
    validateLineup,
    saveLineup,
    fairPlayIssues,
    initializeLineup
  } = useLineup({
    gameId,
    teamId: currentTeam?.id || '',
    innings: game?.innings,
    initialLineup: currentLineup || undefined,
    players,
  });
  
  // Log actual innings value to verify
  console.log("Game innings in create page:", {
    gameInnings: game?.innings,
    lineupInnings: lineup?.innings?.length
  });
  
  // Handle lineup generation from the creator component
  const handleLineupGenerated = (newLineup: Lineup) => {
    setCurrentLineup(newLineup);
    // Switch to edit tab
    setActiveTab(1);
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
      console.log('Saving lineup to MongoDB database...');
      
      // Save lineup directly to MongoDB via API
      try {
        // Use specific gameLineups endpoint to ensure it goes to the right collection
        const apiUrl = `/api/games/${gameId}/lineup`;
        const lineupToSave = {
          ...lineup,
          gameId,
          teamId: currentTeam?.id,
          updatedAt: Date.now(),
          collectionType: 'gameLineups' // Flag to tell API to use gameLineups collection
        };
        
        console.log(`Saving game lineup to MongoDB via API at ${apiUrl}`);
        const response = await fetch(apiUrl, {
          method: lineup.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lineup: lineupToSave }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.lineup) {
            console.log('Successfully saved game lineup via API');
            
            toast({
              title: "Lineup saved",
              description: "The lineup has been saved successfully to the database.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            
            // Navigate back to game detail page
            router.push(`/games/${gameId}`);
            return;
          } else {
            console.warn('API response was OK but data format was unexpected:', data);
          }
        } else {
          console.warn(`API returned status ${response.status} when saving game lineup`);
          try {
            const errorData = await response.json();
            console.warn('Error details:', errorData);
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
        }
      } catch (apiError) {
        console.error('Error during direct API save:', apiError);
      }
      
      // Fall back to the regular save method if direct API call fails
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
          
          // Save the updated game via API
          try {
            const gameApiUrl = `/api/games/${gameId}`;
            const gameResponse = await fetch(gameApiUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ game: updatedGame }),
            });
            
            if (!gameResponse.ok) {
              console.error('Failed to update game with lineup ID via API');
              
              // Fallback to local storage
              const success = storageService.game.saveGame(updatedGame);
              if (!success) {
                console.error('Failed to update game with lineup ID in local storage');
              }
            }
          } catch (gameApiError) {
            console.error('Error updating game with lineup ID:', gameApiError);
          }
        }
        
        toast({
          title: "Lineup saved",
          description: "The lineup has been saved successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Navigate back to game detail page
        router.push(`/games/${gameId}`);
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
  
  // Load existing lineup if available
  useEffect(() => {
    if (game?.lineupId) {
      const loadExistingLineup = async () => {
        try {
          console.log(`Loading existing lineup for game: ${gameId}, lineupId: ${game.lineupId}`);
          
          // Try to load from API
          const response = await fetch(`/api/games/${gameId}/lineup`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.lineup) {
              console.log("Loading existing lineup from API:", data.lineup);
              
              // Ensure lineup has correct number of innings
              const updatedLineup = ensureCorrectInnings(data.lineup, game.innings);
              
              // Set as current lineup
              setCurrentLineup(updatedLineup);
              
              // Go directly to edit tab
              setActiveTab(1);
              
              toast({
                title: "Lineup loaded",
                description: "Existing lineup loaded for editing.",
                status: "info",
                duration: 3000,
                isClosable: true,
              });
              return;
            }
          }
          
          // If API fails, try local storage
          const existingLineup = storageService.lineup.getLineup(game.lineupId);
          
          if (existingLineup) {
            console.log("Loading existing lineup from local storage:", existingLineup);
            
            // Ensure lineup has correct number of innings
            const updatedLineup = ensureCorrectInnings(existingLineup, game.innings);
            
            // Set as current lineup
            setCurrentLineup(updatedLineup);
            
            // Go directly to edit tab
            setActiveTab(1);
            
            toast({
              title: "Lineup loaded",
              description: "Existing lineup loaded from local storage.",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
          } else {
            console.warn(`Lineup with ID ${game.lineupId} not found in storage`);
          }
        } catch (error) {
          console.error("Error loading existing lineup:", error);
          toast({
            title: "Error",
            description: "Failed to load existing lineup.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      };
      
      loadExistingLineup();
    }
  }, [game, gameId, toast]);
  
  // Helper function to ensure lineup has correct number of innings
  const ensureCorrectInnings = (lineup: Lineup, expectedInnings: number): Lineup => {
    if (!lineup.innings || lineup.innings.length !== expectedInnings) {
      console.log(`Fixing lineup innings count. Current: ${lineup.innings?.length || 0}, Expected: ${expectedInnings}`);
      const updatedLineup = {...lineup};
      
      // Create or update innings array
      updatedLineup.innings = Array.from({ length: expectedInnings }, (_, i) => {
        const inningNumber = i + 1;
        // Use existing inning data if available, otherwise create new inning
        const existingInning = lineup.innings?.find(inn => inn.inning === inningNumber);
        
        // If we don't have an existing inning, create one with empty positions
        if (!existingInning) {
          console.log(`Creating new inning ${inningNumber} for lineup`);
          return {
            inning: inningNumber,
            positions: []
          };
        }
        
        // Make sure existing inning has the correct inning number
        if (existingInning.inning !== inningNumber) {
          console.log(`Fixing inning number: ${existingInning.inning} -> ${inningNumber}`);
          return {
            ...existingInning,
            inning: inningNumber
          };
        }
        
        return existingInning;
      });
      
      console.log(`Updated lineup now has ${updatedLineup.innings.length} innings`);
      return updatedLineup;
    }
    
    return lineup;
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
          as={NextLink}
          href="/games"
          mt={4} 
        >
          Back to Games
        </Button>
      </Container>
    );
  }
  
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
            <Text color="gray.500">{game?.lineupId ? 'Edit Lineup' : 'Create Lineup'}</Text>
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
              {game?.lineupId ? 'Edit Game Lineup' : 'Create Game Lineup'}
            </Heading>
            <Text color="gray.500" mt={1}>
              Create and manage lineup for game against {game?.opponent}
            </Text>
          </Box>
          
          <Flex gap={3}>
            {activeTab === 1 && (
              <Button 
                colorScheme="primary" 
                onClick={handleSaveLineup}
              >
                Save Lineup
              </Button>
            )}
            <Button 
              as={NextLink}
              href={`/games/${gameId}`}
              variant="outline" 
            >
              Back to Game
            </Button>
          </Flex>
        </Flex>
        
        {/* Main Content - Tabbed interface */}
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="primary" mb={8}>
          <TabList>
            <Tab fontWeight="medium">
              <Box mr={2}>⚙️</Box> Lineup Settings
            </Tab>
            <Tab fontWeight="medium" isDisabled={!currentLineup && !lineup}>
              <Box mr={2}>{game?.lineupId ? <EditIcon /> : "🏆"}</Box> Edit Positions
            </Tab>
          </TabList>
          
          <TabPanels mt={4}>
            {/* Settings Tab */}
            <TabPanel p={0}>
              {game && (
                <GameLineupCreator 
                  game={game}
                  players={players}
                  onLineupGenerated={handleLineupGenerated}
                  existingLineup={currentLineup}
                />
              )}
            </TabPanel>
            
            {/* Edit Lineup Tab */}
            <TabPanel p={0}>
              {lineup && (
                <>
                  <FairPlayChecker 
                    validateLineup={validateLineup}
                    fairPlayIssues={fairPlayIssues}
                    initialValidation={true}
                  />
                  
                  <Box mb={6}>
                    {/* Make sure lineup has the correct number of innings */}
                    {(() => {
                      if (lineup.innings.length !== game?.innings) {
                        console.log(`Fixing innings count for spreadsheet. Expected: ${game?.innings}, Actual: ${lineup.innings.length}`);
                        // Force correct number of innings
                        lineup.innings = Array.from({ length: game?.innings || 7 }, (_, i) => {
                          const inningNum = i + 1;
                          const existingInning = lineup.innings.find(inn => inn.inning === inningNum);
                          return existingInning || { inning: inningNum, positions: [] };
                        });
                      }
                      return null;
                    })()}
                    
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
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}

export default withTeam(CreateGameLineupPage);