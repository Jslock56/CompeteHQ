import React from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { Lineup, Position } from '../../types/lineup';
import { Player } from '../../types/player';
import { PositionBadge } from '../common/position-badge';

interface LineupGridSpreadsheetProps {
  /**
   * Lineup data
   */
  lineup: Lineup;
  
  /**
   * Currently active position
   */
  activePosition: Position;
  
  /**
   * Currently active inning
   */
  activeInning: number;
  
  /**
   * Callback when a cell is clicked
   */
  onCellClick: (position: Position, inning: number) => void;
  
  /**
   * All available players
   */
  players: Player[];
}

/**
 * Spreadsheet-style grid for lineup management
 */
const LineupGridSpreadsheet: React.FC<LineupGridSpreadsheetProps> = ({
  lineup,
  activePosition,
  activeInning,
  onCellClick,
  players
}) => {
  // Define positions in the order we want to display (removed DH as requested)
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  // Colors for UI elements
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const activeCellBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Function to get the player assigned to a position in an inning
  const getPlayerInPosition = (inning: number, position: Position): Player | null => {
    const inningData = lineup.innings.find(i => i.inning === inning);
    if (!inningData) return null;
    
    const assignment = inningData.positions.find(p => p.position === position);
    if (!assignment || !assignment.playerId) return null;
    
    return players.find(p => p.id === assignment.playerId) || null;
  };
  
  // Function to determine if a cell is the active cell
  const isActiveCell = (position: Position, inning: number): boolean => {
    return position === activePosition && inning === activeInning;
  };

  // Function to get players on bench for a specific inning
  const getBenchPlayers = (inning: number): Player[] => {
    const inningData = lineup.innings.find(i => i.inning === inning);
    if (!inningData) return players.filter(p => p.active);
    
    // Get players who are not assigned to any position in this inning
    return players.filter(player => {
      return player.active && !inningData.positions.some(p => p.playerId === player.id);
    });
  };

  return (
    <Box overflowX="auto" borderWidth="1px" borderColor={tableBorderColor} borderRadius="md">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr bg={headerBg}>
            <Th width="80px" borderColor={tableBorderColor}>Position</Th>
            {Array.from({ length: lineup.innings.length }, (_, i) => (
              <Th key={`inning-${i+1}`} textAlign="center" borderColor={tableBorderColor}>
                Inning {i+1}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {positions.map(position => (
            <Tr key={position}>
              <Td 
                borderColor={tableBorderColor}
                bg={headerBg}
                p={2}
              >
                <Flex justify="center">
                  <PositionBadge position={position} size="sm" />
                </Flex>
              </Td>
              {Array.from({ length: lineup.innings.length }, (_, i) => {
                const inning = i + 1;
                const player = getPlayerInPosition(inning, position);
                
                return (
                  <Td 
                    key={`cell-${position}-${inning}`}
                    onClick={() => onCellClick(position, inning)}
                    bg={isActiveCell(position, inning) ? activeCellBg : undefined}
                    _hover={{ bg: isActiveCell(position, inning) ? activeCellBg : hoverBg }}
                    cursor="pointer"
                    transition="background-color 0.2s"
                    textAlign="center"
                    borderColor={tableBorderColor}
                    p={2}
                  >
                    {player ? (
                      <Flex align="center" justify="center">
                        <Text 
                          fontWeight="medium" 
                          mr={1} 
                          borderRadius="full"
                          bg="gray.200"
                          px={2}
                          py={0.5}
                          fontSize="xs"
                        >
                          {player.jerseyNumber}
                        </Text>
                        <Text fontSize="sm">{player.lastName}</Text>
                      </Flex>
                    ) : (
                      <Text fontSize="xs" color="gray.400">Empty</Text>
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
          {/* Bench row */}
          <Tr bg="gray.100">
            <Td 
              borderColor={tableBorderColor}
              bg={headerBg}
              p={2}
            >
              <Flex justify="center">
                <PositionBadge position="BN" size="sm" />
              </Flex>
            </Td>
            {Array.from({ length: lineup.innings.length }, (_, i) => {
              const inning = i + 1;
              const benchPlayers = getBenchPlayers(inning);
              
              return (
                <Td 
                  key={`bench-${inning}`}
                  onClick={() => onCellClick('BN' as Position, inning)}
                  bg={isActiveCell('BN' as Position, inning) ? activeCellBg : undefined}
                  _hover={{ bg: isActiveCell('BN' as Position, inning) ? activeCellBg : hoverBg }}
                  cursor="pointer"
                  transition="background-color 0.2s"
                  borderColor={tableBorderColor}
                  p={2}
                >
                  <Box maxH="80px" overflowY="auto">
                    {benchPlayers.length > 0 ? (
                      benchPlayers.map(player => (
                        <Flex key={player.id} align="center" fontSize="xs" mb={1}>
                          <Text 
                            fontWeight="medium" 
                            mr={1} 
                            borderRadius="full"
                            bg="gray.200"
                            px={1.5}
                            py={0.5}
                          >
                            {player.jerseyNumber}
                          </Text>
                          <Text>{player.lastName}</Text>
                        </Flex>
                      ))
                    ) : (
                      <Text fontSize="xs" color="gray.400">No players on bench</Text>
                    )}
                  </Box>
                </Td>
              );
            })}
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};

export default LineupGridSpreadsheet;