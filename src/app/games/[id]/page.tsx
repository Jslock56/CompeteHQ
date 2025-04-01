"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { 
  Box, 
  Container,
  Flex, 
  Heading, 
  Text, 
  Button, 
  IconButton,
  HStack, 
  VStack,
  Badge, 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  SimpleGrid,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Icon,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  CalendarIcon, 
  TimeIcon, 
  EditIcon, 
  DeleteIcon, 
  AddIcon 
} from '@chakra-ui/icons';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { withTeam } from '../../../contexts/team-context';
import { useSingleGame, useGames } from '../../../hooks/use-games';
import { storageService } from '../../../services/storage/enhanced-storage';

/**
 * Game detail page component
 */
function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  // Get game data
  const { game, isLoading, error } = useSingleGame(gameId);
  const { deleteGame } = useGames();
  
  // State for delete confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Handle deleting the game
  const handleDeleteGame = () => {
    if (!game) return;
    
    const success = deleteGame(game.id);
    
    if (success) {
      router.push('/games');
    } else {
      alert('Failed to delete game');
    }
  };
  
  // Format dates for display
  const formatGameDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const dateStr = format(date, 'EEEE, MMMM d, yyyy');
    const timeStr = format(date, 'h:mm a');
    return { dateStr, timeStr };
  };
  
  if (isLoading) {
    return (
      <Container maxW="4xl" py={8}>
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
      <Container maxW="4xl" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {error || 'Game not found'}
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
  
  // Get formatted date and time
  const { dateStr, timeStr } = formatGameDate(game.date);
  
  // Check if game has a lineup
  const hasLineup = Boolean(game.lineupId);
  
  // Check if the game is in the future
  const isUpcoming = game.date > Date.now();
  
  // Get lineup if available
  const lineup = game.lineupId ? storageService.lineup.getLineup(game.lineupId) : null;
  
  // Determine status badge color
  const getStatusBadgeProps = () => {
    switch (game.status) {
      case 'scheduled':
        return { colorScheme: 'blue' };
      case 'in-progress':
        return { colorScheme: 'yellow' };
      case 'completed':
        return { colorScheme: 'green' };
      case 'canceled':
        return { colorScheme: 'red' };
      default:
        return { colorScheme: 'gray' };
    }
  };
  
  // Format status for display
  const getStatusText = () => {
    switch (game.status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <Container maxW="4xl" py={8}>
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
          <Text color="gray.500">vs. {game.opponent}</Text>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Header */}
      <Flex 
        direction={{ base: "column", md: "row" }} 
        justify="space-between" 
        align={{ base: "flex-start", md: "center" }}
        mb={6}
      >
        <Box mb={{ base: 4, md: 0 }}>
          <Heading size="lg" mb={1}>
            vs. {game.opponent}
          </Heading>
          <Flex 
            wrap="wrap" 
            mt={1} 
            gap={6}
          >
            <HStack spacing={2} color="gray.500" fontSize="sm">
              <Icon as={CalendarIcon} />
              <Text>{dateStr} at {timeStr}</Text>
            </HStack>
            <HStack spacing={2} color="gray.500" fontSize="sm">
              <Icon as={FaMapMarkerAlt} />
              <Text>{game.location}</Text>
            </HStack>
            <HStack spacing={2} color="gray.500" fontSize="sm">
              <Icon as={TimeIcon} />
              <Text>{game.innings} Innings</Text>
            </HStack>
            <Badge {...getStatusBadgeProps()} alignSelf="center">
              {getStatusText()}
            </Badge>
          </Flex>
        </Box>
        
        <HStack spacing={3} mt={{ base: 4, md: 0 }}>
          {/* Edit Button */}
          <NextLink href={`/games/${game.id}/edit`} passHref>
            <Button 
              as="a" 
              leftIcon={<EditIcon />} 
              variant="outline" 
              display={{ base: "none", sm: "flex" }}
            >
              Edit
            </Button>
          </NextLink>

          {/* Lineup Button */}
          {hasLineup ? (
            <NextLink href={`/lineup/${game.lineupId}`} passHref>
              <Button as="a" leftIcon={<Icon as={CalendarIcon} />} colorScheme="primary">
                View Lineup
              </Button>
            </NextLink>
          ) : isUpcoming ? (
            <NextLink href={`/games/${game.id}/lineup/create`} passHref>
              <Button as="a" leftIcon={<AddIcon />} colorScheme="primary">
                Create Lineup
              </Button>
            </NextLink>
          ) : (
            <Button 
              leftIcon={<Icon as={CalendarIcon} />} 
              isDisabled 
              variant="outline" 
              cursor="not-allowed"
              opacity={0.6}
            >
              No Lineup
            </Button>
          )}

          {/* Delete Button */}
          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            onClick={onOpen}
          >
            Delete
          </Button>
        </HStack>
      </Flex>
      
      {/* Game Information */}
      <Box 
        bg="white" 
        shadow="sm" 
        borderRadius="lg" 
        overflow="hidden" 
        borderWidth="1px"
        borderColor="gray.200"
        mb={8}
      >
        <Flex p={6} direction="column">
          <Heading size="md" mb={2}>Game Information</Heading>
          <Text fontSize="sm" color="gray.500" mb={4}>Details about the game.</Text>
        </Flex>
        
        <Divider />
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={0}>
          <Box bg="gray.50" p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Opponent</Text>
            <Text>{game.opponent}</Text>
          </Box>
          
          <Box p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Date</Text>
            <Text>{dateStr}</Text>
          </Box>
          
          <Box p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Time</Text>
            <Text>{timeStr}</Text>
          </Box>
          
          <Box bg="gray.50" p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Location</Text>
            <Text>{game.location}</Text>
          </Box>
          
          <Box bg="gray.50" p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Innings</Text>
            <Text>{game.innings}</Text>
          </Box>
          
          <Box p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Status</Text>
            <Badge {...getStatusBadgeProps()}>
              {getStatusText()}
            </Badge>
          </Box>
          
          <Box p={6}>
            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>Lineup Status</Text>
            {hasLineup ? (
              <Badge colorScheme="green">Lineup Created</Badge>
            ) : (
              <Badge colorScheme="yellow">No Lineup</Badge>
            )}
          </Box>
        </SimpleGrid>
      </Box>
      
      {/* Lineup Preview (if exists) */}
      {hasLineup && lineup && (
        <Box 
          bg="white" 
          shadow="sm" 
          borderRadius="lg" 
          overflow="hidden" 
          borderWidth="1px"
          borderColor="gray.200"
          mb={8}
        >
          <Flex p={6} justify="space-between" align="center">
            <Box>
              <Heading size="md" mb={1}>Lineup Preview</Heading>
              <Text fontSize="sm" color="gray.500">
                {lineup.status === 'draft' ? 'Draft lineup' : 'Final lineup'} for this game.
              </Text>
            </Box>
            <NextLink href={`/lineup/${lineup.id}`} passHref>
              <Button as="a" size="sm" colorScheme="primary" borderRadius="full">
                Full Lineup
              </Button>
            </NextLink>
          </Flex>
          
          <Divider />
          
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            py={8} 
            px={6}
          >
            <Icon as={CalendarIcon} boxSize={12} color="gray.400" mb={4} />
            <Heading size="sm" mb={2}>View full lineup details</Heading>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Click the button above to see the complete lineup with all positions and innings.
            </Text>
          </Flex>
        </Box>
      )}
      
      {/* Game Day Notes (for upcoming games) */}
      {isUpcoming && (
        <Box 
          bg="white" 
          shadow="sm" 
          borderRadius="lg" 
          overflow="hidden" 
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Flex p={6} direction="column">
            <Heading size="md" mb={2}>Game Day Preparation</Heading>
            <Text fontSize="sm" color="gray.500">Tips for preparing for the game.</Text>
          </Flex>
          
          <Divider />
          
          <Box p={6}>
            <VStack spacing={2} align="stretch">
              <HStack spacing={2} alignItems="flex-start">
                <Box as="span" fontSize="lg" mt={1}>•</Box>
                <Text>Arrive at the field at least 30 minutes before game time.</Text>
              </HStack>
              <HStack spacing={2} alignItems="flex-start">
                <Box as="span" fontSize="lg" mt={1}>•</Box>
                <Text>Bring water and snacks for the players.</Text>
              </HStack>
              <HStack spacing={2} alignItems="flex-start">
                <Box as="span" fontSize="lg" mt={1}>•</Box>
                <Text>Check the weather forecast and prepare accordingly.</Text>
              </HStack>
              <HStack spacing={2} alignItems="flex-start">
                <Box as="span" fontSize="lg" mt={1}>•</Box>
                <Text>Make sure all equipment is packed and ready.</Text>
              </HStack>
              <HStack spacing={2} alignItems="flex-start">
                <Box as="span" fontSize="lg" mt={1}>•</Box>
                <Text>Communicate any last-minute changes to players and parents.</Text>
              </HStack>
              {!hasLineup && (
                <HStack spacing={2} alignItems="flex-start">
                  <Box as="span" fontSize="lg" mt={1}>•</Box>
                  <Text fontWeight="bold" color="primary.600">
                    Don&apos;t forget to create a lineup for this game!
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>
        </Box>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Game</ModalHeader>
          <ModalBody>
            Are you sure you want to delete the game against {game.opponent}? This action cannot be undone.
            {hasLineup && " This will also delete the associated lineup."}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteGame}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default withTeam(GameDetailPage);