"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Spinner,
  Flex,
  Text
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import TeamForm from '../../../../components/forms/team-form';
import { Team } from '../../../../types/team';
import { storageService } from '../../../../services/storage/enhanced-storage';
import { PageContainer } from '../../../../components/layout/page-container';

/**
 * Page for editing an existing team
 */
export default function EditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load team data
  useEffect(() => {
    if (teamId) {
      setIsLoading(true);
      try {
        const teamData = storageService.team.getTeam(teamId);
        setTeam(teamData);
      } catch (err) {
        setError(`Failed to load team: ${String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [teamId]);
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="60vh" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading team details...</Text>
      </Flex>
    );
  }
  
  if (error || !team) {
    return (
      <PageContainer title="Team Not Found">
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
            <Text>{error || 'Team not found. Please select a valid team to edit.'}</Text>
          </Flex>
        </Box>
        
        <NextLink href="/teams" passHref>
          <Button
            as="a"
            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
            variant="link"
            colorScheme="primary"
          >
            Back to Teams
          </Button>
        </NextLink>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title="Edit Team"
      subtitle="Update your team's information."
      breadcrumbs={[
        { label: 'Teams', href: '/teams' },
        { label: team.name, href: `/teams/${team.id}` },
        { label: 'Edit' }
      ]}
    >
      {/* Form Card */}
      <TeamForm initialTeam={team} isEditing={true} />
    </PageContainer>
  );
}