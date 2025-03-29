import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  Table,
  Thead,
  Tbody, 
  Tr, 
  Th, 
  Td,
  Text,
  Badge,
  useColorModeValue,
  Tooltip,
  Icon,
  HStack
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { Position, Lineup } from '../../../types/lineup';
import { Player } from '../../../types/player';
import PositionBadge from '../../common/position-badge';

interface LineupGridPositionBuilderProps {
  /**
   * Current lineup data
   */
  lineup: Lineup;
  
  /**
   * Available players
   */
  players: Player[];
  
  /**
   * Currently active position (for highlighting)
   */
  activePosition: Position;
  
  /**
   * Callback when a position cell is clicked
   */
  onPositionClick: (position: Position) => void;
}

/**
 * Grid-based component for building field position lineups
 */
const LineupGridPositionBuilder: React.FC<LineupGridPositionBuilderProps> = ({
  lineup,
  players,
  activePosition,
  onPositionClick
}) => {
  // Get the first inning (for field-position lineups, they always have a single inning)
  const inning = lineup.innings[0];
  
  // Color values
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const activeCellBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Get player assigned to position
  const getPlayerAtPosition = (position: Position): Player | undefined => {
    const assignment = inning.positions.find(pos => pos.position === position);
    if (!assignment || !assignment.playerId) return undefined;
    
    return players.find(player => player.id === assignment.playerId);
  };
  
  // Standard baseball positions in order
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr bg={headerBg}>
            <Th width="100px">Position</Th>
            <Th>Player</Th>
          </Tr>
        </Thead>
        <Tbody>
          {positions.map(position => {
            const player = getPlayerAtPosition(position);
            const isActive = position === activePosition;
            
            return (
              <Tr 
                key={position}
                cursor="pointer"
                bg={isActive ? activeCellBg : undefined}
                _hover={{ bg: !isActive ? hoverBg : undefined }}
                onClick={() => onPositionClick(position)}
              >
                <Td>
                  <PositionBadge position={position} />
                </Td>
                <Td>
                  {player ? (
                    <Flex align="center">
                      <Text fontWeight="semibold">
                        {player.jerseyNumber} - {player.firstName} {player.lastName}
                      </Text>
                      
                      {/* Position badge for player */}
                      {player.primaryPositions.includes(position) ? (
                        <Badge colorScheme="green" ml={2} fontSize="xs">Primary</Badge>
                      ) : player.secondaryPositions.includes(position) ? (
                        <Badge colorScheme="blue" ml={2} fontSize="xs">Secondary</Badge>
                      ) : (
                        <Badge colorScheme="yellow" ml={2} fontSize="xs">New</Badge>
                      )}
                    </Flex>
                  ) : (
                    <Text color="gray.500">
                      (Empty)
                    </Text>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

export default LineupGridPositionBuilder;