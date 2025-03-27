import React from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { Lineup, Position } from '../../types/lineup';
import { Player } from '../../types/player';
import { PositionBadge } from '../common/position-badge';

interface LineupViewGridProps {
  /**
   * Lineup data
   */
  lineup: Lineup;
  
  /**
   * Current inning to display
   */
  currentInning: number;
  
  /**
   * All available players
   */
  players: Player[];
}

/**
 * Spreadsheet-style grid for lineup viewing (read-only)
 */
const LineupViewGrid: React.FC<LineupViewGridProps> = ({
  lineup,
  currentInning,
  players
}) => {
  // Define positions in the order we want to display
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  
  // Define position full names for the row headers
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
  
  // Colors for UI elements
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Function to get the player assigned to a position in the current inning
  const getPlayerInPosition = (position: Position): Player | null => {
    const inningData = lineup.innings.find(i => i.inning === currentInning);
    if (!inningData) return null;
    
    const assignment = inningData.positions.find(p => p.position === position);
    if (!assignment || !assignment.playerId) return null;
    
    return players.find(p => p.id === assignment.playerId) || null;
  };

  // Function to get players on bench for the current inning
  const getBenchPlayers = (): Player[] => {
    const inningData = lineup.innings.find(i => i.inning === currentInning);
    if (!inningData) return players.filter(p => p.active);
    
    // Get players who are not assigned to any position in this inning
    return players.filter(player => {
      return player.active && !inningData.positions.some(p => p.playerId === player.id);
    });
  };

  return (
    <Box overflowX="auto" borderWidth="1px" borderColor={tableBorderColor} borderRadius="md">
      <Table variant="simple" size="md">
        <Thead>
          <Tr bg={headerBg}>
            <Th width="140px" borderColor={tableBorderColor}>Position</Th>
            <Th borderColor={tableBorderColor}>Player</Th>
            <Th width="100px" isNumeric borderColor={tableBorderColor}>Jersey #</Th>
          </Tr>
        </Thead>
        <Tbody>
          {positions.map(position => {
            const player = getPlayerInPosition(position);
            
            return (
              <Tr key={position}>
                <Td borderColor={tableBorderColor}>
                  <Flex align="center">
                    <PositionBadge position={position} size="sm" />
                    <Box ml={2}>
                      <Text fontWeight="medium">{position}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {positionNames[position]}
                      </Text>
                    </Box>
                  </Flex>
                </Td>
                <Td borderColor={tableBorderColor}>
                  {player ? (
                    <Text>{player.lastName}, {player.firstName}</Text>
                  ) : (
                    <Text color="red.500">Not assigned</Text>
                  )}
                </Td>
                <Td isNumeric borderColor={tableBorderColor}>
                  {player && <Text>{player.jerseyNumber}</Text>}
                </Td>
              </Tr>
            );
          })}
          
          {/* Bench row */}
          <Tr bg="gray.100">
            <Td borderColor={tableBorderColor}>
              <Flex align="center">
                <PositionBadge position="BN" size="sm" />
                <Box ml={2}>
                  <Text fontWeight="medium">BN</Text>
                  <Text fontSize="xs" color="gray.500">Bench</Text>
                </Box>
              </Flex>
            </Td>
            <Td colSpan={2} borderColor={tableBorderColor}>
              <Flex wrap="wrap" gap={2}>
                {getBenchPlayers().map(player => (
                  <Flex 
                    key={player.id} 
                    align="center" 
                    bg="gray.50" 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    fontSize="sm"
                  >
                    <Text fontWeight="bold" mr={1}>{player.jerseyNumber}</Text>
                    <Text>{player.lastName}</Text>
                  </Flex>
                ))}
                {getBenchPlayers().length === 0 && (
                  <Text color="gray.500" fontSize="sm">No players on bench for this inning.</Text>
                )}
              </Flex>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};

export default LineupViewGrid;