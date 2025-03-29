import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Badge,
  Divider,
  useColorModeValue,
  Tooltip,
  Select
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Player } from '../../../types/player';
import { Position } from '../../../types/lineup';
import PositionBadge from '../../common/position-badge';

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
  onChange?: (playerId: string) => void;
  
  /**
   * Whether the selector is disabled
   */
  isDisabled?: boolean;
  
  /**
   * The position this selector is for
   * Used to determine if a player is suited for the position
   */
  position?: Position;
  
  /**
   * Callback when a player is selected from the list view
   */
  onPlayerSelect?: (playerId: string) => void;
  
  /**
   * Currently selected position (for filtering and highlighting)
   */
  selectedPosition?: Position;
  
  /**
   * Whether to use the list view instead of dropdown
   */
  useListView?: boolean;
}

/**
 * Component for selecting players for positions
 * Supports both dropdown and list view modes
 */
const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerId,
  onChange,
  isDisabled = false,
  position,
  onPlayerSelect,
  selectedPosition,
  useListView = false
}) => {
  // Search state (for list view)
  const [searchQuery, setSearchQuery] = useState('');
  
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const activePlayers = players.filter(player => player.active);
  
  // Helper to determine if position is primary for player
  const isPrimaryPosition = (player: Player, pos?: Position): boolean => {
    if (!pos) return false;
    return player.primaryPositions.includes(pos);
  };
  
  // Helper to determine if position is secondary for player
  const isSecondaryPosition = (player: Player, pos?: Position): boolean => {
    if (!pos) return false;
    return player.secondaryPositions.includes(pos);
  };
  
  // Filter players based on search query (for list view)
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return activePlayers;
    
    const query = searchQuery.toLowerCase();
    return activePlayers.filter(player => 
      player.firstName.toLowerCase().includes(query) || 
      player.lastName.toLowerCase().includes(query) || 
      player.jerseyNumber.toString().includes(query)
    );
  }, [activePlayers, searchQuery]);
  
  // Sort players: first by position match, then by jersey number
  const sortedPlayers = useMemo(() => {
    const playersToSort = useListView ? filteredPlayers : activePlayers;
    const posToUse = selectedPosition || position;
    
    return [...playersToSort].sort((a, b) => {
      if (posToUse) {
        // Primary positions first
        const aIsPrimary = isPrimaryPosition(a, posToUse);
        const bIsPrimary = isPrimaryPosition(b, posToUse);
        
        if (aIsPrimary && !bIsPrimary) return -1;
        if (!aIsPrimary && bIsPrimary) return 1;
        
        // Then secondary positions
        const aIsSecondary = isSecondaryPosition(a, posToUse);
        const bIsSecondary = isSecondaryPosition(b, posToUse);
        
        if (aIsSecondary && !bIsSecondary) return -1;
        if (!aIsSecondary && bIsSecondary) return 1;
      }
      
      // If same position category, sort by jersey number
      return a.jerseyNumber - b.jerseyNumber;
    });
  }, [useListView, filteredPlayers, activePlayers, selectedPosition, position]);
  
  // Get position type (primary, secondary, new) for a player
  const getPositionType = (player: Player, pos?: Position): 'primary' | 'secondary' | 'new' => {
    if (!pos) return 'new';
    
    if (isPrimaryPosition(player, pos)) {
      return 'primary';
    } else if (isSecondaryPosition(player, pos)) {
      return 'secondary';
    } else {
      return 'new';
    }
  };
  
  // Get badge color based on position type
  const getBadgeColor = (type: 'primary' | 'secondary' | 'new'): string => {
    switch (type) {
      case 'primary': return 'green';
      case 'secondary': return 'blue';
      case 'new': return 'yellow';
    }
  };
  
  // Get player position match badge
  const getPositionBadge = (player: Player, pos?: Position) => {
    if (!pos) return null;
    
    const positionType = getPositionType(player, pos);
    const badgeColor = getBadgeColor(positionType);
    
    const labels = {
      primary: 'Primary position',
      secondary: 'Secondary position',
      new: 'Player doesn\'t usually play this position'
    };
    
    return (
      <Tooltip label={labels[positionType]} placement="top">
        <Badge colorScheme={badgeColor} ml={1} fontSize="xs">
          {positionType === 'primary' ? 'Primary' : 
           positionType === 'secondary' ? 'Secondary' : 'New'}
        </Badge>
      </Tooltip>
    );
  };
  
  // Handle dropdown change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Get currently selected player
  const selectedPlayer = sortedPlayers.find(p => p.id === selectedPlayerId);
  
  // List View mode
  if (useListView) {
    return (
      <Box>
        {/* Search Box */}
        <InputGroup mb={3}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Search players..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="sm"
            bg={useColorModeValue('white', 'gray.800')}
          />
        </InputGroup>
        
        {/* Position Selector Header */}
        {selectedPosition && (
          <Flex align="center" mb={2} pb={2} borderBottomWidth="1px">
            <Text fontSize="sm" fontWeight="bold" mr={2}>
              Select player for:
            </Text>
            <PositionBadge position={selectedPosition} />
          </Flex>
        )}
        
        {/* Player List */}
        <Box 
          maxH="300px" 
          overflowY="auto" 
          pr={2}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: useColorModeValue('gray.300', 'gray.600'),
              borderRadius: '24px',
            },
          }}
        >
          {sortedPlayers.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No players available
            </Text>
          ) : (
            <VStack spacing={2} align="stretch">
              {sortedPlayers.map(player => {
                const posToUse = selectedPosition || position;
                const positionType = getPositionType(player, posToUse);
                const badgeColor = getBadgeColor(positionType);
                
                return (
                  <Flex
                    key={player.id}
                    p={2}
                    borderRadius="md"
                    cursor="pointer"
                    align="center"
                    bg={useColorModeValue('gray.50', 'gray.800')}
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                    onClick={() => onPlayerSelect && onPlayerSelect(player.id)}
                  >
                    {/* Jersey Number */}
                    <Flex
                      justify="center"
                      align="center"
                      bg={useColorModeValue('gray.200', 'gray.700')}
                      borderRadius="full"
                      boxSize="30px"
                      mr={2}
                      fontWeight="bold"
                      fontSize="sm"
                    >
                      {player.jerseyNumber}
                    </Flex>
                    
                    {/* Player Name */}
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium">
                        {player.firstName} {player.lastName}
                      </Text>
                      
                      {/* Position Tags */}
                      <Flex mt={1} gap={1} wrap="wrap">
                        {posToUse && (
                          <Badge size="sm" colorScheme={badgeColor} fontSize="2xs">
                            {positionType === 'primary' ? 'Primary' : 
                             positionType === 'secondary' ? 'Secondary' : 'New Position'}
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                );
              })}
            </VStack>
          )}
        </Box>
      </Box>
    );
  }
  
  // Dropdown View mode (original behavior)
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