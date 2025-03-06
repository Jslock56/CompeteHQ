'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { 
  Box, 
  Flex, 
  Text, 
  Heading, 
  Input, 
  InputGroup, 
  InputLeftElement, 
  VStack, 
  Button, 
  Divider, 
  Center, 
  Icon, 
  Link, 
  Skeleton,
  useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, CalendarIcon } from '@chakra-ui/icons';
import { Game } from '../../types/game';
import GameCard from './game-card';

interface GameListProps {
  /**
   * Games to display in the list
   */
  games: Game[];
  
  /**
   * Title for the list section
   */
  title: string;
  
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Error message to display (if any)
   */
  error?: string | null;
  
  /**
   * Called when a game is deleted
   */
  onDeleteGame?: (gameId: string) => void;
  
  /**
   * Whether this is displaying upcoming games
   */
  isUpcoming?: boolean;
  
  /**
   * Team ID (for creating new games)
   */
  teamId?: string;
  
  /**
   * Whether to show empty state
   */
  showEmptyState?: boolean;
}

/**
 * Component for displaying a list of games
 */
const GameList: React.FC<GameListProps> = ({
  games,
  title,
  isLoading = false,
  error = null,
  onDeleteGame,
  isUpcoming = false,
  teamId,
  showEmptyState = true,
}) => {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter games based on search query
  const filteredGames = searchQuery.trim() 
    ? games.filter(game => 
        game.opponent.toLowerCase().includes(searchQuery.toLowerCase()) || 
        game.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : games;
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Background colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('white', 'gray.800');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');
  
  if (isLoading) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={cardBg} mb={6}>
        <Box p={4} borderBottomWidth="1px" borderColor={dividerColor} bg={headerBg}>
          <Skeleton height="24px" width="200px" mb={4} />
          <Skeleton height="36px" />
        </Box>
        <VStack spacing={4} p={4} align="stretch">
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </VStack>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="red.50" mb={6} p={4}>
        <Flex align="center">
          <Box color="red.500" mr={3}>
            <Icon boxSize={5} />
          </Box>
          <Text color="red.700">{error}</Text>
        </Flex>
      </Box>
    );
  }
  
  if (games.length === 0 && showEmptyState) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={cardBg} mb={6}>
        <Flex p={4} borderBottomWidth="1px" borderColor={dividerColor} justify="space-between" align="center">
          <Heading size="md">{title}</Heading>
          {isUpcoming && teamId && (
            <NextLink href={`/games/new?teamId=${teamId}`} passHref>
              <Button as="a" colorScheme="primary" leftIcon={<AddIcon />} size="sm">
                Add Game
              </Button>
            </NextLink>
          )}
        </Flex>
        
        <Center py={12} flexDirection="column">
          <Icon as={CalendarIcon} boxSize={12} color="gray.400" mb={4} />
          <Heading size="sm" mb={2}>No games found</Heading>
          <Text color="gray.500" mb={6}>
            {isUpcoming
              ? 'Get started by scheduling your first game.'
              : 'Past games will appear here when available.'}
          </Text>
          {isUpcoming && teamId && (
            <NextLink href={`/games/new?teamId=${teamId}`} passHref>
              <Button as="a" colorScheme="primary" leftIcon={<AddIcon />}>
                Schedule Game
              </Button>
            </NextLink>
          )}
        </Center>
      </Box>
    );
  }
  
  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={cardBg} mb={6}>
      <Box p={4} borderBottomWidth="1px" borderColor={dividerColor}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">{title}</Heading>
          {isUpcoming && teamId && (
            <NextLink href={`/games/new?teamId=${teamId}`} passHref>
              <Button as="a" colorScheme="primary" leftIcon={<AddIcon />} size="sm">
                Add Game
              </Button>
            </NextLink>
          )}
        </Flex>
        
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search games by opponent or location..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </InputGroup>
      </Box>
      
      {filteredGames.length === 0 ? (
        <Center py={8}>
          <Text color="gray.500">No games match your search.</Text>
        </Center>
      ) : (
        <VStack spacing={0} align="stretch" divider={<Divider />}>
          {filteredGames.map((game) => (
            <Box key={game.id} p={4}>
              <GameCard
                game={game}
                onDelete={onDeleteGame}
              />
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default GameList;