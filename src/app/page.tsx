// src/app/page.tsx (Dashboard)
"use client";

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  SimpleGrid,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  Progress,
  Icon,
  Badge,
  Link,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, CalendarIcon, TimeIcon, StarIcon } from '@chakra-ui/icons';
import { Card } from '../components/common/card';

// Use hooks for real data instead of mock data
import { useTeamContext } from '../contexts/team-context';
import { useGames } from '../hooks/use-games';
import { storageService } from '../services/storage/enhanced-storage';

export default function Dashboard() {
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Get current team data
  const { currentTeam, isLoading: teamLoading } = useTeamContext();
  const { games, isLoading: gamesLoading } = useGames();
  
  // Filter for upcoming games
  const upcomingGames = games
    .filter(game => game.date > Date.now())
    .sort((a, b) => a.date - b.date)
    .slice(0, 3); // Show only the next 3 games
    
  // Calculate fair play metrics (these would come from actual data in a real app)
  // For now we'll just show placeholder metrics based on available data
  const fairPlayMetrics = {
    overall: currentTeam ? 86 : 0,
    playingTime: currentTeam ? 92 : 0,
    positionVariety: currentTeam ? 78 : 0
  };
  
  // Check if lineups exist for each game
  const gamesWithLineupStatus = upcomingGames.map(game => {
    const hasLineup = game.lineupId && storageService.lineup.getLineup(game.lineupId);
    return {
      ...game,
      lineupStatus: hasLineup ? 'ready' : 'notCreated'
    };
  });
  
  return (
    <Box px={{ base: 4, md: 6, lg: 8 }} py={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">{currentTeam ? `${currentTeam.name} Dashboard` : 'Dashboard'}</Heading>
        <HStack spacing={3}>
          <NextLink href="/games/new" passHref>
            <Button as="a" leftIcon={<CalendarIcon />} colorScheme="blue">
              New Game
            </Button>
          </NextLink>
          <NextLink href="/practices/new" passHref>
            <Button as="a" leftIcon={<AddIcon />} colorScheme="green">
              New Practice
            </Button>
          </NextLink>
        </HStack>
      </Flex>
      
      {/* Content Grid */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {/* Upcoming Games Card */}
        <Box gridColumn={{ md: 'span 2' }}>
          <Card
            title="Upcoming Games"
            action={
              <NextLink href="/games" passHref>
                <Button as="a" variant="link" size="sm" colorScheme="primary">
                  View all
                </Button>
              </NextLink>
            }
          >
            {gamesLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Text color="gray.500">Loading games...</Text>
              </Flex>
            ) : gamesWithLineupStatus.length === 0 ? (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                py={8} 
                bg="gray.50" 
                borderRadius="md"
              >
                <Box color="gray.400" mb={3}>
                  <CalendarIcon boxSize={10} />
                </Box>
                <Heading as="h3" size="sm" fontWeight="medium" mb={1}>
                  No upcoming games
                </Heading>
                <Text color="gray.500" fontSize="sm" mb={4}>
                  Schedule your first game to get started
                </Text>
                <NextLink href="/games/new" passHref>
                  <Button as="a" size="sm" colorScheme="primary">
                    Schedule Game
                  </Button>
                </NextLink>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                {gamesWithLineupStatus.map(game => (
                  <Box key={game.id} p={4} borderWidth="1px" borderRadius="md" bg={cardBg}>
                    <Flex justify="space-between" align="flex-start">
                      <Box>
                        <Heading size="sm" mb={1}>vs. {game.opponent}</Heading>
                        <HStack spacing={2} color="gray.500" fontSize="sm">
                          <Icon as={CalendarIcon} />
                          <Text>
                            {new Date(game.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })} at {new Date(game.date).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        </HStack>
                        <HStack spacing={2} color="gray.500" fontSize="sm" mt={1}>
                          <Icon as={TimeIcon} />
                          <Text>{game.location}</Text>
                        </HStack>
                      </Box>
                      {game.lineupStatus === 'ready' ? (
                        <Badge colorScheme="green">Lineup Ready</Badge>
                      ) : (
                        <NextLink href={`/lineup/new?gameId=${game.id}`} passHref>
                          <Button as="a" size="sm" colorScheme="primary" variant="outline">
                            Create Lineup
                          </Button>
                        </NextLink>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </Card>
        </Box>
        
        {/* Fair Play Metrics Card */}
        <Card title="Fair Play Metrics">
          {!currentTeam ? (
            <Flex 
              direction="column" 
              align="center" 
              justify="center" 
              py={8} 
              bg="gray.50" 
              borderRadius="md"
            >
              <Text color="gray.500" fontSize="sm">
                Select a team to view metrics
              </Text>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              <Box>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">Overall Score</Text>
                  <Text fontSize="sm" fontWeight="medium">{fairPlayMetrics.overall}%</Text>
                </Flex>
                <Progress value={fairPlayMetrics.overall} colorScheme="blue" size="sm" borderRadius="full" />
              </Box>
              
              <Box>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">Playing Time</Text>
                  <Text fontSize="sm" fontWeight="medium">{fairPlayMetrics.playingTime}%</Text>
                </Flex>
                <Progress value={fairPlayMetrics.playingTime} colorScheme="green" size="sm" borderRadius="full" />
              </Box>
              
              <Box>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">Position Variety</Text>
                  <Text fontSize="sm" fontWeight="medium">{fairPlayMetrics.positionVariety}%</Text>
                </Flex>
                <Progress value={fairPlayMetrics.positionVariety} colorScheme="purple" size="sm" borderRadius="full" />
              </Box>
              
              <NextLink href="/tracking" passHref>
                <Link color="primary.600" fontSize="sm" fontWeight="medium">
                  View detailed metrics
                </Link>
              </NextLink>
            </VStack>
          )}
        </Card>
      </SimpleGrid>
    </Box>
  );
}