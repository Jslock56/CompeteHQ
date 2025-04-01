'use client';

import React from 'react';
import NextLink from 'next/link';
import { 
  Box, 
  Flex, 
  Text, 
  Heading, 
  Badge, 
  HStack, 
  Button, 
  IconButton, 
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Link,
  Icon
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { Game } from '../../types/game';
import { format } from 'date-fns';

interface GameCardProps {
  /**
   * Game data to display
   */
  game: Game;
  
  /**
   * Whether to show additional actions
   */
  showActions?: boolean;
  
  /**
   * Callback when the delete button is clicked
   */
  onDelete?: (gameId: string) => void;
}

/**
 * Card component for displaying game information
 */
const GameCard: React.FC<GameCardProps> = ({ game, showActions = true, onDelete }) => {
  // Use Chakra's modal disclosure for delete confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Format date from timestamp
  const gameDate = new Date(game.date);
  const formattedDate = format(gameDate, 'EEE, MMM d, yyyy');
  const formattedTime = format(gameDate, 'h:mm a');
  
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
  
  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete(game.id);
    }
    onClose();
  };
  
  // Check if the game has a lineup
  const hasLineup = Boolean(game.lineupId);
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      shadow="sm"
      transition="all 0.2s"
    >
      <Box p={4}>
        <Flex justify="space-between" align="flex-start">
          <Box>
            <Heading as="h3" size="sm" mb={1}>
              vs. {game.opponent}
            </Heading>
            <HStack spacing={2} color="gray.500" fontSize="sm">
              <Icon as={CalendarIcon} />
              <Text>{formattedDate} at {formattedTime}</Text>
            </HStack>
            <HStack spacing={2} color="gray.500" fontSize="sm" mt={1}>
              <Icon as={TimeIcon} />
              <Text>{game.location}</Text>
            </HStack>
          </Box>
          <HStack spacing={2}>
            <Badge {...getStatusBadgeProps()}>
              {getStatusText()}
            </Badge>
            
            {game.status === 'scheduled' && (
              <Badge colorScheme={hasLineup ? 'green' : 'gray'}>
                {hasLineup ? 'Lineup Ready' : 'No Lineup'}
              </Badge>
            )}
          </HStack>
        </Flex>
      </Box>
      
      {showActions && (
        <Flex 
          bg="gray.50" 
          p={3} 
          borderTopWidth="1px" 
          borderColor="gray.200"
          justify="space-between"
          align="center"
        >
          <NextLink href={`/games/${game.id}`} passHref>
            <Link color="primary.600" fontWeight="medium" fontSize="sm">
              View Details
            </Link>
          </NextLink>
          
          <HStack spacing={1}>
            {game.status === 'scheduled' && (
              <NextLink href={`/games/${game.id}/lineup/create`} passHref>
                <Button as="a" size="sm" colorScheme="green" variant="ghost" leftIcon={hasLineup ? <EditIcon /> : <AddIcon />}>
                  {hasLineup ? 'Edit Lineup' : 'Create Lineup'}
                </Button>
              </NextLink>
            )}
            
            <NextLink href={`/games/${game.id}/edit`} passHref>
              <IconButton
                as="a"
                aria-label="Edit game"
                icon={<EditIcon />}
                size="sm"
                variant="ghost"
                colorScheme="gray"
              />
            </NextLink>
            
            <IconButton
              aria-label="Delete game"
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={onOpen}
            />
          </HStack>
        </Flex>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this game against {game.opponent}? 
            This action cannot be undone.
            {hasLineup && " This will also delete the associated lineup."}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GameCard;