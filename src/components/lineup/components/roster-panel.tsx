import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  useColorModeValue, 
  Tooltip, 
  Icon, 
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Button
} from '@chakra-ui/react';
import { InfoIcon, SearchIcon } from '@chakra-ui/icons';
import { Player, Position } from '../../../types/player';
import { Lineup } from '../../../types/lineup';
import PositionBadge from '../../common/position-badge';

interface RosterPanelProps {
  /**
   * All available players
   */
  players: Player[];
  
  /**
   * Current lineup data
   */
  lineup: Lineup;
  
  /**
   * Currently active inning
   * For field position lineups, this is always 1
   */
  activeInning: number;
  
  /**
   * Callback when a player is selected
   */
  onPlayerSelect: (playerId: string) => void;
  
  /**
   * Currently active position (for highlighting/filtering)
   */
  activePosition?: Position;
  
  /**
   * Whether to use compact mode (smaller size for header display)
   */
  isCompact?: boolean;
}

/**
 * Panel displaying available players for selection
 */
const RosterPanel: React.FC<RosterPanelProps> = ({
  players,
  lineup,
  activeInning,
  onPlayerSelect,
  activePosition,
  isCompact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const activePlayers = players.filter(player => player.active);
  
  // Function to check if a player is already in the lineup for the active inning
  const isPlayerInInning = (playerId: string): boolean => {
    const inningData = lineup.innings.find(i => i.inning === activeInning);
    if (!inningData) return false;
    
    return inningData.positions.some(p => p.playerId === playerId);
  };
  
  // Background colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.600');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Filter players based on search
  const filteredPlayers = activePlayers.filter(player => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      player.firstName.toLowerCase().includes(query) ||
      player.lastName.toLowerCase().includes(query) ||
      player.jerseyNumber.toString().includes(query)
    );
  });
  
  // Sort by primary/secondary position match and jersey number
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (activePosition) {
      // Primary positions first
      const aIsPrimary = a.primaryPositions.includes(activePosition);
      const bIsPrimary = b.primaryPositions.includes(activePosition);
      
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      
      // Then secondary positions
      const aIsSecondary = a.secondaryPositions.includes(activePosition);
      const bIsSecondary = b.secondaryPositions.includes(activePosition);
      
      if (aIsSecondary && !bIsSecondary) return -1;
      if (!aIsSecondary && bIsSecondary) return 1;
    }
    
    // Then jersey number
    return a.jerseyNumber - b.jerseyNumber;
  });

  // Function to create position badges for tooltip
  const renderPositionBadges = (player: Player) => (
    <Box p={2}>
      <Text fontWeight="semibold" fontSize="xs" mb={1}>Primary:</Text>
      <Flex gap={1} wrap="wrap" mb={2}>
        {player.primaryPositions.map(pos => (
          <PositionBadge key={pos} position={pos} size="sm" />
        ))}
      </Flex>
      
      <Text fontWeight="semibold" fontSize="xs" mb={1}>Secondary:</Text>
      <Flex gap={1} wrap="wrap">
        {player.secondaryPositions.map(pos => (
          <PositionBadge key={pos} position={pos} size="sm" />
        ))}
      </Flex>
    </Box>
  );

  // Render different layouts based on compact mode
  if (isCompact) {
    return (
      <Box position="relative">
        <Button 
          size="sm" 
          rightIcon={<InfoIcon />} 
          onClick={() => {}} // This would toggle a roster dropdown in a real implementation
          colorScheme="blue"
        >
          Available Players ({players.length})
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      borderWidth="1px" 
      borderColor={cardBorderColor} 
      borderRadius="md" 
      height="100%"
      width="100%"
    >
      <Box p={2} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorderColor}>
        <Heading size="xs">
          Roster
        </Heading>
        <Text fontSize="xs" color="gray.500">
          Click to add
        </Text>
      </Box>
      
      {/* Search input */}
      <Box px={2} pt={2}>
        <InputGroup size="xs">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" fontSize="xs" />
          </InputLeftElement>
          <Input 
            placeholder="Search roster..." 
            size="xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>
      
      <VStack 
        maxH={{ base: "300px", xl: "400px" }} 
        overflowY="auto" 
        p={1} 
        spacing={0.5} 
        align="stretch"
      >
        {sortedPlayers.map(player => {
          const alreadyInInning = isPlayerInInning(player.id);
          const isPrimary = activePosition && player.primaryPositions.includes(activePosition);
          const isSecondary = activePosition && player.secondaryPositions.includes(activePosition);
          
          return (
            <Flex
              key={player.id}
              py={1}
              px={1.5}
              borderRadius="md"
              bg={alreadyInInning ? 'gray.50' : isPrimary ? 'green.50' : isSecondary ? 'blue.50' : cardBg}
              borderWidth="1px"
              borderColor={alreadyInInning ? 'gray.200' : 'transparent'}
              align="center"
              width="100%"
              onClick={() => !alreadyInInning && onPlayerSelect(player.id)}
              cursor={alreadyInInning ? 'not-allowed' : 'pointer'}
              opacity={alreadyInInning ? 0.6 : 1}
              _hover={{ bg: alreadyInInning ? undefined : cardHoverBg }}
              transition="all 0.2s"
              height="26px"
            >
              {/* Player jersey number */}
              <Text
                fontWeight="bold"
                bg="gray.100"
                borderRadius="full"
                size="xs"
                px={1.5}
                py={0}
                fontSize="xs"
                minW="16px"
                textAlign="center"
                flexShrink={0}
                mr={1.5}
              >
                {player.jerseyNumber}
              </Text>
              
              {/* Player name - expanding to fill available space */}
              <Text 
                fontSize="xs"
                isTruncated
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                flex="1"
              >
                {player.lastName}, {player.firstName.charAt(0)}
              </Text>
              
              {/* Position match indicator */}
              {activePosition && (isPrimary || isSecondary) && (
                <Box 
                  w="6px" 
                  h="6px" 
                  borderRadius="full" 
                  bg={isPrimary ? "green.500" : "blue.500"} 
                  mr={1}
                />
              )}
              
              {/* Info icon */}
              <Tooltip
                label={renderPositionBadges(player)}
                placement="top"
                hasArrow
              >
                <Icon 
                  as={InfoIcon} 
                  boxSize={2.5} 
                  color="gray.500" 
                  _hover={{ color: 'blue.500' }} 
                  aria-label="View player positions"
                  ml={1}
                />
              </Tooltip>
            </Flex>
          );
        })}
        
        {sortedPlayers.length === 0 && (
          <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>
            No players found
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default RosterPanel;