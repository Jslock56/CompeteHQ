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
  AlertIcon,
  useToast
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
  const toast = useToast();
  const gameId = params.id as string;
  
  // Get game data
  const { game, isLoading, error } = useSingleGame(gameId);
  const { deleteGame } = useGames();
  
  // State for delete confirmations (game and lineup)
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Track which delete operation we're confirming (game or lineup)
  const [deleteMode, setDeleteMode] = useState<'game' | 'lineup'>('game');
  
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
  
  // Handle deleting just the lineup (not the game)
  const handleDeleteLineup = async () => {
    if (!game || !game.lineupId) return;
    
    try {
      console.log(`Deleting lineup for game: ${game.id}, lineupId: ${game.lineupId}`);
      
      // Call API to delete the lineup
      const response = await fetch(`/api/games/${game.id}/lineup`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("Delete lineup API response:", responseData);
        
        toast({
          title: "Lineup deleted",
          description: "The lineup has been deleted successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // The API now handles updating the game reference, so we just need to refresh the UI
        window.location.reload();
      } else {
        console.error('Failed to delete lineup, server returned:', response.status);
        let errorMessage = "Failed to delete lineup.";
        
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting lineup:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the lineup.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    
    onClose();
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

          {/* Lineup Buttons */}
          <Flex direction="column" gap={2} minWidth="200px">
            <HStack spacing={2}>
              <Badge 
                colorScheme={hasLineup ? "green" : "orange"} 
                py={1} 
                px={2}
                fontSize="sm"
                borderRadius="md"
              >
                {hasLineup ? "Lineup Ready" : "No Lineup"}
              </Badge>
              
              {hasLineup && (
                <Button 
                  size="xs" 
                  colorScheme="red" 
                  variant="ghost"
                  leftIcon={<DeleteIcon />}
                  onClick={() => {
                    setDeleteMode('lineup');
                    onOpen();
                  }}
                >
                  Delete
                </Button>
              )}
            </HStack>
            
            <HStack spacing={2} wrap="wrap">
              {hasLineup && (
                <NextLink href={`/lineup/${game.lineupId}`} passHref>
                  <Button 
                    as="a" 
                    leftIcon={<Icon as={CalendarIcon} />} 
                    colorScheme="primary" 
                    size="md"
                    variant="solid"
                    w="140px"
                  >
                    View Lineup
                  </Button>
                </NextLink>
              )}
              
              <NextLink href={`/games/${game.id}/lineup/create`} passHref>
                <Button 
                  as="a" 
                  leftIcon={hasLineup ? <EditIcon /> : <AddIcon />} 
                  colorScheme={hasLineup ? "teal" : "green"}
                  size="md"
                  variant="solid"
                  w="140px"
                  fontWeight="bold"
                >
                  {hasLineup ? 'Edit Lineup' : 'Create Lineup'}
                </Button>
              </NextLink>
            </HStack>
          </Flex>

          {/* Delete Button */}
          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            onClick={() => {
              setDeleteMode('game');
              onOpen();
            }}
          >
            Delete Game
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
              <Flex align="center">
                <Badge 
                  colorScheme="green" 
                  py={1.5} 
                  px={3} 
                  borderRadius="md"
                  mr={2}
                >
                  ✓ Ready
                </Badge>
                <Text color="green.600" fontSize="sm" fontWeight="medium">
                  Lineup created on {lineup ? new Date(lineup.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </Flex>
            ) : (
              <Flex align="center">
                <Badge 
                  colorScheme="orange" 
                  py={1.5} 
                  px={3} 
                  borderRadius="md"
                  mr={2}
                >
                  ! Needed
                </Badge>
                <NextLink href={`/games/${game.id}/lineup/create`} passHref>
                  <Button 
                    as="a" 
                    size="xs" 
                    leftIcon={<AddIcon />} 
                    colorScheme="green"
                    ml={2}
                  >
                    Create Now
                  </Button>
                </NextLink>
              </Flex>
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
            <Box 
              bg="green.50" 
              p={4} 
              borderRadius="lg" 
              textAlign="center" 
              maxW="md" 
              mx="auto"
              borderWidth="1px"
              borderColor="green.200"
            >
              <Flex justify="center" mb={3}>
                <Icon as={CalendarIcon} boxSize={12} color="green.500" />
              </Flex>
              <Heading size="sm" mb={2} color="green.700">Lineup Ready for Game Day</Heading>
              <Text fontSize="sm" color="green.600" textAlign="center" mb={4}>
                This game has a complete lineup with {lineup.innings?.length || '?'} innings and positions assigned.
              </Text>
              <HStack spacing={3} justify="center">
                <NextLink href={`/lineup/${lineup.id}`} passHref>
                  <Button as="a" colorScheme="green" size="sm">
                    View Full Lineup
                  </Button>
                </NextLink>
                <NextLink href={`/games/${game.id}/lineup/create`} passHref>
                  <Button as="a" variant="outline" colorScheme="blue" size="sm">
                    Edit Lineup
                  </Button>
                </NextLink>
              </HStack>
            </Box>
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
                <HStack spacing={2} alignItems="flex-start" mt={3}>
                  <Box 
                    p={3} 
                    bg="orange.50" 
                    borderRadius="md" 
                    borderWidth="1px" 
                    borderColor="orange.200"
                    width="100%"
                  >
                    <Flex align="center" justify="space-between">
                      <HStack>
                        <Box as="span" fontSize="xl" color="orange.500">⚠️</Box>
                        <Text fontWeight="bold" color="orange.700">
                          This game doesn&apos;t have a lineup yet!
                        </Text>
                      </HStack>
                      <NextLink href={`/games/${game.id}/lineup/create`} passHref>
                        <Button 
                          as="a" 
                          size="sm" 
                          colorScheme="green" 
                          leftIcon={<AddIcon />}
                        >
                          Create Lineup Now
                        </Button>
                      </NextLink>
                    </Flex>
                  </Box>
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
          <ModalHeader>
            {deleteMode === 'game' ? 'Delete Game' : 'Delete Lineup'}
          </ModalHeader>
          <ModalBody>
            {deleteMode === 'game' ? (
              <>
                Are you sure you want to delete the game against {game.opponent}? This action cannot be undone.
                {hasLineup && " This will also delete the associated lineup."}
              </>
            ) : (
              <>
                Are you sure you want to delete the lineup for this game against {game.opponent}? 
                This action cannot be undone. The game itself will not be deleted.
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={deleteMode === 'game' ? handleDeleteGame : handleDeleteLineup}
            >
              {deleteMode === 'game' ? 'Delete Game' : 'Delete Lineup'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default withTeam(GameDetailPage);