'use client';

import React from 'react';
import { Box, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { Position } from '../../types/lineup';
import { Player } from '../../types/player';
import PlayerSelector from './player-selector';

interface PositionCardProps {
  /**
   * The position (e.g., 'P', 'C', '1B', etc.)
   */
  position: Position;
  
  /**
   * The currently assigned player (if any)
   */
  player?: Player | null;
  
  /**
   * List of available players
   */
  availablePlayers: Player[];
  
  /**
   * Callback when a player is assigned to this position
   */
  onAssignPlayer: (position: Position, playerId: string) => void;
  
  /**
   * Whether the position is disabled for selection
   */
  isDisabled?: boolean;
  
  /**
   * Whether to show recommended players
   * Based on historical data and fair play metrics
   */
  showRecommendations?: boolean;
}

/**
 * A card representing a position in the lineup
 */
const PositionCard: React.FC<PositionCardProps> = ({
  position,
  player,
  availablePlayers,
  onAssignPlayer,
  isDisabled = false,
  showRecommendations = false
}) => {
  // Get background color for the position
  const getPositionColor = (pos: Position) => {
    const positionColors: Record<Position, { bg: string, text: string }> = {
      'P': { bg: 'red.500', text: 'white' },
      'C': { bg: 'blue.500', text: 'white' },
      '1B': { bg: 'green.500', text: 'white' },
      '2B': { bg: 'orange.500', text: 'white' },
      '3B': { bg: 'purple.500', text: 'white' },
      'SS': { bg: 'pink.500', text: 'white' },
      'LF': { bg: 'indigo.500', text: 'white' },
      'CF': { bg: 'indigo.500', text: 'white' },
      'RF': { bg: 'indigo.500', text: 'white' },
      'DH': { bg: 'cyan.500', text: 'white' },
      'BN': { bg: 'gray.500', text: 'white' }
    };
    
    return positionColors[pos] || { bg: 'gray.500', text: 'white' };
  };
  
  const positionColor = getPositionColor(position);
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  // Position names map
  const positionNames: Record<Position, string> = {
    'P': 'Pitcher',
    'C': 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    'SS': 'Shortstop',
    'LF': 'Left Field',
    'CF': 'Center Field',
    'RF': 'Right Field',
    'DH': 'Designated Hitter',
    'BN': 'Bench'
  };
  
  const handlePlayerAssign = (playerId: string) => {
    if (!isDisabled) {
      onAssignPlayer(position, playerId);
    }
  };
  
  return (
    <Box
      borderRadius="md"
      borderWidth="1px"
      borderColor={cardBorderColor}
      bg={cardBg}
      shadow="sm"
      overflow="hidden"
      opacity={isDisabled ? 0.7 : 1}
      mb={4}
    >
      {/* Position Header */}
      <Flex
        bg={positionColor.bg}
        color={positionColor.text}
        px={3}
        py={2}
        align="center"
      >
        <Text fontWeight="bold" fontSize="md">
          {position}
        </Text>
        <Text ml={2} fontSize="sm" fontWeight="medium">
          {positionNames[position]}
        </Text>
      </Flex>
      
      {/* Player Selector */}
      <Box p={3}>
        <PlayerSelector 
          players={availablePlayers}
          selectedPlayerId={player?.id}
          onChange={handlePlayerAssign}
          isDisabled={isDisabled}
          position={position}
        />
      </Box>
    </Box>
  );
};

export default PositionCard;