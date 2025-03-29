"use client";

import React, { useEffect } from 'react';
import { Container, Heading, Text, Box, Flex, Button, Spinner } from '@chakra-ui/react';
import { withTeam } from '@/contexts/team-context';
import { useFieldPositionLineups } from '@/hooks/use-lineup';
import LineupDashboard from '@/components/lineup/lineup-dashboard';
import { useTeamContext } from '@/contexts/team-context';

/**
 * Lineup Dashboard page for managing field position lineups
 */
function LineupDashboardPage() {
  const { currentTeam } = useTeamContext();
  
  // Use the field-position lineups hook
  const { 
    lineups, 
    isLoading, 
    error, 
    loadLineups, 
    setDefaultLineup,
    deleteLineup
  } = useFieldPositionLineups(currentTeam?.id || '');
  
  // Load lineups when team changes
  useEffect(() => {
    if (currentTeam) {
      loadLineups();
    }
  }, [currentTeam, loadLineups]);
  
  return (
    <Container maxW="container.xl" py={8}>
      <Flex direction="column" gap={6}>
        {/* Main content */}
        <Box width="100%">
          <LineupDashboard
            lineups={lineups}
            isLoading={isLoading}
            error={error}
            onDeleteLineup={deleteLineup}
            onSetDefault={setDefaultLineup}
          />
        </Box>
      </Flex>
    </Container>
  );
}

export default withTeam(LineupDashboardPage);