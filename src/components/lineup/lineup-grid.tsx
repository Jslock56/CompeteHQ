// src/components/lineup/lineup-grid.tsx
import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Text,
  HStack,
  Badge,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { LineupInning, PositionAssignment } from '../../types/lineup';
import { Player } from '../../types/player';
import { PositionBadge } from '../common/position-badge';

interface LineupGridProps {
  inning: LineupInning;
  players: Player[];
  onAssignPlayer: (position: string, playerId: string) => void;
}

export const LineupGrid: React.FC<LineupGridProps> = ({
  inning,
  players,
  onAssignPlayer
}) => {
  // Define field positions in order
  const fieldPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  
  // Get position assignments for this inning
  const getAssignment = (position: string) => {
    return inning.positions.find(p => p.position === position);
  };
  
  // Get player by ID
  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };
  
  // Check if position is primary for player
  const isPrimaryPosition = (player: Player, position: string) => {
    return player.primaryPositions.includes(position as any);
  };
  
  // Check if position is secondary for player
  const isSecondaryPosition = (player: Player, position: string) => {
    return player.secondaryPositions.includes(position as any);
  };
  
  // Background color for alternating rows
  const altRowBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th width="100px">Position</Th>
            <Th>Player</Th>
            <Th width="100px" textAlign="center">Jersey #</Th>
            <Th width="120px" textAlign="center">Position Type</Th>
          </Tr>
        </Thead>
        <Tbody>
          {fieldPositions.map((position, index) => {
            const assignment = getAssignment(position);
            const player = assignment ? getPlayer(assignment.playerId) : null;
            const isEvenRow = index % 2 === 0;
            
            return (
              <Tr key={position} bg={isEvenRow ? 'transparent' : altRowBg}>
                <Td>
                  <HStack>
                    <PositionBadge position={position} />
                    <Text fontWeight="medium">{position}</Text>
                  </HStack>
                </Td>
                <Td>
                  <Select
                    value={player?.id || ''}
                    onChange={(e) => onAssignPlayer(position, e.target.value)}
                    placeholder="Select player"
                    size="sm"
                  >
                    {players
                      .filter(p => p.active)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.lastName}, {p.firstName}
                        </option>
                      ))}
                  </Select>
                </Td>
                <Td textAlign="center">
                  {player && player.jerseyNumber}
                </Td>
                <Td textAlign="center">
                  {player && (
                    <>
                      {isPrimaryPosition(player, position) ? (
                        <Badge colorScheme="green">Primary</Badge>
                      ) : isSecondaryPosition(player, position) ? (
                        <Badge colorScheme="blue">Secondary</Badge>
                      ) : (
                        <Badge colorScheme="orange">New</Badge>
                      )}
                    </>
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

export default LineupGrid;