import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  Text,
  Tag,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { usePlayerPositionTracking } from '../../hooks/use-position-tracking';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { PositionType } from '../../utils/position-utils';
import { PositionBadge } from '../common/position-badge';

interface PlayerPositionSummaryProps {
  player: Player;
  games: Game[];
  lineups: Record<string, Lineup>;
}

const PlayerPositionSummary: React.FC<PlayerPositionSummaryProps> = ({
  player,
  games,
  lineups
}) => {
  const { positionMetrics, positionBreakdown, isLoading } = usePlayerPositionTracking(
    player.id,
    player,
    games,
    lineups
  );

  if (isLoading || !positionBreakdown) {
    return <Box p={4}>Loading position data...</Box>;
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Position History</Heading>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {/* Recent Games Summary */}
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm">Recent Games Summary</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={3} spacing={3}>
                {/* Playing Time */}
                <Stat>
                  <StatLabel>Playing Time</StatLabel>
                  <StatNumber>{positionMetrics?.playingTimePercentage.toFixed(0)}%</StatNumber>
                  <StatHelpText>Last 5 Games</StatHelpText>
                </Stat>
                
                {/* Position Variety */}
                <Stat>
                  <StatLabel>Position Variety</StatLabel>
                  <StatNumber>{positionMetrics?.varietyScore.toFixed(0)}%</StatNumber>
                  <Progress
                    value={positionMetrics?.varietyScore || 0}
                    colorScheme={positionMetrics?.varietyScore || 0 > 50 ? "green" : "orange"}
                    size="sm"
                    mt={2}
                  />
                </Stat>
                
                {/* Bench Time */}
                <Stat>
                  <StatLabel>Bench Time</StatLabel>
                  <StatNumber>
                    {positionBreakdown.last5Games?.positionPercentages["BN"].toFixed(0)}%
                  </StatNumber>
                  <StatHelpText>
                    {positionMetrics?.benchStreakMax} innings max
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
              
              {/* Last Bench Start */}
              {positionBreakdown.lastBenchStart && (
                <Box mt={4}>
                  <Text fontSize="sm" color="gray.600">
                    Last started on bench: {format(positionBreakdown.lastBenchStart, 'MMM d, yyyy')}
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
          
          {/* Position Distribution */}
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm">Position Distribution</Heading>
            </CardHeader>
            <CardBody>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Position Type</Th>
                    <Th isNumeric>Innings</Th>
                    <Th isNumeric>%</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(positionBreakdown.season.positionTypeCounts).map(
                    ([type, count]) => {
                      // Skip bench for this table
                      if (type === PositionType.BENCH) return null;
                      
                      const percentage = positionBreakdown.season.positionTypePercentages[type as PositionType];
                      return (
                        <Tr key={type}>
                          <Td>{type}</Td>
                          <Td isNumeric>{count}</Td>
                          <Td isNumeric>{percentage.toFixed(1)}%</Td>
                        </Tr>
                      );
                    }
                  )}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Recent Games Grid */}
        <Box mt={6} overflowX="auto">
          <Heading size="sm" mb={3}>Recent Game Positions</Heading>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Opponent</Th>
                {Array.from({ length: 6 }, (_, i) => (
                  <Th key={i} isNumeric>Inning {i + 1}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {positionMetrics?.positionGrid.slice(0, 5).map(game => (
                <Tr key={game.gameId}>
                  <Td>{format(game.gameDate, 'MM/dd')}</Td>
                  <Td>{game.opponent}</Td>
                  {Array.from({ length: 6 }, (_, i) => {
                    const inningPosition = game.inningPositions.find(pos => pos.inning === i + 1);
                    return (
                      <Td key={i} isNumeric>
                        {inningPosition ? (
                          <Tooltip label={`Inning ${i + 1}: ${inningPosition.position}`}>
                            <span>
                              <PositionBadge 
                                position={inningPosition.position} 
                                size="sm" 
                                showTooltip={false}
                              />
                            </span>
                          </Tooltip>
                        ) : null}
                      </Td>
                    );
                  })}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {/* Position Trends */}
        <Box mt={6}>
          <Heading size="sm" mb={3}>Position Trends</Heading>
          <Flex flexWrap="wrap" gap={2}>
            {Object.entries(positionMetrics?.allGames.positionCounts || {}).map(([position, count]) => {
              if (position === 'BN' || count === 0) return null;
              const percentage = positionMetrics?.allGames.positionPercentages[position] || 0;
              return (
                <Tag 
                  key={position} 
                  size="md" 
                  variant="subtle" 
                  colorScheme={percentage > 20 ? "green" : "gray"}
                >
                  {position}: {count} innings ({percentage.toFixed(0)}%)
                </Tag>
              );
            })}
          </Flex>
        </Box>
      </CardBody>
    </Card>
  );
};

export default PlayerPositionSummary;