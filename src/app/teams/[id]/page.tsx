"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  Icon,
  Spinner,
  VStack,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronRightIcon, ExternalLinkIcon, EditIcon } from '@chakra-ui/icons';
import { FiUsers, FiCalendar, FiClock } from 'react-icons/fi';
import { useSingleTeam } from '../../../hooks/use-team';
import { Team } from '../../../types/team';
import { Player } from '../../../types/player';
import { Game } from '../../../types/game';
import { storageService } from '../../../services/storage/enhanced-storage';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/common/card';

/**
 * Team detail page component
 * Shows detailed information about a specific team
 */
export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  // Get team data
  const { team, isLoading, error, refreshTeam } = useSingleTeam(teamId);
  
  // State for related data
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  
  // Load related data (players and games)
  useEffect(() => {
    if (teamId) {
      setIsLoadingRelated(true);
      
      // Fetch players
      const teamPlayers = storageService.player.getPlayersByTeam(teamId);
      setPlayers(teamPlayers);
      
      // Fetch games
      const teamGames = storageService.game.getGamesByTeam(teamId);
      setGames(teamGames);
      
      setIsLoadingRelated(false);
    }
  }, [teamId]);
  
  // Handle set as current team
  const handleSetAsCurrent = () => {
    if (team) {
      storageService.team.setCurrentTeamId(team.id);
      router.push('/dashboard');
    }
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="60vh" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading team details...</Text>
      </Flex>
    );
  }
  
  if (error || !team) {
    return (
      <PageContainer title="Team Not Found">
        <Box p={4} borderRadius="md" bg="red.50" color="red.700" mb={6}>
          <Flex align="center">
            <Box mr={3} color="red.400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </Box>
            <Text>{error || 'Team not found'}</Text>
          </Flex>
        </Box>
        
        <NextLink href="/teams" passHref>
          <Button
            as="a"
            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
            variant="link"
            colorScheme="primary"
          >
            Back to Teams
          </Button>
        </NextLink>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title={team.name}
      subtitle={`${team.ageGroup} · ${team.season}`}
      breadcrumbs={[
        { label: 'Teams', href: '/teams' },
        { label: team.name }
      ]}
      action={
        <HStack spacing={3}>
          <Button
            onClick={handleSetAsCurrent}
            variant="outline"
          >
            Set as Current Team
          </Button>
          <NextLink href={`/teams/${team.id}/edit`} passHref>
            <Button
              as="a"
              leftIcon={<EditIcon />}
              colorScheme="primary"
            >
              Edit Team
            </Button>
          </NextLink>
        </HStack>
      }
    >
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={8}>
        {/* Players Card */}
        <Card>
          <Flex align="center">
            <Flex
              align="center"
              justify="center"
              bg="primary.100"
              color="primary.600"
              p={3}
              borderRadius="md"
              mr={5}
            >
              <Icon as={FiUsers} boxSize={6} />
            </Flex>
            <Box flex="1">
              <Text color="gray.500" fontSize="sm">Players</Text>
              <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
                {isLoadingRelated ? '...' : players.length}
              </Text>
            </Box>
          </Flex>
          <Divider my={4} />
          <NextLink href={`/roster?teamId=${team.id}`} passHref>
            <Button
              as="a"
              variant="link"
              colorScheme="primary"
              size="sm"
              rightIcon={<ChevronRightIcon />}
            >
              View roster
            </Button>
          </NextLink>
        </Card>
        
        {/* Games Card */}
        <Card>
          <Flex align="center">
            <Flex
              align="center"
              justify="center"
              bg="primary.100"
              color="primary.600"
              p={3}
              borderRadius="md"
              mr={5}
            >
              <Icon as={FiCalendar} boxSize={6} />
            </Flex>
            <Box flex="1">
              <Text color="gray.500" fontSize="sm">Games</Text>
              <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
                {isLoadingRelated ? '...' : games.length}
              </Text>
            </Box>
          </Flex>
          <Divider my={4} />
          <NextLink href={`/games?teamId=${team.id}`} passHref>
            <Button
              as="a"
              variant="link"
              colorScheme="primary"
              size="sm"
              rightIcon={<ChevronRightIcon />}
            >
              View schedule
            </Button>
          </NextLink>
        </Card>
        
        {/* Upcoming Card */}
        <Card>
          <Flex align="center">
            <Flex
              align="center"
              justify="center"
              bg="primary.100"
              color="primary.600"
              p={3}
              borderRadius="md"
              mr={5}
            >
              <Icon as={FiClock} boxSize={6} />
            </Flex>
            <Box flex="1">
              <Text color="gray.500" fontSize="sm">Upcoming Games</Text>
              <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
                {isLoadingRelated ? '...' : storageService.game.getUpcomingGames(team.id).length}
              </Text>
            </Box>
          </Flex>
          <Divider my={4} />
          <NextLink href={`/games/new?teamId=${team.id}`} passHref>
            <Button
              as="a"
              variant="link"
              colorScheme="primary"
              size="sm"
              rightIcon={<ChevronRightIcon />}
            >
              Schedule a game
            </Button>
          </NextLink>
        </Card>
      </SimpleGrid>
      
      {/* Team Details */}
      <Card mb={8}>
        <Heading size="md" mb={4}>Team Information</Heading>
        <Box>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500">Team Name</Text>
              <Text mt={1}>{team.name}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500">Age Group</Text>
              <Text mt={1}>{team.ageGroup}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500">Season</Text>
              <Text mt={1}>{team.season}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500">Created</Text>
              <Text mt={1}>{new Date(team.createdAt).toLocaleDateString()}</Text>
            </Box>
          </SimpleGrid>
        </Box>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <Heading size="md" mb={4}>Quick Actions</Heading>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
          <NextLink href={`/roster/new?teamId=${team.id}`} passHref>
            <Button as="a" w="full" variant="outline">
              Add Player
            </Button>
          </NextLink>
          <NextLink href={`/games/new?teamId=${team.id}`} passHref>
            <Button as="a" w="full" variant="outline">
              Schedule Game
            </Button>
          </NextLink>
          <NextLink href={`/practice/new?teamId=${team.id}`} passHref>
            <Button as="a" w="full" variant="outline">
              Plan Practice
            </Button>
          </NextLink>
        </SimpleGrid>
      </Card>
    </PageContainer>
  );
}