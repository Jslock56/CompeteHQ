'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Flex,
  Badge,
  Divider,
  Tag,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  VStack,
  HStack,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { Player, Position } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { usePlayerPositionTracking } from '../../hooks/use-position-tracking';
import { PositionBadge } from '../common/position-badge';
import { PositionType, getPositionColor, getPositionType } from '../../utils/position-utils';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from 'recharts';

interface PlayerPositionDashboardProps {
  player: Player;
  games: Game[];
  lineups: Record<string, Lineup>;
}

/**
 * Player Position Tracking Dashboard Component
 * 
 * A comprehensive dashboard displaying a player's position history,
 * trends, and fair play metrics.
 */
export const PlayerPositionDashboard: React.FC<PlayerPositionDashboardProps> = ({
  player,
  games,
  lineups
}) => {
  const { 
    gamesWithPositions, 
    positionMetrics, 
    positionBreakdown, 
    positionGrid,
    positionHeatmap,
    isLoading 
  } = usePlayerPositionTracking(player.id, player, games, lineups);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('sm', 'dark-lg');
  const statBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Prepare the position distribution data for the pie chart
  const positionDistributionData = useMemo(() => {
    if (!positionBreakdown?.season) return [];

    try {
      return Object.entries(positionBreakdown.season.positionCounts)
        .filter(([position, count]) => count > 0 && position !== 'BN') // Exclude bench and empty positions
        .map(([position, count]) => ({
          position,
          count,
          percentage: positionBreakdown.season.positionPercentages[position as Position]
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error creating position distribution data:", error);
      return [];
    }
  }, [positionBreakdown]);

  // Prepare position type data for bar chart
  const positionTypeData = useMemo(() => {
    if (!positionBreakdown?.season) return [];

    try {
      return Object.entries(positionBreakdown.season.positionTypeCounts)
        .filter(([type, count]) => count > 0 && type !== PositionType.BENCH) // Exclude bench
        .map(([type, count]) => ({
          type,
          count,
          percentage: positionBreakdown.season.positionTypePercentages[type as PositionType]
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error creating position type data:", error);
      return [];
    }
  }, [positionBreakdown]);

  // Generate actionable insights based on position metrics
  const generateInsights = () => {
    if (!positionMetrics) return [];

    try {
      const insights: { title: string; description: string; severity: 'info' | 'warning' | 'success' }[] = [];

      // Position variety insights
      if (positionMetrics.varietyScore < 40) {
        insights.push({
          title: 'Low Position Variety',
          description: 'This player has experienced limited position variety. Consider trying them at different positions for development.',
          severity: 'warning'
        });
      } else if (positionMetrics.varietyScore > 70) {
        insights.push({
          title: 'High Position Variety',
          description: 'This player has excellent position variety. They are versatile and can be placed in many different positions.',
          severity: 'success'
        });
      }

      // Bench time insights
      const benchPercentage = positionMetrics.allGames.positionPercentages['BN'];
      if (benchPercentage > 40) {
        insights.push({
          title: 'High Bench Time',
          description: `Player has spent ${benchPercentage.toFixed(0)}% of innings on the bench. Consider increasing playing time.`,
          severity: 'warning'
        });
      }

      // Position type insights
      const infield = positionMetrics.allGames.positionTypeCounts[PositionType.INFIELD] || 0;
      const outfield = positionMetrics.allGames.positionTypeCounts[PositionType.OUTFIELD] || 0;
      const pitcher = positionMetrics.allGames.positionTypeCounts[PositionType.PITCHER] || 0;
      const catcher = positionMetrics.allGames.positionTypeCounts[PositionType.CATCHER] || 0;

      if (pitcher + catcher > 0 && infield === 0) {
        insights.push({
          title: 'Needs Infield Experience',
          description: 'This player has pitcher/catcher experience but no infield experience. Consider rotating them into infield positions.',
          severity: 'info'
        });
      }

      if (infield > 0 && outfield === 0) {
        insights.push({
          title: 'Needs Outfield Experience',
          description: 'This player has infield experience but no outfield experience. Consider giving them time in the outfield.',
          severity: 'info'
        });
      }

      // Position streak insights
      if (positionMetrics.samePositionStreakMax > 10) {
        insights.push({
          title: 'Position Specialization',
          description: `Player had a streak of ${positionMetrics.samePositionStreakMax} innings at the same position (${positionMetrics.samePositionStreakCurrent || 'Unknown'}). Consider if this specialization is intentional.`,
          severity: 'info'
        });
      }

      return insights;
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  };

  // If data is still loading, show loading state
  if (isLoading || !positionBreakdown) {
    return (
      <Card shadow={cardShadow}>
        <CardHeader>
          <Heading size="md">Position Tracking Dashboard</Heading>
        </CardHeader>
        <CardBody>
          <Flex justify="center" align="center" h="300px">
            <Text>Loading position data...</Text>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  // No data available
  if (!gamesWithPositions.length) {
    return (
      <Card shadow={cardShadow}>
        <CardHeader>
          <Heading size="md">Position Tracking Dashboard</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertTitle>No position data available</AlertTitle>
            <AlertDescription>
              This player has not been assigned positions in any completed games yet.
            </AlertDescription>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card shadow={cardShadow} mb={6}>
      <CardHeader pb={0}>
        <Heading size="md">Position Tracking Dashboard</Heading>
        <Text color={textColor} fontSize="sm" mt={1}>
          Data from {positionMetrics?.totalGames} games • {positionMetrics?.totalInnings} total innings
        </Text>
      </CardHeader>

      <CardBody>
        {/* Key Metrics Section */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
          {/* Playing Time */}
          <Stat bg={statBg} p={3} borderRadius="md" shadow="sm">
            <StatLabel>Playing Time</StatLabel>
            <StatNumber>{positionMetrics?.playingTimePercentage.toFixed(0)}%</StatNumber>
            <Progress
              value={positionMetrics?.playingTimePercentage || 0}
              colorScheme={(positionMetrics?.playingTimePercentage || 0) > 70 ? "green" : "blue"}
              size="sm"
              mt={2}
            />
            <StatHelpText>of available innings</StatHelpText>
          </Stat>

          {/* Position Variety */}
          <Stat bg={statBg} p={3} borderRadius="md" shadow="sm">
            <StatLabel>Position Variety</StatLabel>
            <StatNumber>{positionMetrics?.varietyScore.toFixed(0)}%</StatNumber>
            <Progress
              value={positionMetrics?.varietyScore || 0}
              colorScheme={
                (positionMetrics?.varietyScore || 0) > 70 ? "green" : 
                (positionMetrics?.varietyScore || 0) > 40 ? "blue" : "orange"
              }
              size="sm"
              mt={2}
            />
            <StatHelpText>different positions played</StatHelpText>
          </Stat>

          {/* Bench Time */}
          <Stat bg={statBg} p={3} borderRadius="md" shadow="sm">
            <StatLabel>Bench Time</StatLabel>
            <StatNumber>
              {positionBreakdown.season.positionPercentages["BN"].toFixed(0)}%
            </StatNumber>
            <Progress
              value={positionBreakdown.season.positionPercentages["BN"] || 0}
              colorScheme={
                (positionBreakdown.season.positionPercentages["BN"] || 0) < 20 ? "green" : 
                (positionBreakdown.season.positionPercentages["BN"] || 0) < 40 ? "blue" : "orange"
              }
              size="sm"
              mt={2}
            />
            <StatHelpText>
              streak: {positionMetrics?.benchStreakMax} innings
            </StatHelpText>
          </Stat>

          {/* Primary Position */}
          <Stat bg={statBg} p={3} borderRadius="md" shadow="sm">
            <StatLabel>Primary Position</StatLabel>
            <Flex align="center" mt={2}>
              {player.primaryPositions.length > 0 ? (
                <HStack spacing={2}>
                  {player.primaryPositions.map(pos => (
                    <PositionBadge key={pos} position={pos} size="md" />
                  ))}
                </HStack>
              ) : (
                <Text>None set</Text>
              )}
            </Flex>
            <StatHelpText>
              {player.secondaryPositions.length > 0 && (
                <Tooltip 
                  label={`Secondary positions: ${player.secondaryPositions.join(', ')}`}
                  placement="bottom"
                >
                  <Text cursor="help">
                    +{player.secondaryPositions.length} secondary
                  </Text>
                </Tooltip>
              )}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Visualizations Row */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
          {/* Position Distribution Pie Chart */}
          <Card variant="outline" shadow="sm">
            <CardHeader pb={0}>
              <Heading size="sm">Position Distribution</Heading>
              <Text color={textColor} fontSize="xs">Excluding bench time</Text>
            </CardHeader>
            <CardBody>
              {positionDistributionData.length > 0 ? (
                <Box h="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={positionDistributionData}
                        dataKey="count"
                        nameKey="position"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        fill="#8884d8"
                        label={({ position, percentage }) => 
                          percentage > 5 ? `${position} (${percentage.toFixed(0)}%)` : ''
                        }
                        labelLine={percentage => percentage > 5}
                      >
                        {positionDistributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getPositionColor(entry.position)}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          `${value} innings (${positionDistributionData.find(d => d.position === name)?.percentage.toFixed(1)}%)`, 
                          name
                        ]} 
                      />
                      <RechartsLegend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Flex 
                  justify="center" 
                  align="center" 
                  h="300px" 
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="md"
                >
                  <Text color={textColor}>No position data available</Text>
                </Flex>
              )}
            </CardBody>
          </Card>

          {/* Position Type Bar Chart */}
          <Card variant="outline" shadow="sm">
            <CardHeader pb={0}>
              <Heading size="sm">Position Type Distribution</Heading>
              <Text color={textColor} fontSize="xs">Innings by position category</Text>
            </CardHeader>
            <CardBody>
              {positionTypeData.length > 0 ? (
                <Box h="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={positionTypeData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="type" type="category" width={80} />
                      <RechartsTooltip 
                        formatter={(value, name, props) => [
                          `${value} innings (${props.payload.percentage.toFixed(1)}%)`, 
                          name === 'count' ? 'Innings' : name
                        ]} 
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#8884d8" 
                        label={{ position: 'right', formatter: (value) => value }}
                      >
                        {positionTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.type === PositionType.PITCHER ? '#E53E3E' :
                            entry.type === PositionType.CATCHER ? '#3182CE' :
                            entry.type === PositionType.INFIELD ? '#38A169' :
                            entry.type === PositionType.OUTFIELD ? '#DD6B20' :
                            entry.type === PositionType.DH ? '#805AD5' : '#718096'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Flex 
                  justify="center" 
                  align="center" 
                  h="300px" 
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="md"
                >
                  <Text color={textColor}>No position data available</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Position Timeline */}
        <Card variant="outline" shadow="sm" mb={6}>
          <CardHeader pb={0}>
            <Heading size="sm">Position Timeline</Heading>
            <Text color={textColor} fontSize="xs">Last 10 games</Text>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Opponent</Th>
                    {Array.from({ length: 6 }, (_, i) => (
                      <Th key={i} textAlign="center">Inning {i + 1}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {gamesWithPositions.slice(0, 10).map(game => (
                    <Tr key={game.gameId}>
                      <Td>{format(game.gameDate, 'MMM d, yyyy')}</Td>
                      <Td>{game.opponent}</Td>
                      {Array.from({ length: 6 }, (_, i) => {
                        const inningPosition = game.inningPositions.find(pos => pos.inning === i + 1);
                        return (
                          <Td key={i} textAlign="center">
                            {inningPosition ? (
                              <Flex justifyContent="center">
                                <PositionBadge 
                                  position={inningPosition.position} 
                                  size="sm" 
                                />
                              </Flex>
                            ) : null}
                          </Td>
                        );
                      })}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Insights Section */}
        <Card variant="outline" shadow="sm">
          <CardHeader pb={0}>
            <Heading size="sm">Coaching Insights</Heading>
            <Text color={textColor} fontSize="xs">Recommendations based on position history</Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {generateInsights().map((insight, index) => (
                <Alert 
                  key={index}
                  status={insight.severity}
                  variant="left-accent"
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>{insight.title}</AlertTitle>
                    <AlertDescription>
                      {insight.description}
                    </AlertDescription>
                  </Box>
                </Alert>
              ))}
              {generateInsights().length === 0 && (
                <Alert 
                  status="success"
                  variant="left-accent"
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Good Position Balance</AlertTitle>
                    <AlertDescription>
                      This player has a good balance of positions and playing time. Continue with the current rotation plan.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>
      </CardBody>
    </Card>
  );
};

export default PlayerPositionDashboard;