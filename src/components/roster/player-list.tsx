"use client";

import React, { useState, useMemo } from 'react';
import NextLink from 'next/link';
import {
  Box,
  SimpleGrid,
  Text,
  Flex,
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Player, Position } from '../../types/player';
import PlayerCard from './player-card';

interface PlayerListProps {
  /**
   * Players to display in the list
   */
  players: Player[];
  
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Error message to display (if any)
   */
  error?: string | null;
  
  /**
   * Called when a player is deleted
   */
  onDeletePlayer?: (playerId: string) => void;
  
  /**
   * Called when a player's active status is toggled
   */
  onToggleActive?: (playerId: string) => void;
  
  /**
   * Whether to show inactive players (defaults to false)
   */
  showInactive?: boolean;
  
  /**
   * Filter by position (optional)
   */
  positionFilter?: Position | null;
  
  /**
   * Team ID (for creating new players)
   */
  teamId?: string;

  /**
   * Search query to filter players
   */
  searchQuery?: string;
}

/**
 * Component for displaying a list of players
 */
export default function PlayerList({
  players,
  isLoading = false,
  error = null,
  onDeletePlayer,
  onToggleActive,
  showInactive = false,
  positionFilter = null,
  teamId,
  searchQuery = ''
}: PlayerListProps) {
  // State for search query (if not provided as prop)
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Use prop searchQuery if provided, otherwise use local state
  const effectiveSearchQuery = searchQuery || localSearchQuery;
  
  // Filter players based on active status, position filter, and search query
  const filteredPlayers = useMemo(() => {
    // Apply active filter
    let result = showInactive ? players : players.filter(player => player.active);
    
    // Apply position filter if specified
    if (positionFilter) {
      result = result.filter(player => 
        player.primaryPositions.includes(positionFilter) || 
        player.secondaryPositions.includes(positionFilter)
      );
    }
    
    // Apply search filter
    if (effectiveSearchQuery.trim()) {
      const query = effectiveSearchQuery.toLowerCase();
      result = result.filter(player => 
        player.firstName.toLowerCase().includes(query) || 
        player.lastName.toLowerCase().includes(query) ||
        player.jerseyNumber.toString().includes(query)
      );
    }
    
    // Sort by jersey number
    return result.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }, [players, showInactive, positionFilter, effectiveSearchQuery]);
  
  // Handle search input when using local state
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };
  
  // Background color for empty state
  const emptyStateBg = useColorModeValue('gray.50', 'gray.700');
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading players...</Text>
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  // Render search input if searchQuery prop is not provided
  const renderSearchInput = () => {
    if (searchQuery !== undefined) return null;
    
    return (
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Search players by name or jersey number..." 
            value={localSearchQuery}
            onChange={handleSearchChange}
          />
        </InputGroup>
      </Box>
    );
  };
  
  return (
    <Box>
      {renderSearchInput()}
      
      {filteredPlayers.length === 0 ? (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          py={12} 
          bg={emptyStateBg} 
          borderRadius="md"
          textAlign="center"
        >
          <Icon 
            viewBox="0 0 24 24" 
            boxSize={12} 
            color="gray.400" 
            mb={4}
          >
            <path
              fill="currentColor"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </Icon>
          <Text fontSize="lg" fontWeight="medium" color="gray.700" mb={1}>
            No players found
          </Text>
          <Text color="gray.500" fontSize="sm" maxW="md" mb={players.length === 0 ? 6 : 0}>
            {players.length === 0
              ? 'Get started by creating a new player.'
              : 'Try adjusting your search or filters.'}
          </Text>
          
          {players.length === 0 && (
            <NextLink href={teamId ? `/roster/new?teamId=${teamId}` : '/roster/new'} passHref>
              <Box 
                as="a"
                px={4}
                py={2}
                bg="primary.600"
                color="white"
                fontWeight="medium"
                borderRadius="md"
                _hover={{ bg: "primary.700" }}
                display="inline-flex"
                alignItems="center"
              >
                <Box as="span" mr={2} fontSize="lg">+</Box>
                Add Player
              </Box>
            </NextLink>
          )}
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onDelete={onDeletePlayer}
              onToggleActive={onToggleActive}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}