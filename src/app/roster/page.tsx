"use client";

import React, { useState } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  HStack,
  VStack,
  Spinner,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { useTeamContext } from '../../contexts/team-context';
import { usePlayers } from '../../hooks/use-players';
import { withTeam } from '../../contexts/team-context';
import { Position } from '../../types/player';
import PlayerList from '../../components/roster/player-list';
import { PageContainer } from '../../components/layout/page-container';
import { Card } from '../../components/common/card';

/**
 * Available filter positions
 */
const POSITION_FILTERS: { value: Position | 'all'; label: string }[] = [
  { value: 'all', label: 'All Positions' },
  { value: 'P', label: 'Pitchers' },
  { value: 'C', label: 'Catchers' },
  { value: '1B', label: 'First Base' },
  { value: '2B', label: 'Second Base' },
  { value: '3B', label: 'Third Base' },
  { value: 'SS', label: 'Shortstop' },
  { value: 'LF', label: 'Left Field' },
  { value: 'CF', label: 'Center Field' },
  { value: 'RF', label: 'Right Field' }
];

/**
 * Roster page component
 * Displays the team's roster with filtering options
 */
function RosterPage() {
  const { currentTeam } = useTeamContext();
  const { 
    players, 
    isLoading, 
    error, 
    deletePlayer, 
    togglePlayerActive,
    refreshPlayers
  } = usePlayers();
  
  // States for filters
  const [showInactive, setShowInactive] = useState(false);
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle position filter change
  const handlePositionFilterChange = (position: Position | 'all') => {
    setPositionFilter(position === 'all' ? null : position as Position);
  };
  
  // Handle deleting a player
  const handleDeletePlayer = (playerId: string) => {
    const success = deletePlayer(playerId);
    if (success) {
      refreshPlayers();
    } else {
      alert('Failed to delete player');
    }
  };
  
  // Handle toggling player active status
  const handleToggleActive = (playerId: string) => {
    const success = togglePlayerActive(playerId);
    if (success) {
      refreshPlayers();
    } else {
      alert('Failed to update player status');
    }
  };

  return (
    <PageContainer
      title="Team Roster"
      subtitle={currentTeam ? `${currentTeam.name} · ${currentTeam.ageGroup} · ${currentTeam.season}` : undefined}
    >
      
      {/* Stats Cards */}
      <StatGroup mb={6}>
        <Card flex="1">
          <Stat>
            <StatLabel color="gray.500">Total Players</StatLabel>
            <StatNumber>{players.length}</StatNumber>
          </Stat>
        </Card>
        
        <Card flex="1">
          <Stat>
            <StatLabel color="gray.500">Active Players</StatLabel>
            <StatNumber>{players.filter(p => p.active).length}</StatNumber>
          </Stat>
        </Card>
        
        <Card flex="1">
          <Stat>
            <StatLabel color="gray.500">Pitchers</StatLabel>
            <StatNumber>{players.filter(p => p.primaryPositions.includes('P')).length}</StatNumber>
          </Stat>
        </Card>
        
        <Card flex="1">
          <Stat>
            <StatLabel color="gray.500">Catchers</StatLabel>
            <StatNumber>{players.filter(p => p.primaryPositions.includes('C')).length}</StatNumber>
          </Stat>
        </Card>
      </StatGroup>
      
      {/* Search and Filters */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align="center" gap={4} mb={6}>
        <Flex gap={3} direction={{ base: "column", md: "row" }} flex="1" align={{ md: "center" }}>
          <InputGroup maxW={{ sm: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search players..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Select 
            placeholder="All Positions" 
            maxW={{ base: "100%", md: "180px" }}
            value={positionFilter || "all"}
            onChange={(e) => handlePositionFilterChange(e.target.value as Position | 'all')}
          >
            {POSITION_FILTERS.slice(1).map((position) => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </Select>

          <Checkbox
            isChecked={showInactive}
            onChange={() => setShowInactive(!showInactive)}
            colorScheme="blue"
            size="md"
          >
            <Text fontSize="sm" color="gray.700">
              Show Inactive
            </Text>
          </Checkbox>
        </Flex>
        
        <NextLink href="/roster/new" passHref>
          <Button 
            as="a"
            leftIcon={<AddIcon />}
            colorScheme="primary"
          >
            Add Player
          </Button>
        </NextLink>
      </Flex>
      
      {/* Player List */}
      {isLoading ? (
        <Flex justify="center" align="center" minH="300px" direction="column">
          <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
          <Text mt={4} color="gray.600">Loading players...</Text>
        </Flex>
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <PlayerList
          players={players}
          searchQuery={searchQuery}
          showInactive={showInactive}
          positionFilter={positionFilter}
          onDeletePlayer={handleDeletePlayer}
          onToggleActive={handleToggleActive}
          teamId={currentTeam?.id}
        />
      )}
    </PageContainer>
  );
}

// Wrap with withTeam HOC to ensure a team is selected
export default withTeam(RosterPage);