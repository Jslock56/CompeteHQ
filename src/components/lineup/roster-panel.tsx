import React from 'react';
import { Box, Heading, Text, Flex, useColorModeValue, Tooltip, Icon, VStack } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { Player } from '../../types/player';
import { Lineup } from '../../types/lineup';
import { PositionBadge } from '../common/position-badge';

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
   */
  activeInning: number;
  
  /**
   * Callback when a player is selected
   */
  onPlayerSelect: (playerId: string) => void;
}

/**
 * Panel displaying available players for selection
 */
const RosterPanel: React.FC<RosterPanelProps> = ({
  players,
  lineup,
  activeInning,
  onPlayerSelect
}) => {
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

  // Function to create position badges for tooltip
  const renderPositionBadges = (player: Player) => (
    <Box p={2}>
      <Text fontWeight="semibold" fontSize="xs" mb={2}>Primary: {player.primaryPositions.join(', ')}</Text>
      <Text fontWeight="semibold" fontSize="xs">Secondary: {player.secondaryPositions.join(', ')}</Text>
    </Box>
  );

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
          Player Roster
        </Heading>
        <Text fontSize="xs" color="gray.500">
          Click to add
        </Text>
      </Box>
      
      <VStack 
        maxH={{ base: "300px", xl: "400px" }} 
        overflowY="auto" 
        p={1} 
        spacing={0.5} 
        align="stretch"
      >
        {activePlayers.map(player => {
          const alreadyInInning = isPlayerInInning(player.id);
          
          return (
            <Flex
              key={player.id}
              py={1}
              px={1.5}
              borderRadius="md"
              bg={alreadyInInning ? 'gray.50' : cardBg}
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
      </VStack>
    </Box>
  );
};

export default RosterPanel;