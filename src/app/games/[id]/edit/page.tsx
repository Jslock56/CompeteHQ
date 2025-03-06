"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Box, 
  Container,
  Heading, 
  Text, 
  Flex, 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  Button,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { withTeam } from '../../../../contexts/team-context';
import { useSingleGame } from '../../../../hooks/use-games';
import GameForm from '../../../../components/forms/game-form';

/**
 * Page for editing an existing game
 */
function EditGamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const { game, isLoading, error } = useSingleGame(gameId);
  
  if (isLoading) {
    return (
      <Container maxW="2xl" py={8}>
        <Flex 
          align="center" 
          justify="center" 
          minH="60vh" 
          direction="column"
        >
          <Box 
            className="animate-spin" 
            h="12" 
            w="12" 
            borderWidth="2px" 
            borderBottomColor="primary.600" 
            borderRadius="full" 
            mb={4}
          />
          <Text color="gray.600">Loading game details...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (error || !game) {
    return (
      <Container maxW="2xl" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Game not found. Please select a valid game to edit.'}
        </Alert>
        <Box mt={6}>
          <NextLink href="/games" passHref>
            <Button 
              leftIcon={<ChevronRightIcon transform="rotate(180deg)" />} 
              variant="link" 
              colorScheme="primary"
              fontSize="sm"
            >
              Back to Games
            </Button>
          </NextLink>
        </Box>
      </Container>
    );
  }
  
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
        <BreadcrumbItem>
          <NextLink href={`/games/${game.id}`} passHref>
            <BreadcrumbLink color="gray.500" _hover={{ color: "gray.700" }}>
              vs. {game.opponent}
            </BreadcrumbLink>
          </NextLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text color="gray.500">Edit</Text>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Header */}
      <Flex direction="column" mb={8}>
        <Heading size="lg" color="gray.900" mb={2}>Edit Game</Heading>
        <Text color="gray.600">Update the details for the game against {game.opponent}.</Text>
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
          <GameForm initialGame={game} isEditing={true} />
        </Box>
      </Box>
    </Container>
  );
}

export default withTeam(EditGamePage);