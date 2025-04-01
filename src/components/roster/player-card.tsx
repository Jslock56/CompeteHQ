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
  Wrap,
  WrapItem,
  useColorModeValue
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
  
  // Theme colors
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBgColor = useColorModeValue("white", "gray.800");
  const subtitleColor = useColorModeValue("gray.600", "gray.400");
  const jerseyBgColor = useColorModeValue("blue.50", "blue.900");
  const jerseyTextColor = useColorModeValue("#10417A", "blue.200");

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
      bg="white"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="8px"
      overflow="hidden"
      boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      opacity={player.active ? 1 : 0.8}
      transition="all 0.2s ease-in-out"
      _hover={{
        boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
      }}
      width="100%"
    >
      {/* Card Header with Jersey Number and Name */}
      <Flex
        px={{ base: 4, md: 5 }}
        py={3}
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor={borderColor}
        bg={headerBgColor}
      >
        <Flex align="center">
          <Flex
            justify="center"
            align="center"
            bg={jerseyBgColor}
            color={jerseyTextColor}
            fontSize="lg"
            fontWeight="bold"
            w="10"
            h="10"
            borderRadius="full"
            flexShrink={0}
          >
            {player.jerseyNumber}
          </Flex>
          <Box ml={3}>
            <NextLink href={`/roster/${player.id}`} passHref>
              <Text 
                fontWeight="600" 
                fontSize="md" 
                color="#10417A" 
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                as="a"
              >
                {player.firstName} {player.lastName}
              </Text>
            </NextLink>
            {!player.active && (
              <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                Inactive
              </Badge>
            )}
          </Box>
        </Flex>
        
        {/* Actions in header */}
        <HStack spacing={1} ml="auto">
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
      
      {/* Card Body with Positions */}
      <Box px={{ base: 4, md: 5 }} py={4} position="relative">
        {/* Positions Section */}
        <Flex 
          direction={{ base: "column", sm: "row" }} 
          gap={4}
          mb={2}
        >
          {/* Primary Positions */}
          <Flex align="flex-start" direction="column" minWidth="160px">
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Primary Positions
            </Text>
            <Wrap spacing={2}>
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
          <Flex align="flex-start" direction="column">
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Secondary Positions
            </Text>
            <Wrap spacing={2}>
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
      </Box>
      
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