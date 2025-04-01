"use client";

import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Container, 
  useColorModeValue,
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel
} from '@chakra-ui/react';
import { useGames } from '../../hooks/use-games';
import { useTeamContext } from '../../contexts/team-context';
import { withTeam } from '../../contexts/team-context';
import GameList from '../../components/games/game-list';

/**
 * Games listing page component with tabbed interface
 * Shows all games organized by upcoming and past
 */
function GamesPage() {
  const { currentTeam } = useTeamContext();
  const { 
    upcomingGames, 
    pastGames, 
    isLoading, 
    error, 
    deleteGame,
    refreshGames
  } = useGames();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");

  // Handle deleting a game
  const handleDeleteGame = (gameId: string) => {
    const success = deleteGame(gameId);
    if (success) {
      refreshGames();
    } else {
      alert('Failed to delete game');
    }
  };
  
  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <Flex direction="column" width="full">
          {/* Header */}
          <Heading mb={2}>Team Schedule</Heading>
          {currentTeam && (
            <Text color="gray.500" fontSize="md" mb={6}>
              {currentTeam.name} • {currentTeam.ageGroup} • {currentTeam.season}
            </Text>
          )}
          
          {/* Tabbed Interface */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Upcoming Games</Tab>
              <Tab>Past Games</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <GameList
                  games={upcomingGames}
                  title="Upcoming Games"
                  isLoading={isLoading}
                  error={error}
                  onDeleteGame={handleDeleteGame}
                  isUpcoming={true}
                  teamId={currentTeam?.id}
                />
              </TabPanel>

              <TabPanel px={0}>
                <GameList 
                  games={pastGames} 
                  title="Past Games" 
                  isLoading={isLoading}
                  error={error}
                  onDeleteGame={handleDeleteGame}
                  isUpcoming={false}
                  teamId={currentTeam?.id}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Container>
    </Box>
  );
}

// Wrap with withTeam HOC to ensure a team is selected
export default withTeam(GamesPage);