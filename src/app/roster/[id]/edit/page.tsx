"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Flex,
  Spinner,
  Text
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { withTeam } from '../../../../contexts/team-context';
import { useSinglePlayer } from '../../../../hooks/use-players';
import PlayerForm from '../../../../components/forms/player-form';
import { PageContainer } from '../../../../components/layout/page-container';
import { Card } from '../../../../components/common/card';

/**
 * Page for editing an existing player
 */
function EditPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  
  const { player, isLoading, error } = useSinglePlayer(playerId);
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="60vh" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading player data...</Text>
      </Flex>
    );
  }
  
  if (error || !player) {
    return (
      <PageContainer title="Player Not Found">
        <Box p={4} borderRadius="md" bg="red.50" color="red.700" mb={6}>
          <Flex align="center">
            <Box mr={3} color="red.400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </Box>
            <Text>{error || 'Player not found. Please select a valid player to edit.'}</Text>
          </Flex>
        </Box>
        
        <NextLink href="/roster" passHref>
          <Button
            as="a"
            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
            variant="link"
            colorScheme="primary"
          >
            Back to Roster
          </Button>
        </NextLink>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title="Edit Player"
      subtitle={`Update information for ${player.firstName} ${player.lastName}`}
      breadcrumbs={[
        { label: 'Roster', href: '/roster' },
        { label: `${player.firstName} ${player.lastName}`, href: `/roster/${player.id}` },
        { label: 'Edit' }
      ]}
    >
      {/* Form Card */}
      <Card>
        <PlayerForm initialPlayer={player} isEditing={true} />
      </Card>
    </PageContainer>
  );
}

export default withTeam(EditPlayerPage);