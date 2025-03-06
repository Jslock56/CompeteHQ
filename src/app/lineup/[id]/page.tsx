"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import { FaPrint } from 'react-icons/fa'; // Import print icon from react-icons
import { withTeam } from '@/contexts/team-context';
import { Lineup, Position } from '@/types/lineup';
import { Player } from '@/types/player';
import { Game } from '@/types/game';
import { storageService } from '@/services/storage/enhanced-storage';
// Import your utility functions
import { getFairPlayIssues } from '@/utils/lineup-utils';

/**
 * Page for viewing an existing lineup
 */
function LineupDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Get lineup ID from URL parameters
  const lineupId = Array.isArray(params.id) ? params.id[0] : params.id as string;
  
  // State
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fairPlayIssues, setFairPlayIssues] = useState<string[]>([]);
  
  // Load lineup data
  useEffect(() => {
    const loadData = async () => {
      if (!lineupId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load lineup
        const lineupData = await storageService.lineup.getLineup(lineupId);
        
        if (!lineupData) {
          setError('Lineup not found');
          setIsLoading(false);
          return;
        }
        
        setLineup(lineupData);
        
        // Load associated game
        const gameData = await storageService.game.getGame(lineupData.gameId);
        setGame(gameData);
        
        // Load team players
        const teamPlayers = await storageService.player.getPlayersByTeam(lineupData.teamId);
        setPlayers(teamPlayers);
        
        // Check for fair play issues
        if (lineupData && teamPlayers.length > 0) {
          // Using getFairPlayIssues function instead of checkLineupFairPlay
          // If this function doesn't exist either, you'll need to create it in lineup-utils.ts
          const issues = getFairPlayIssues(lineupData, teamPlayers);
          setFairPlayIssues(issues);
        }
      } catch (err) {
        setError(`Failed to load lineup: ${String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [lineupId]);
  
  // Get player by ID
  const getPlayerById = (playerId: string): Player | undefined => {
    return players.find(player => player.id === playerId);
  };
  
  // Get position name
  const getPositionName = (position: Position): string => {
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
    
    return positionNames[position] || position;
  };
  
  const getPositionColor = (position: Position): string => {
    const positionColors: Record<Position, string> = {
      'P': 'red.500',
      'C': 'blue.500',
      '1B': 'green.500',
      '2B': 'orange.500',
      '3B': 'purple.500',
      'SS': 'pink.500',
      'LF': 'indigo.500',
      'CF': 'indigo.500',
      'RF': 'indigo.500',
      'DH': 'cyan.500',
      'BN': 'gray.500'
    };
    
    return positionColors[position] || 'gray.500';
  };
  
  // Handle print action
  const handlePrint = () => {
    window.print();
  };
  
  // UI colors
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const alertBg = useColorModeValue('yellow.100', 'yellow.800');
  const alertBorderColor = useColorModeValue('yellow.200', 'yellow.700');
  
  if (isLoading) {
    return (
      <Container maxW="5xl" py={8}>
        <Flex justify="center" align="center" minH="60vh" direction="column">
          <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
          <Text mt={4} color="gray.600">Loading lineup data...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (error || !lineup || !game) {
    return (
      <Container maxW="5xl" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Failed to load lineup data'}
        </Alert>
        
        <Button colorScheme="primary" variant="link" onClick={() => router.push('/games')}>
          Go Back to Games
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxW="5xl" py={8}>
      {/* Breadcrumbs */}
      <Breadcrumb 
        separator={<ChevronRightIcon color="gray.500" />} 
        mb={6}
        fontSize="sm"
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={NextLink} href="/games" color="gray.500">
            Games
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={NextLink} href={`/games/${game.id}`} color="gray.500">
            vs. {game.opponent}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text color="gray.500">Lineup</Text>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Page Header */}
      <Flex 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        mb={8}
      >
        <Box mb={{ base: 4, md: 0 }}>
          <Heading size="lg" mb={1}>
            Lineup: vs. {game.opponent}
          </Heading>
          <Text color="gray.600">
            {new Date(game.date).toLocaleDateString()} • {game.location} • {game.innings} innings
          </Text>
        </Box>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FaPrint />}
            colorScheme="blue"
            variant="outline"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button 
            as={NextLink}
            href={`/lineup/edit/${lineup.id}`}
            leftIcon={<EditIcon />}
            colorScheme="primary"
          >
            Edit Lineup
          </Button>
        </HStack>
      </Flex>
      
      {/* Fair Play Issues Alert */}
      {fairPlayIssues.length > 0 && (
        <Alert
          status="warning"
          variant="subtle"
          bg={alertBg}
          borderWidth="1px"
          borderColor={alertBorderColor}
          borderRadius="md"
          mb={6}
        >
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Fair Play Issues</Text>
            <Text fontSize="sm">
              This lineup has {fairPlayIssues.length} fair play issues. Consider adjusting for better balance.
            </Text>
          </Box>
        </Alert>
      )}
      
      {/* Lineup Tabs */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
        mb={6}
      >
        <Tabs variant="enclosed" colorScheme="primary" isLazy>
          <TabList bg={headerBg}>
            {lineup.innings.map((inning) => (
              <Tab key={inning.inning}>Inning {inning.inning}</Tab>
            ))}
          </TabList>
          
          <TabPanels>
            {lineup.innings.map((inning) => (
              <TabPanel key={inning.inning} p={0}>
                <Table variant="simple" size="md">
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th width="140px">Position</Th>
                      <Th>Player</Th>
                      <Th width="100px" isNumeric>Jersey #</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {/* Sort positions in a standard baseball order */}
                    {(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as Position[])
                      .map(position => {
                        const assignment = inning.positions.find(p => p.position === position);
                        const player = assignment ? getPlayerById(assignment.playerId) : undefined;
                        
                        return (
                          <Tr key={position}>
                            <Td>
                              <Flex align="center">
                                <Box 
                                  w="4" 
                                  h="4" 
                                  borderRadius="sm" 
                                  bg={getPositionColor(position)} 
                                  mr={2}
                                />
                                <Box>
                                  <Text fontWeight="medium">{position}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {getPositionName(position)}
                                  </Text>
                                </Box>
                              </Flex>
                            </Td>
                            <Td>
                              {player ? (
                                <Text>{player.lastName}, {player.firstName}</Text>
                              ) : (
                                <Text color="red.500">Not assigned</Text>
                              )}
                            </Td>
                            <Td isNumeric>
                              {player && <Text>{player.jerseyNumber}</Text>}
                            </Td>
                          </Tr>
                        );
                      })}
                  </Tbody>
                </Table>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* Bench Players for each inning */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
      >
        <Box p={4} borderBottomWidth="1px" borderColor={tableBorderColor} bg={headerBg}>
          <Heading size="sm">Bench Players by Inning</Heading>
        </Box>
        
        <Tabs variant="soft-rounded" colorScheme="blue" p={4} size="sm">
          <TabList mb={4}>
            {lineup.innings.map((inning) => (
              <Tab key={inning.inning}>Inning {inning.inning}</Tab>
            ))}
          </TabList>
          
          <TabPanels>
            {lineup.innings.map((inning) => {
              // Find players who aren't in this inning's lineup
              const benchPlayers = players
                .filter(player => player.active)
                .filter(player => !inning.positions.some(pos => pos.playerId === player.id));
              
              return (
                <TabPanel key={inning.inning} p={0}>
                  {benchPlayers.length === 0 ? (
                    <Text color="gray.500" fontSize="sm">No players on bench for this inning.</Text>
                  ) : (
                    <Flex flexWrap="wrap" gap={2}>
                      {benchPlayers.map(player => (
                        <Badge 
                          key={player.id} 
                          px={2} 
                          py={1} 
                          borderRadius="md" 
                          fontSize="xs"
                          bg="gray.100"
                          color="gray.800"
                        >
                          #{player.jerseyNumber} {player.lastName}, {player.firstName}
                        </Badge>
                      ))}
                    </Flex>
                  )}
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default withTeam(LineupDetailPage);