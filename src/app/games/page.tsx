"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  SimpleGrid, 
  Flex, 
  Button, 
  HStack, 
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Container
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { useGames } from '../../hooks/use-games';
import { useTeamContext } from '../../contexts/team-context';
import { withTeam } from '../../contexts/team-context';
import GameList from '../../components/games/game-list';

/**
 * Games listing page component
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
  
  // State for filters and view options
  const [showPastGames, setShowPastGames] = useState(true);
  
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
    <Container maxW="7xl" py={8}>
      <Flex direction="column" width="full">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg">Games</Heading>
            {currentTeam && (
              <Text color="gray.500" fontSize="sm" mt={1}>
                {currentTeam.name} · {currentTeam.ageGroup} · {currentTeam.season}
              </Text>
            )}
          </Box>
          <NextLink href="/games/new" passHref>
            <Button as="a" leftIcon={<AddIcon />} colorScheme="primary">
              Add Game
            </Button>
          </NextLink>
        </Flex>
        
        {/* Stats Cards */}
        <StatGroup 
          as={SimpleGrid} 
          columns={{ base: 1, md: 3 }} 
          spacing={6} 
          mb={6}
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
        >
          {/* Upcoming Games */}
          <Stat>
            <StatLabel color="gray.500">Upcoming Games</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="semibold">
              {isLoading ? '-' : upcomingGames.length}
            </StatNumber>
          </Stat>
          
          {/* Past Games */}
          <Stat>
            <StatLabel color="gray.500">Past Games</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="semibold">
              {isLoading ? '-' : pastGames.length}
            </StatNumber>
          </Stat>
          
          {/* Games with Lineups */}
          <Stat>
            <StatLabel color="gray.500">Games with Lineups</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="semibold">
              {isLoading ? '-' : [...upcomingGames, ...pastGames].filter(game => game.lineupId).length}
            </StatNumber>
          </Stat>
        </StatGroup>
        
        {/* View Toggle */}
        <Box 
          bg="white" 
          shadow="sm" 
          borderRadius="lg" 
          p={4} 
          mb={6}
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Flex justify="space-between">
            <HStack spacing={2}>
              <Button
                onClick={() => setShowPastGames(!showPastGames)}
                variant="outline"
                size="sm"
              >
                {showPastGames ? 'Hide Past Games' : 'Show Past Games'}
              </Button>
            </HStack>
          </Flex>
        </Box>
        
        {/* Upcoming Games */}
        <GameList
          games={upcomingGames}
          title="Upcoming Games"
          isLoading={isLoading}
          error={error}
          onDeleteGame={handleDeleteGame}
          isUpcoming={true}
          teamId={currentTeam?.id}
        />
        
        {/* Past Games - conditionally shown */}
        {showPastGames && pastGames.length > 0 && (
          <GameList
            games={pastGames}
            title="Past Games"
            isLoading={isLoading}
            error={error}
            onDeleteGame={handleDeleteGame}
            isUpcoming={false}
            teamId={currentTeam?.id}
          />
        )}
      </Flex>
    </Container>
  );
}

// Wrap with withTeam HOC to ensure a team is selected
export default withTeam(GamesPage);