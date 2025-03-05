// src/components/roster/player-card.tsx
import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Badge, 
  HStack, 
  IconButton, 
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { Player } from '../../types/player';
import { PositionBadge } from '../common/position-badge';

interface PlayerCardProps {
  player: Player;
  onDelete?: (playerId: string) => void;
  onToggleActive?: (playerId: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onDelete, 
  onToggleActive 
}) => {
  // Use Chakra's modal disclosure for delete confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDelete = () => {
    if (onDelete) {
      onDelete(player.id);
    }
    onClose();
  };

  const handleToggleActive = () => {
    if (onToggleActive) {
      onToggleActive(player.id);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      boxShadow="sm"
      opacity={player.active ? 1 : 0.75}
      transition="all 0.2s"
    >
      <Box p={4}>
        <Flex align="center">
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
            <Flex align="center">
              <Text fontWeight="bold" fontSize="lg">
                {player.firstName} {player.lastName}
              </Text>
              {!player.active && (
                <Badge ml={2} colorScheme="gray" variant="subtle">
                  Inactive
                </Badge>
              )}
            </Flex>
            
            {/* Primary Positions */}
            <Box mt={2}>
              <Text fontSize="sm" color="gray.600" mb={1}>Primary:</Text>
              <HStack spacing={1}>
                {player.primaryPositions.map(position => (
                  <PositionBadge key={`primary-${position}`} position={position} isPrimary={true} />
                ))}
                {player.primaryPositions.length === 0 && (
                  <Text fontSize="sm" color="gray.500">None</Text>
                )}
              </HStack>
            </Box>
            
            {/* Secondary Positions */}
            <Box mt={1}>
              <Text fontSize="sm" color="gray.600" mb={1}>Secondary:</Text>
              <HStack spacing={1}>
                {player.secondaryPositions.map(position => (
                  <PositionBadge key={`secondary-${position}`} position={position} isPrimary={false} />
                ))}
                {player.secondaryPositions.length === 0 && (
                  <Text fontSize="sm" color="gray.500">None</Text>
                )}
              </HStack>
            </Box>
          </Box>
        </Flex>
        
        {/* Notes */}
        {player.notes && (
          <Text mt={3} fontSize="sm" color="gray.600" noOfLines={1}>
            {player.notes}
          </Text>
        )}
      </Box>
      
      {/* Actions */}
      <Flex 
        bg="gray.50" 
        p={3} 
        borderTopWidth="1px" 
        borderColor="gray.200"
        justify="space-between"
      >
        <NextLink href={`/roster/${player.id}`} passHref>
          <Button as="a" variant="link" size="sm" colorScheme="primary">
            View Details
          </Button>
        </NextLink>
        
        <HStack spacing={1}>
          <IconButton
            aria-label={player.active ? "Mark as inactive" : "Mark as active"}
            icon={player.active ? <CloseIcon /> : <CheckIcon />}
            size="sm"
            variant="ghost"
            colorScheme={player.active ? "orange" : "green"}
            onClick={handleToggleActive}
          />
          
          <NextLink href={`/roster/${player.id}/edit`} passHref>
            <IconButton
              as="a"
              aria-label="Edit player"
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              colorScheme="gray"
            />
          </NextLink>
          
          <IconButton
            aria-label="Delete player"
            icon={<DeleteIcon />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onOpen}
          />
        </HStack>
      </Flex>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete {player.firstName} {player.lastName}? 
            This action cannot be undone.
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

export default PlayerCard;