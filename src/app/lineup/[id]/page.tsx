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
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import { FaPrint } from 'react-icons/fa';
import { withTeam } from '@/contexts/team-context';
import { Lineup } from '@/types/lineup';
import { Player } from '@/types/player';
import { Game } from '@/types/game';
import { storageService } from '@/services/storage/enhanced-storage';
import { getFairPlayIssues } from '@/utils/lineup-utils';
import LineupViewGrid from '../../../components/lineup/lineup-view-grid';

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
  const [currentInning, setCurrentInning] = useState<number>(1);
  
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
  
  // Handle print action
  const handlePrint = () => {
    window.print();
  };
  
  // UI colors
  const headerBg = useColorModeValue('gray.50', 'gray.700');
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
        <Tabs 
          variant="enclosed" 
          colorScheme="primary" 
          isLazy
          onChange={(index) => setCurrentInning(index + 1)}
        >
          <TabList bg={headerBg}>
            {lineup.innings.map((inning) => (
              <Tab key={inning.inning}>Inning {inning.inning}</Tab>
            ))}
          </TabList>
          
          <TabPanels>
            {lineup.innings.map((inning) => (
              <TabPanel key={inning.inning} p={0}>
                <LineupViewGrid 
                  lineup={lineup}
                  currentInning={inning.inning}
                  players={players}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* Lineup Summary and Analysis (optional) */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
        p={6}
      >
        <Heading size="md" mb={4}>Lineup Summary</Heading>
        <Text>
          This lineup includes {players.filter(player => 
            lineup.innings.some(inning => 
              inning.positions.some(pos => pos.playerId === player.id)
            )
          ).length} players across {lineup.innings.length} innings.
        </Text>
        
        {fairPlayIssues.length > 0 ? (
          <Alert status="warning" variant="subtle" mt={4}>
            <AlertIcon />
            <Text fontSize="sm">
              There are some fair play concerns with this lineup. Consider reviewing the issues
              and adjusting player positions for more balanced participation.
            </Text>
          </Alert>
        ) : (
          <Alert status="success" variant="subtle" mt={4}>
            <AlertIcon />
            <Text fontSize="sm">
              This lineup follows fair play principles with balanced position assignments.
            </Text>
          </Alert>
        )}
      </Box>
    </Container>
  );
}

export default withTeam(LineupDetailPage);