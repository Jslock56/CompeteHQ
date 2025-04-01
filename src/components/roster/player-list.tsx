import React, { useState, useMemo } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Flex,
  IconButton,
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Button,
  HStack,
  Badge,
  Wrap,
  WrapItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
  Collapse
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ChevronDownIcon, ChevronUpIcon, EditIcon, DeleteIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { Player, Position } from '../../types/player';
import { PositionBadge } from '../common/position-badge';

interface PlayerListProps {
  /**
   * Players to display in the list
   */
  players: Player[];
  
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Error message to display (if any)
   */
  error?: string | null;
  
  /**
   * Called when a player is deleted
   */
  onDeletePlayer?: (playerId: string) => void;
  
  /**
   * Called when a player's active status is toggled
   */
  onToggleActive?: (playerId: string) => void;
  
  /**
   * Whether to show inactive players (defaults to false)
   */
  showInactive?: boolean;
  
  /**
   * Filter by position (optional)
   */
  positionFilter?: Position | null;
  
  /**
   * Team ID (for creating new players)
   */
  teamId?: string;

  /**
   * Search query to filter players
   */
  searchQuery?: string;
}

/**
 * Component for displaying a list of players in a table format
 */
export default function PlayerList({
  players,
  isLoading = false,
  error = null,
  onDeletePlayer,
  onToggleActive,
  showInactive = false,
  positionFilter = null,
  teamId,
  searchQuery = ''
}: PlayerListProps) {
  // State for search query (if not provided as prop)
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // State to track expanded rows
  const [expandedPlayers, setExpandedPlayers] = useState<string[]>([]);
  
  // Use prop searchQuery if provided, otherwise use local state
  const effectiveSearchQuery = searchQuery || localSearchQuery;
  
  // Filter players based on active status, position filter, and search query
  const filteredPlayers = useMemo(() => {
    // Apply active filter
    let result = showInactive ? players : players.filter(player => player.active);
    
    // Apply position filter if specified
    if (positionFilter) {
      result = result.filter(player => 
        player.primaryPositions.includes(positionFilter) || 
        player.secondaryPositions.includes(positionFilter)
      );
    }
    
    // Apply search filter
    if (effectiveSearchQuery.trim()) {
      const query = effectiveSearchQuery.toLowerCase();
      result = result.filter(player => 
        player.firstName.toLowerCase().includes(query) || 
        player.lastName.toLowerCase().includes(query) ||
        player.jerseyNumber.toString().includes(query)
      );
    }
    
    // Sort by jersey number
    return result.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }, [players, showInactive, positionFilter, effectiveSearchQuery]);
  
  // Handle search input when using local state
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };
  
  // Toggle expanded state for a player
  const toggleExpanded = (playerId: string) => {
    setExpandedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId) 
        : [...prev, playerId]
    );
  };
  
  // Background color for empty state
  const emptyStateBg = useColorModeValue('gray.50', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('blue.50', 'blue.900');
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading players...</Text>
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  // Render search input if searchQuery prop is not provided
  const renderSearchInput = () => {
    if (searchQuery !== undefined) return null;
    
    return (
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Search players by name or jersey number..." 
            value={localSearchQuery}
            onChange={handleSearchChange}
          />
        </InputGroup>
      </Box>
    );
  };

  // Delete confirmation modal
  const DeleteConfirmationModal = ({ player, isOpen, onClose }: { 
    player: Player; 
    isOpen: boolean; 
    onClose: () => void; 
  }) => {
    const handleDelete = () => {
      if (onDeletePlayer) {
        onDeletePlayer(player.id);
      }
      onClose();
    };

    return (
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
    );
  };
  
  return (
    <Box>
      {renderSearchInput()}
      
      {filteredPlayers.length === 0 ? (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          py={12} 
          bg={emptyStateBg} 
          borderRadius="md"
          textAlign="center"
        >
          <Icon 
            viewBox="0 0 24 24" 
            boxSize={12} 
            color="gray.400" 
            mb={4}
          >
            <path
              fill="currentColor"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </Icon>
          <Text fontSize="lg" fontWeight="medium" color="gray.700" mb={1}>
            No players found
          </Text>
          <Text color="gray.500" fontSize="sm" maxW="md" mb={players.length === 0 ? 6 : 0}>
            {players.length === 0
              ? 'Get started by creating a new player.'
              : 'Try adjusting your search or filters.'}
          </Text>
          
          {players.length === 0 && (
            <NextLink href={teamId ? `/roster/new?teamId=${teamId}` : '/roster/new'} passHref>
              <Button
                as="a"
                colorScheme="primary"
                leftIcon={<AddIcon />}
              >
                Add Player
              </Button>
            </NextLink>
          )}
        </Flex>
      ) : (
        <Box borderWidth="1px" borderRadius="lg" borderColor={borderColor} overflow="hidden">
          <Table variant="simple" size="md">
            <Thead bg={headerBg}>
              <Tr>
                <Th width="80px" textAlign="center">Jersey</Th>
                <Th>Name</Th>
                <Th width="50%" display={{ base: 'none', md: 'table-cell' }}>Positions</Th>
                <Th width="150px" textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredPlayers.map((player) => {
                const isExpanded = expandedPlayers.includes(player.id);
                const { isOpen, onOpen, onClose } = useDisclosure();
                
                return (
                  <React.Fragment key={player.id}>
                    <Tr 
                      cursor="pointer" 
                      _hover={{ bg: hoverBg }}
                      opacity={player.active ? 1 : 0.7}
                    >
                      {/* Jersey number */}
                      <Td textAlign="center">
                        <Flex 
                          justify="center" 
                          align="center" 
                          bg="blue.50" 
                          color="#10417A" 
                          fontSize="md" 
                          fontWeight="bold" 
                          w="10" 
                          h="10" 
                          borderRadius="full"
                          mx="auto"
                        >
                          {player.jerseyNumber}
                        </Flex>
                      </Td>
                      
                      {/* Player name */}
                      <Td>
                        <Flex direction="column">
                          <NextLink href={`/roster/${player.id}`} passHref>
                            <Text 
                              fontWeight="600" 
                              fontSize="md" 
                              color="#10417A"
                              as="a"
                              _hover={{ textDecoration: 'underline' }}
                            >
                              {player.firstName} {player.lastName}
                            </Text>
                          </NextLink>
                          {!player.active && (
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs" mt={1} width="fit-content">
                              Inactive
                            </Badge>
                          )}
                        </Flex>
                      </Td>
                      
                      {/* Positions - visible on larger screens */}
                      <Td display={{ base: 'none', md: 'table-cell' }}>
                        <Flex gap={2} wrap="wrap">
                          {player.primaryPositions.map(pos => (
                            <PositionBadge key={`primary-${pos}`} position={pos} isPrimary={true} />
                          ))}
                          {player.secondaryPositions.map(pos => (
                            <PositionBadge key={`secondary-${pos}`} position={pos} isPrimary={false} />
                          ))}
                        </Flex>
                      </Td>
                      
                      {/* Actions */}
                      <Td textAlign="right">
                        <HStack spacing={1} justifyContent="flex-end">
                          {/* Toggle expand row button */}
                          <IconButton
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                            icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            display={{ base: 'inline-flex', md: 'none' }}
                            onClick={() => toggleExpanded(player.id)}
                          />
                          
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
                          
                          {/* Toggle active */}
                          <IconButton
                            aria-label={player.active ? "Mark as inactive" : "Mark as active"}
                            icon={<CheckIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme={player.active ? "green" : "green"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleActive) onToggleActive(player.id);
                            }}
                          />
                          
                          {/* Edit */}
                          <NextLink href={`/roster/${player.id}/edit`} passHref>
                            <IconButton
                              as="a"
                              aria-label="Edit player"
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="gray"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </NextLink>
                          
                          {/* Delete */}
                          <IconButton
                            aria-label="Delete player"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpen();
                            }}
                          />
                        </HStack>
                        
                        <DeleteConfirmationModal 
                          player={player} 
                          isOpen={isOpen} 
                          onClose={onClose} 
                        />
                      </Td>
                    </Tr>
                    
                    {/* Expandable row - only shown on mobile */}
                    <Tr display={{ base: isExpanded ? 'table-row' : 'none', md: 'none' }}>
                      <Td colSpan={4} pb={4} pt={0}>
                        <Box pl={4} pr={4}>
                          <Flex direction="column" gap={3}>
                            {/* Primary Positions */}
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
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
                            </Box>
                            
                            {/* Secondary Positions */}
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
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
                            </Box>
                          </Flex>
                        </Box>
                      </Td>
                    </Tr>
                  </React.Fragment>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}