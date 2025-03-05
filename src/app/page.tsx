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

// Mock data (would come from hooks in the real implementation)
const upcomingGames = [
  {
    id: '1',
    opponent: 'Eagles',
    date: 'Mon, Mar 10 at 6:00 PM',
    location: 'Home Field',
    lineupStatus: 'ready'
  },
  {
    id: '2',
    opponent: 'Tigers',
    date: 'Mon, Mar 17 at 5:30 PM',
    location: 'Central Park',
    lineupStatus: 'notCreated'
  }
];

const fairPlayMetrics = {
  overall: 86,
  playingTime: 92,
  positionVariety: 78
};

export default function Dashboard() {
  const cardBg = useColorModeValue('white', 'gray.700');
  
  return (
    <Box px={{ base: 4, md: 6, lg: 8 }} py={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Dashboard</Heading>
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
            <VStack spacing={4} align="stretch">
              {upcomingGames.map(game => (
                <Box key={game.id} p={4} borderWidth="1px" borderRadius="md" bg={cardBg}>
                  <Flex justify="space-between" align="flex-start">
                    <Box>
                      <Heading size="sm" mb={1}>vs. {game.opponent}</Heading>
                      <HStack spacing={2} color="gray.500" fontSize="sm">
                        <Icon as={CalendarIcon} />
                        <Text>{game.date}</Text>
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
          </Card>
        </Box>
        
        {/* Fair Play Metrics Card */}
        <Card title="Fair Play Metrics">
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
        </Card>
      </SimpleGrid>
    </Box>
  );
}