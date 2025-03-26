import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Text,
  Tag,
  TagLabel,
  Flex,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { useTeamPositionTracking } from '../../hooks/use-position-tracking';
import { Player } from '../../types/player';
import { Game } from '../../types/game';
import { Lineup } from '../../types/lineup';
import { PositionType } from '../../utils/position-utils';
import { PositionBadge } from '../common/position-badge';

interface TeamPositionAnalysisProps {
  teamId: string;
  players: Player[];
  games: Game[];
  lineups: Record<string, Lineup>;
}

const TeamPositionAnalysis: React.FC<TeamPositionAnalysisProps> = ({
  teamId,
  players,
  games,
  lineups
}) => {
  const [timeframe, setTimeframe] = useState<'last3Games' | 'last5Games' | 'last10Games' | 'season'>('season');
  const { teamDistribution, fairPlayMetrics, isLoading } = useTeamPositionTracking(
    teamId,
    players,
    games,
    lineups
  );

  if (isLoading || !teamDistribution || !fairPlayMetrics) {
    return <Box p={4}>Loading team position data...</Box>;
  }

  const metrics = fairPlayMetrics[timeframe];

  // Find players by ID
  const getPlayerName = (playerId: string): string => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName} #${player.jerseyNumber}` : playerId;
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Team Position Analysis</Heading>
        <Flex mt={2} justify="space-between" align="center">
          <Text>Fair Play Score: {metrics.fairPlayScore.toFixed(1)}/100</Text>
          <Select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value as any)}
            width="auto"
            size="sm"
          >
            <option value="last3Games">Last 3 Games</option>
            <option value="last5Games">Last 5 Games</option>
            <option value="last10Games">Last 10 Games</option>
            <option value="season">Entire Season</option>
          </Select>
        </Flex>
        <Progress 
          value={metrics.fairPlayScore} 
          colorScheme={metrics.fairPlayScore > 75 ? "green" : metrics.fairPlayScore > 50 ? "yellow" : "red"}
          size="sm"
          mt={2}
        />
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {/* Playing Time Distribution */}
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm">Playing Time Distribution</Heading>
            </CardHeader>
            <CardBody>
              {metrics.playingTimeImbalance.length > 0 ? (
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Player</Th>
                      <Th isNumeric>Playing Time %</Th>
                      <Th isNumeric>Diff from Avg</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {metrics.playingTimeImbalance.map(item => (
                      <Tr key={item.playerId}>
                        <Td>{getPlayerName(item.playerId)}</Td>
                        <Td isNumeric>{item.playingTimePercentage.toFixed(1)}%</Td>
                        <Td isNumeric>
                          <Text
                            color={Math.abs(item.difference) > 15 
                              ? (item.difference < 0 ? "red.500" : "orange.500")
                              : "green.500"
                            }
                          >
                            {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}%
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No playing time data available</Text>
              )}
              
              {/* Bench Time Alert */}
              {metrics.mostBenchTime.length > 0 && metrics.mostBenchTime[0].benchPercentage > 40 && (
                <Alert status="warning" mt={4} size="sm">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>High Bench Time</AlertTitle>
                    <AlertDescription>
                      {getPlayerName(metrics.mostBenchTime[0].playerId)} has been on the bench for
                      {' '}{metrics.mostBenchTime[0].benchPercentage.toFixed(0)}% of innings
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </CardBody>
          </Card>
          
          {/* Position Variety */}
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm">Position Variety</Heading>
            </CardHeader>
            <CardBody>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Player</Th>
                    <Th isNumeric>Variety Score</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {metrics.leastVariety.map(item => (
                    <Tr key={item.playerId}>
                      <Td>{getPlayerName(item.playerId)}</Td>
                      <Td isNumeric>
                        <Text
                          color={item.varietyScore < 40 
                            ? "red.500" 
                            : item.varietyScore < 60 ? "yellow.500" : "green.500"}
                        >
                          {item.varietyScore.toFixed(0)}%
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Position Experience Needs */}
        {metrics.needsExperience.length > 0 && (
          <Box mt={5}>
            <Heading size="sm" mb={3}>Position Experience Needs</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {metrics.needsExperience.map(item => (
                <Box 
                  key={item.playerId}
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="gray.50"
                >
                  <Text fontWeight="medium">{getPlayerName(item.playerId)}</Text>
                  <Flex mt={2} gap={2} wrap="wrap">
                    {item.positionTypes.map(type => (
                      <Tag key={type} colorScheme="blue">
                        <TagLabel>Needs {type} experience</TagLabel>
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

export default TeamPositionAnalysis;