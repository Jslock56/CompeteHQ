"use client";

import React, { useEffect, useState } from 'react';
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
  HStack,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Grid,
  GridItem,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tag,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import { withTeam } from '@/contexts/team-context';
import { Lineup, Position } from '@/types/lineup';
import { Player } from '@/types/player';
import { storageService } from '@/services/storage/enhanced-storage';
import PositionBadge from '@/components/common/position-badge';

/**
 * View a field position lineup
 */
function LineupViewPage() {
  const params = useParams();
  const router = useRouter();
  
  // Get lineup ID from URL parameters
  const lineupId = Array.isArray(params.id) ? params.id[0] : params.id as string;
  
  // State
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        
        // Load team players
        const teamPlayers = await storageService.player.getPlayersByTeam(lineupData.teamId);
        setPlayers(teamPlayers);
      } catch (err) {
        setError(`Failed to load lineup: ${String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [lineupId]);
  
  // Get the player assigned to a position
  const getPlayerForPosition = (position: Position): Player | undefined => {
    if (!lineup) return undefined;
    
    // For field-position lineups, they always have a single inning
    const inning = lineup.innings[0];
    const assignment = inning.positions.find(pos => pos.position === position);
    
    if (!assignment || !assignment.playerId) return undefined;
    
    return players.find(player => player.id === assignment.playerId);
  };
  
  // Get the unassigned (bench) players
  const getBenchPlayers = (): Player[] => {
    if (!lineup) return [];
    
    // For field-position lineups, they always have a single inning
    const inning = lineup.innings[0];
    const assignedPlayerIds = inning.positions
      .filter(pos => pos.playerId)
      .map(pos => pos.playerId);
    
    return players.filter(player => !assignedPlayerIds.includes(player.id));
  };
  
  // UI colors
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const positionBgColor = useColorModeValue('white', 'gray.700');
  const outfieldColor = useColorModeValue('green.50', 'green.900');
  const infieldColor = useColorModeValue('orange.50', 'orange.900');
  
  if (isLoading) {
    return (
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" minH="60vh" direction="column">
          <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
          <Text mt={4} color="gray.600">Loading lineup data...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (error || !lineup) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Failed to load lineup data'}
        </Alert>
        
        <Button colorScheme="primary" variant="link" onClick={() => router.push('/lineup/dashboard')}>
          Go Back to Lineups
        </Button>
      </Container>
    );
  }
  
  const benchPlayers = getBenchPlayers();
  
  return (
    <Container maxW="6xl" py={8}>
      {/* Breadcrumbs */}
      <Breadcrumb 
        separator={<ChevronRightIcon color="gray.500" />} 
        mb={6}
        fontSize="sm"
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={NextLink} href="/lineup/dashboard" color="gray.500">
            Lineups
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text color="gray.500">{lineup.name}</Text>
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
          <Heading size="lg" mb={1} display="flex" alignItems="center">
            {lineup.name}
            {lineup.isDefault && (
              <Badge colorScheme="yellow" ml={2}>Default</Badge>
            )}
          </Heading>
          <Text color="gray.600">
            {lineup.type === 'competitive' ? 'Competitive' : 
             lineup.type === 'developmental' ? 'Developmental' : 'Standard'} Lineup • 
            Created {new Date(lineup.createdAt).toLocaleDateString()}
          </Text>
        </Box>
        
        <HStack spacing={3}>
          <Button 
            as={NextLink}
            href={`/lineup/${lineup.id}/edit`}
            leftIcon={<EditIcon />}
            colorScheme="primary"
          >
            Edit Lineup
          </Button>
        </HStack>
      </Flex>
      
      {/* Lineup Display */}
      <Grid
        templateColumns={{ base: "1fr", lg: "3fr 1fr" }}
        gap={6}
        mb={6}
      >
        {/* Positions Grid */}
        <GridItem>
          <Card>
            <CardHeader bg={headerBg} py={3} px={4}>
              <Heading size="md">Field Positions</Heading>
            </CardHeader>
            
            <CardBody p={4}>
              {/* Lineup Table */}
              <Table variant="simple" size="sm">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th width="100px">Position</Th>
                    <Th>Player</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as Position[]).map(position => {
                    const player = getPlayerForPosition(position);
                    
                    return (
                      <Tr key={position}>
                        <Td>
                          <PositionBadge position={position} />
                        </Td>
                        <Td>
                          {player ? (
                            <Flex align="center">
                              <Text fontWeight="medium">
                                #{player.jerseyNumber} {player.firstName} {player.lastName}
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
            </CardBody>
          </Card>
        </GridItem>
        
        {/* Bench List */}
        <GridItem>
          <Card height="100%">
            <CardHeader bg={headerBg} py={3} px={4}>
              <Heading size="md">Bench</Heading>
            </CardHeader>
            
            <CardBody p={4}>
              {benchPlayers.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={4}>
                  No players on the bench
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {benchPlayers.map(player => (
                    <Flex 
                      key={player.id} 
                      p={2} 
                      bg="gray.50" 
                      borderRadius="md"
                      align="center"
                    >
                      <Flex
                        justify="center"
                        align="center"
                        bg="gray.200"
                        borderRadius="full"
                        boxSize="30px"
                        mr={2}
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {player.jerseyNumber}
                      </Flex>
                      
                      <Text>
                        {player.firstName} {player.lastName}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}

export default withTeam(LineupViewPage);