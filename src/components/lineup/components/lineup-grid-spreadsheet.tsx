import React, { memo, useMemo, useCallback } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { Lineup, Position } from '../../../types/lineup';
import { Player } from '../../../types/player';
import { PositionBadge } from '../../../components/common/position-badge';

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
 * Individual position cell component for better rendering performance
 */
const PositionCell = memo(({ 
  position, 
  inning, 
  player, 
  isActive, 
  onClick, 
  tableBorderColor,
  activeCellBg,
  hoverBg,
  cellBg,
  textColor,
  secondaryTextColor,
  badgeBg
}: { 
  position: Position; 
  inning: number; 
  player: Player | null; 
  isActive: boolean; 
  onClick: () => void;
  tableBorderColor: string;
  activeCellBg: string;
  hoverBg: string;
  cellBg?: string;
  textColor?: string;
  secondaryTextColor?: string;
  badgeBg?: string;
}) => {
  return (
    <Td 
      onClick={onClick}
      bg={isActive ? activeCellBg : cellBg}
      _hover={{ bg: isActive ? activeCellBg : hoverBg }}
      cursor="pointer"
      transition="background-color 0.2s"
      textAlign="left"
      borderColor={tableBorderColor}
      p={2}
      height="32px"
      color={textColor}
    >
      {player ? (
        <Flex align="center" justifyContent="flex-start" flexWrap="nowrap">
          <Text 
            fontWeight="medium" 
            mr={2} 
            borderRadius="full"
            bg={badgeBg}
            px={1.5}
            py={0.5}
            fontSize="xs"
            flexShrink={0}
            minWidth="20px"
            textAlign="center"
          >
            {player.jerseyNumber}
          </Text>
          <Text 
            fontSize="xs" 
            isTruncated={false}
            whiteSpace="nowrap"
          >
            {player.lastName}, {player.firstName.charAt(0)}
          </Text>
        </Flex>
      ) : (
        <Text fontSize="xs" color={secondaryTextColor}>Empty</Text>
      )}
    </Td>
  );
});
PositionCell.displayName = 'PositionCell';

/**
 * Bench cell component for better rendering performance
 */
const BenchCell = memo(({ 
  inning, 
  benchPlayers, 
  isActive, 
  onClick,
  tableBorderColor,
  activeCellBg,
  hoverBg,
  cellBg,
  textColor,
  secondaryTextColor,
  badgeBg
}: { 
  inning: number; 
  benchPlayers: Player[]; 
  isActive: boolean; 
  onClick: () => void;
  tableBorderColor: string;
  activeCellBg: string;
  hoverBg: string;
  cellBg?: string;
  textColor?: string;
  secondaryTextColor?: string;
  badgeBg?: string;
}) => {
  return (
    <Td 
      onClick={onClick}
      bg={isActive ? activeCellBg : cellBg}
      _hover={{ bg: isActive ? activeCellBg : hoverBg }}
      cursor="pointer"
      transition="background-color 0.2s"
      borderColor={tableBorderColor}
      p={1.5}
      height="80px"
      verticalAlign="top"
      color={textColor}
    >
      <Box maxH="75px" overflowY="auto">
        {benchPlayers.length > 0 ? (
          benchPlayers.map((player, idx) => (
            <Flex 
              key={player.id} 
              align="center" 
              fontSize="xs" 
              mb={idx < benchPlayers.length - 1 ? 1 : 0}
              justifyContent="flex-start"
            >
              <Text 
                fontWeight="medium" 
                mr={1} 
                borderRadius="full"
                bg={badgeBg}
                px={1.5}
                py={0.5}
                minWidth="20px"
                textAlign="center"
              >
                {player.jerseyNumber}
              </Text>
              <Text isTruncated maxWidth="60px">
                {player.lastName}
              </Text>
            </Flex>
          ))
        ) : (
          <Text fontSize="xs" color={secondaryTextColor}>No players on bench</Text>
        )}
      </Box>
    </Td>
  );
});
BenchCell.displayName = 'BenchCell';

/**
 * Spreadsheet-style grid for lineup management
 */
const LineupGridSpreadsheet: React.FC<LineupGridSpreadsheetProps> = memo(({
  lineup,
  activePosition,
  activeInning,
  onCellClick,
  players
}) => {
  // Define positions in the order we want to display
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  // Colors for UI elements - enhanced for better dark mode compatibility
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const cellBg = useColorModeValue('white', 'gray.800');
  const activeCellBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const badgeBg = useColorModeValue('gray.200', 'gray.600');
  
  // Function to get the player assigned to a position in an inning - memoized
  const inningPositionPlayerMap = useMemo(() => {
    const map: Record<number, Record<Position, Player | null>> = {};
    
    // Initialize map for all innings and positions
    lineup.innings.forEach(inning => {
      map[inning.inning] = {} as Record<Position, Player | null>;
      positions.forEach(pos => {
        map[inning.inning][pos] = null;
      });
    });
    
    // Fill in player assignments
    lineup.innings.forEach(inning => {
      inning.positions.forEach(pos => {
        if (pos.playerId) {
          const player = players.find(p => p.id === pos.playerId);
          if (player) {
            map[inning.inning][pos.position] = player;
          }
        }
      });
    });
    
    return map;
  }, [lineup.innings, players]);
  
  // Get player in position from the memoized map
  const getPlayerInPosition = useCallback((inning: number, position: Position): Player | null => {
    return inningPositionPlayerMap[inning]?.[position] || null;
  }, [inningPositionPlayerMap]);
  
  // Function to determine if a cell is the active cell - memoized
  const isActiveCell = useCallback((position: Position, inning: number): boolean => {
    return position === activePosition && inning === activeInning;
  }, [activePosition, activeInning]);

  // Function to get players on bench for a specific inning - memoized
  const benchPlayersByInning = useMemo(() => {
    const map: Record<number, Player[]> = {};
    
    lineup.innings.forEach(inning => {
      const inningData = inning;
      const assignedPlayerIds = new Set<string>();
      
      // Get all player IDs assigned to positions
      inningData.positions.forEach(pos => {
        if (pos.playerId) {
          assignedPlayerIds.add(pos.playerId);
        }
      });
      
      // Filter active players not in the assigned list
      map[inning.inning] = players.filter(player => 
        player.active && !assignedPlayerIds.has(player.id)
      );
    });
    
    return map;
  }, [lineup.innings, players]);
  
  // Get bench players for an inning from the memoized map
  const getBenchPlayers = useCallback((inning: number): Player[] => {
    return benchPlayersByInning[inning] || players.filter(p => p.active);
  }, [benchPlayersByInning, players]);

  // Memoize header row cells
  const headerCells = useMemo(() => {
    return Array.from({ length: lineup.innings.length }, (_, i) => (
      <Th 
        key={`inning-${i+1}`} 
        textAlign="center" 
        borderColor={tableBorderColor}
        width="100px"
        px={2}
      >
        Inning {i+1}
      </Th>
    ));
  }, [lineup.innings.length, tableBorderColor]);

  // Memoize position rows
  const positionRows = useMemo(() => {
    return positions.map(position => (
      <Tr key={position}>
        <Td 
          borderColor={tableBorderColor}
          bg={headerBg}
          p={2}
          position="sticky"
          left={0}
          zIndex={1}
        >
          <Flex justify="center">
            <PositionBadge position={position} size="sm" />
          </Flex>
        </Td>
        {Array.from({ length: lineup.innings.length }, (_, i) => {
          const inning = i + 1;
          const player = getPlayerInPosition(inning, position);
          
          return (
            <PositionCell 
              key={`cell-${position}-${inning}`}
              position={position}
              inning={inning}
              player={player}
              isActive={isActiveCell(position, inning)}
              onClick={() => onCellClick(position, inning)}
              tableBorderColor={tableBorderColor}
              activeCellBg={activeCellBg}
              hoverBg={hoverBg}
              cellBg={cellBg}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              badgeBg={badgeBg}
            />
          );
        })}
      </Tr>
    ));
  }, [
    positions, lineup.innings.length, getPlayerInPosition, isActiveCell, onCellClick, 
    tableBorderColor, headerBg, activeCellBg, hoverBg, cellBg, textColor, 
    secondaryTextColor, badgeBg
  ]);

  // Memoize bench cells
  const benchCells = useMemo(() => {
    return Array.from({ length: lineup.innings.length }, (_, i) => {
      const inning = i + 1;
      const benchPlayers = getBenchPlayers(inning);
      
      return (
        <BenchCell 
          key={`bench-${inning}`}
          inning={inning}
          benchPlayers={benchPlayers}
          isActive={isActiveCell('BN' as Position, inning)}
          onClick={() => onCellClick('BN' as Position, inning)}
          tableBorderColor={tableBorderColor}
          activeCellBg={activeCellBg}
          hoverBg={hoverBg}
          cellBg={cellBg}
          textColor={textColor}
          secondaryTextColor={secondaryTextColor}
          badgeBg={badgeBg}
        />
      );
    });
  }, [
    lineup.innings.length, getBenchPlayers, isActiveCell, onCellClick, 
    tableBorderColor, activeCellBg, hoverBg, cellBg, textColor, 
    secondaryTextColor, badgeBg
  ]);

  return (
    <Box width="100%" overflowX="auto" borderWidth="1px" borderColor={tableBorderColor} borderRadius="md">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr bg={headerBg}>
            <Th 
              width="60px" 
              borderColor={tableBorderColor}
              position="sticky"
              left={0}
              zIndex={2}
              bg={headerBg}
            >
              Position
            </Th>
            {headerCells}
          </Tr>
        </Thead>
        <Tbody>
          {positionRows}
          {/* Bench row */}
          <Tr bg="gray.100">
            <Td 
              borderColor={tableBorderColor}
              bg={headerBg}
              p={2}
              position="sticky"
              left={0}
              zIndex={1}
            >
              <Flex justify="center">
                <PositionBadge position="BN" size="sm" />
              </Flex>
            </Td>
            {benchCells}
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
});

LineupGridSpreadsheet.displayName = 'LineupGridSpreadsheet';

export default LineupGridSpreadsheet;