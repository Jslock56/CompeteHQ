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
  Button,
  Tooltip,
  Spacer,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
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
      width="100%"
    >
      <Flex 
        p={4} 
        direction={{ base: "column", md: "row" }} 
        align={{ base: "flex-start", md: "center" }}
        gap={4}
      >
        {/* First section: Jersey number and name */}
        <Flex align="center" minWidth="180px">
          <Flex
            justify="center"
            align="center"
            bg="primary.100"
            color="primary.700"
            fontSize="xl"
            fontWeight="bold"
            w="10"
            h="10"
            borderRadius="full"
            flexShrink={0}
          >
            {player.jerseyNumber}
          </Flex>
          <Box ml={3}>
            <Flex align="center">
              <Text fontWeight="bold" fontSize="md">
                {player.firstName} {player.lastName}
              </Text>
              {!player.active && (
                <Badge ml={2} colorScheme="gray" variant="subtle">
                  Inactive
                </Badge>
              )}
            </Flex>
          </Box>
        </Flex>
        
        {/* Middle section: Positions */}
        <Flex 
          flex="1" 
          align={{ base: "flex-start", md: "center" }}
          wrap="wrap"
          gap={3}
        >
          {/* Primary Positions */}
          <Flex align="center">
            <Text fontSize="sm" color="gray.600" mr={2} whiteSpace="nowrap">Primary:</Text>
            <Wrap spacing={1}>
              {player.primaryPositions.map(position => (
                <WrapItem key={`primary-${position}`}>
                  <PositionBadge position={position} isPrimary={true} />
                </WrapItem>
              ))}
              {player.primaryPositions.length === 0 && (
                <Text fontSize="sm" color="gray.500">None</Text>
              )}
            </Wrap>
          </Flex>
          
          {/* Secondary Positions */}
          <Flex align="center">
            <Text fontSize="sm" color="gray.600" mr={2} whiteSpace="nowrap">Secondary:</Text>
            <Wrap spacing={1}>
              {player.secondaryPositions.map(position => (
                <WrapItem key={`secondary-${position}`}>
                  <PositionBadge position={position} isPrimary={false} />
                </WrapItem>
              ))}
              {player.secondaryPositions.length === 0 && (
                <Text fontSize="sm" color="gray.500">None</Text>
              )}
            </Wrap>
          </Flex>
        </Flex>
        
        <Spacer />
        
        {/* Actions */}
        <HStack spacing={1}>
          {/* Info tooltip */}
          {player.notes && (
            <Tooltip label={player.notes} placement="top" hasArrow gutter={10} maxW="300px">
              <IconButton
                aria-label="Player information"
                icon={<InfoIcon />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
              />
            </Tooltip>
          )}
          
          <NextLink href={`/roster/${player.id}`} passHref>
            <Button as="a" variant="link" size="sm" colorScheme="primary">
              Details
            </Button>
          </NextLink>
          
          <IconButton
            aria-label={player.active ? "Mark as inactive" : "Mark as active"}
            icon={<CheckIcon />}
            size="sm"
            variant="ghost"
            colorScheme={player.active ? "green" : "green"}
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