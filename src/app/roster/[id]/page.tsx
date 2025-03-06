"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Grid,
  GridItem,
  IconButton,
  SimpleGrid,
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  EditIcon, 
  DeleteIcon, 
  CheckIcon, 
  CloseIcon 
} from '@chakra-ui/icons';
import { withTeam } from '../../../contexts/team-context';
import { useSinglePlayer, usePlayers } from '../../../hooks/use-players';
import { Position } from '../../../types/player';
import { PositionBadge } from '../../../components/common/position-badge';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/common/card';

/**
 * Position badge component with optional description
 */
const PositionBadgeWithLabel: React.FC<{ position: Position; isPrimary?: boolean }> = ({ 
  position, 
  isPrimary = true 
}) => {
  // Position descriptions
  const positionDescriptions: Record<Position, string> = {
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
  
  return (
    <Flex align="center">
      <PositionBadge 
        position={position} 
        isPrimary={isPrimary} 
        h="8" 
        w="8" 
        fontSize="sm" 
      />
      <Text ml={2} color="gray.700">{positionDescriptions[position]}</Text>
    </Flex>
  );
};

/**
 * Player detail page component
 */
function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  
  const { deletePlayer, togglePlayerActive } = usePlayers();
  const { player, isLoading, error } = useSinglePlayer(playerId);
  
  // State for delete confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Handle player deletion
  const handleDeletePlayer = () => {
    if (!player) return;
    
    const success = deletePlayer(player.id);
    
    if (success) {
      router.push('/roster');
    } else {
      alert('Failed to delete player');
    }
    
    onClose();
  };
  
  // Handle toggling active status
  const handleToggleActive = () => {
    if (!player) return;
    
    const success = togglePlayerActive(player.id);
    
    if (!success) {
      alert('Failed to update player status');
    }
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="60vh" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading player details...</Text>
      </Flex>
    );
  }
  
  if (error || !player) {
    return (
      <PageContainer title="Player Not Found">
        <Alert status="error" variant="subtle" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Player not found. Please select a valid player.'}
        </Alert>
        
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
      title={`${player.firstName} ${player.lastName}`}
      breadcrumbs={[
        { label: 'Roster', href: '/roster' },
        { label: `${player.firstName} ${player.lastName}` }
      ]}
      action={
        <HStack spacing={3}>
          <Button
            onClick={handleToggleActive}
            colorScheme={player.active ? "yellow" : "green"}
            variant="outline"
            leftIcon={player.active ? <CloseIcon /> : <CheckIcon />}
          >
            {player.active ? 'Mark as Inactive' : 'Mark as Active'}
          </Button>
          
          <NextLink href={`/roster/${player.id}/edit`} passHref>
            <Button as="a" leftIcon={<EditIcon />} variant="outline">
              Edit
            </Button>
          </NextLink>
          
          <Button
            colorScheme="red"
            onClick={onOpen}
            leftIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </HStack>
      }
    >
      {/* Player Info Card */}
      <Card mb={6}>
        <Flex align="flex-start">
          {/* Jersey Number Circle */}
          <Flex
            justify="center"
            align="center"
            bg="primary.100"
            color="primary.700"
            fontSize="xl"
            fontWeight="bold"
            w="12"
            h="12"
            borderRadius="full"
            flexShrink={0}
          >
            {player.jerseyNumber}
          </Flex>
          
          <Box ml={4}>
            <Flex align="center" mb={2}>
              <Heading as="h2" size="md">
                {player.firstName} {player.lastName}
              </Heading>
              {!player.active && (
                <Badge ml={2} colorScheme="gray">
                  Inactive
                </Badge>
              )}
            </Flex>
            
            <Text color="gray.500">
              Created on {new Date(player.createdAt).toLocaleDateString()}
            </Text>
          </Box>
        </Flex>
      </Card>
      
      {/* Player Details Card */}
      <Card mb={6}>
        <Heading size="md" mb={4}>Player Information</Heading>
        
        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap={4}>
          <GridItem>
            <Text fontWeight="medium" color="gray.500" fontSize="sm">First Name</Text>
            <Text mt={1}>{player.firstName}</Text>
          </GridItem>
          
          <GridItem>
            <Text fontWeight="medium" color="gray.500" fontSize="sm">Last Name</Text>
            <Text mt={1}>{player.lastName}</Text>
          </GridItem>
          
          <GridItem>
            <Text fontWeight="medium" color="gray.500" fontSize="sm">Jersey Number</Text>
            <Text mt={1}>#{player.jerseyNumber}</Text>
          </GridItem>
          
          <GridItem>
            <Text fontWeight="medium" color="gray.500" fontSize="sm">Status</Text>
            <Badge mt={1} colorScheme={player.active ? "green" : "gray"} fontSize="xs">
              {player.active ? 'Active' : 'Inactive'}
            </Badge>
          </GridItem>
        </Grid>
        
        <Box mt={6}>
          <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Primary Positions</Text>
          {player.primaryPositions.length > 0 ? (
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
              {player.primaryPositions.map((position) => (
                <PositionBadgeWithLabel key={position} position={position} isPrimary={true} />
              ))}
            </SimpleGrid>
          ) : (
            <Text color="gray.500">None</Text>
          )}
        </Box>
        
        <Box mt={6}>
          <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Secondary Positions</Text>
          {player.secondaryPositions.length > 0 ? (
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
              {player.secondaryPositions.map((position) => (
                <PositionBadgeWithLabel key={position} position={position} isPrimary={false} />
              ))}
            </SimpleGrid>
          ) : (
            <Text color="gray.500">None</Text>
          )}
        </Box>
        
        {player.notes && (
          <Box mt={6}>
            <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Notes</Text>
            <Text whiteSpace="pre-line">{player.notes}</Text>
          </Box>
        )}
      </Card>
      
      {/* Position History - To be implemented in future phase */}
      <Card>
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Heading size="md">Position History</Heading>
            <Text color="gray.500" fontSize="sm">
              Tracking of positions played over time will be available in a future update.
            </Text>
          </Box>
        </Flex>
        
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          py={8} 
          bg="gray.50" 
          borderRadius="md"
        >
          <Box color="gray.400" mb={3}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </Box>
          <Heading as="h3" size="sm" fontWeight="medium" mb={1}>
            No position history yet
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Position history will be available once you&apos;ve created lineups for games.
          </Text>
        </Flex>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Player</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete {player.firstName} {player.lastName}? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeletePlayer}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}

export default withTeam(PlayerDetailPage);