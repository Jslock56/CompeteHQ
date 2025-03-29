"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { withTeam } from '@/contexts/team-context';
import { useTeamContext } from '@/contexts/team-context';
import { usePlayers } from '@/hooks/use-players';
import FieldPositionLineupBuilder from '@/components/lineup/field-position-lineup-builder';
import { Lineup } from '@/types/lineup';

/**
 * Create a new field position lineup
 */
function NewFieldPositionLineupPage() {
  const router = useRouter();
  const toast = useToast();
  const { currentTeam } = useTeamContext();
  
  // Get players for the team
  const { players } = usePlayers();
  
  // Handler when lineup is saved
  const handleSave = (lineup: Lineup) => {
    toast({
      title: "Lineup created",
      description: `Field position lineup "${lineup.name}" has been created successfully.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // Navigate to the dashboard
    router.push('/lineup/dashboard');
  };
  
  // Handler when cancel is pressed
  const handleCancel = () => {
    router.push('/lineup/dashboard');
  };
  
  return (
    <Container maxW="container.xl" py={8}>
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
          <Text color="gray.500">Create New Lineup</Text>
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
            Create Field Position Lineup
          </Heading>
          <Text color="gray.600">
            {currentTeam?.name} • {currentTeam?.season}
          </Text>
        </Box>
      </Flex>
      
      {/* Lineup Builder */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
        p={{ base: 4, md: 6 }}
      >
        <FieldPositionLineupBuilder
          teamId={currentTeam?.id || ''}
          players={players}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
}

export default withTeam(NewFieldPositionLineupPage);