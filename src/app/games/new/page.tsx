"use client";

import React from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Box, 
  Heading, 
  Text, 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  Container,
  Flex,
  Icon 
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { withTeam } from '../../../contexts/team-context';
import GameForm from '../../../components/forms/game-form';

/**
 * Page for creating a new game
 */
function NewGamePage() {
  // We're not using teamId right now, but keeping it commented for reference
  const searchParams = useSearchParams();
  // const teamId = searchParams.get('teamId');
  
  return (
    <Container maxW="2xl" py={8}>
      {/* Breadcrumbs */}
      <Breadcrumb 
        spacing="8px" 
        separator={<ChevronRightIcon color="gray.500" />} 
        mb={6}
        fontSize="sm"
      >
        <BreadcrumbItem>
          <NextLink href="/games" passHref>
            <BreadcrumbLink color="gray.500" _hover={{ color: "gray.700" }}>
              Games
            </BreadcrumbLink>
          </NextLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text color="gray.500">Add New Game</Text>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Header */}
      <Flex direction="column" mb={8}>
        <Heading size="lg" color="gray.900" mb={2}>Add New Game</Heading>
        <Text color="gray.600">Schedule a new game by entering the details below.</Text>
      </Flex>
      
      {/* Form Card */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <Box px={{ base: 4, sm: 6 }} py={5}>
          <GameForm />
        </Box>
      </Box>
    </Container>
  );
}

export default withTeam(NewGamePage);