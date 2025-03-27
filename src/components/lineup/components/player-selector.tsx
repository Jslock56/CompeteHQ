'use client';

import React from 'react';
import { 
  Select, 
  Text, 
  Box, 
  Flex, 
  Badge, 
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { Player } from '../../types/player';
import { Position } from '../../types/lineup';

interface PlayerSelectorProps {
  /**
   * List of available players
   */
  players: Player[];
  
  /**
   * ID of the currently selected player (if any)
   */
  selectedPlayerId?: string;
  
  /**
   * Callback when selection changes
   */
  onChange: (playerId: string) => void;
  
  /**
   * Whether the selector is disabled
   */
  isDisabled?: boolean;
  
  /**
   * The position this selector is for
   * Used to determine if a player is suited for the position
   */
  position?: Position;
}

/**
 * Dropdown component for selecting a player
 */
const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerId,
  onChange,
  isDisabled = false,
  position
}) => {
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const activePlayers = players.filter(player => player.active);
  
  // Helper to determine if position is primary for player
  const isPrimaryPosition = (player: Player, pos?: Position): boolean => {
    if (!pos) return false;
    return player.primaryPositions.includes(pos as any);
  };
  
  // Helper to determine if position is secondary for player
  const isSecondaryPosition = (player: Player, pos?: Position): boolean => {
    if (!pos) return false;
    return player.secondaryPositions.includes(pos as any);
  };
  
  // Sort players: first by position match, then by jersey number
  const sortedPlayers = [...activePlayers].sort((a, b) => {
    if (position) {
      // Primary positions first
      const aIsPrimary = isPrimaryPosition(a, position);
      const bIsPrimary = isPrimaryPosition(b, position);
      
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      
      // Then secondary positions
      const aIsSecondary = isSecondaryPosition(a, position);
      const bIsSecondary = isSecondaryPosition(b, position);
      
      if (aIsSecondary && !bIsSecondary) return -1;
      if (!aIsSecondary && bIsSecondary) return 1;
    }
    
    // If same position category, sort by jersey number
    return a.jerseyNumber - b.jerseyNumber;
  });
  
  // Get player position match badge
  const getPositionBadge = (player: Player) => {
    if (!position) return null;
    
    if (isPrimaryPosition(player, position)) {
      return (
        <Tooltip label="Primary position" placement="top">
          <Badge colorScheme="green" ml={1} fontSize="xs">
            Primary
          </Badge>
        </Tooltip>
      );
    }
    
    if (isSecondaryPosition(player, position)) {
      return (
        <Tooltip label="Secondary position" placement="top">
          <Badge colorScheme="blue" ml={1} fontSize="xs">
            Secondary
          </Badge>
        </Tooltip>
      );
    }
    
    return (
      <Tooltip label="Player doesn't usually play this position" placement="top">
        <Badge colorScheme="yellow" ml={1} fontSize="xs">
          New
        </Badge>
      </Tooltip>
    );
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };
  
  // Build custom option renderer that includes jersey number and position badge
  const customOptionRenderer = (player: Player) => {
    return (
      <Flex align="center" justify="space-between" width="100%">
        <Text>
          #{player.jerseyNumber} {player.lastName}, {player.firstName}
        </Text>
        {position && getPositionBadge(player)}
      </Flex>
    );
  };
  
  // Get currently selected player
  const selectedPlayer = sortedPlayers.find(p => p.id === selectedPlayerId);
  
  return (
    <Select
      placeholder="Select player"
      value={selectedPlayerId}
      onChange={handleChange}
      isDisabled={isDisabled}
      size="sm"
    >
      <option value="">None</option>
      {sortedPlayers.map((player) => (
        <option key={player.id} value={player.id}>
          #{player.jerseyNumber} {player.lastName}, {player.firstName}
          {position && (isPrimaryPosition(player, position) ? " (P)" : 
                        isSecondaryPosition(player, position) ? " (S)" : "")}
        </option>
      ))}
    </Select>
  );
};

export default PlayerSelector;