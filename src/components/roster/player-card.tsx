"use client";

import React from 'react';
import Link from 'next/link';
import { Box, Flex, Text, Heading, Badge, Stack, HStack, IconButton } from '@chakra-ui/react';
import { ChevronRightIcon, EditIcon, DeleteIcon, CloseIcon, CheckIcon } from '@chakra-ui/icons';
import { Player, Position } from '../../types/player';

interface PlayerCardProps {
  /**
   * Player data to display
   */
  player: Player;
  
  /**
   * Whether to show additional actions
   */
  showActions?: boolean;
  
  /**
   * Callback when the delete button is clicked
   */
  onDelete?: (playerId: string) => void;
  
  /**
   * Callback when the toggle active button is clicked
   */
  onToggleActive?: (playerId: string) => void;
}

/**
 * Position badge component
 */
const PositionBadge: React.FC<{ position: Position; isPrimary?: boolean }> = ({ position, isPrimary = true }) => {
  return (
    <Flex
      align="center"
      justify="center"
      h="6"
      w="6"
      borderRadius="full"
      fontSize="xs"
      fontWeight="medium"
      color={isPrimary ? "white" : "gray.700"}
      bg={isPrimary ? undefined : "gray.200"}
      className={`position-${position}`} // We're keeping this for position-specific colors
      title={position}
    >
      {position}
    </Flex>
  );
};

/**
 * Card component for displaying player information
 */
export default function PlayerCard({ player, showActions = true, onDelete, onToggleActive }: PlayerCardProps) {
  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm(`Are you sure you want to delete ${player.firstName} ${player.lastName}?`)) {
        onDelete(player.id);
      }
    }
  };
  
  const handleToggleActive = () => {
    if (onToggleActive) {
      onToggleActive(player.id);
    }
  };
  
  return (
    <Box
      bg="white"
      overflow="hidden"
      shadow="md"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      opacity={player.active ? 1 : 0.75}
    >
      <Box px="4" py="5" sx={{ '@media (min-width: 640px)': { p: '6' } }}>
        <Flex align="center">
          {/* Jersey Number */}
          <Flex
            flexShrink={0}
            align="center"
            justify="center"
            h="12"
            w="12"
            borderRadius="full"
            bg="primary.100"
            color="primary.700"
            fontWeight="bold"
            fontSize="xl"
          >
            {player.jerseyNumber}
          </Flex>
          
          {/* Player Info */}
          <Box ml="4" flex="1">
            <Heading as="h3" size="md" color="gray.900">
              {player.firstName} {player.lastName}
            </Heading>
            <Box mt="1">
              {!player.active && (
                <Badge mr="2" px="2.5" py="0.5" borderRadius="full" bg="gray.100" color="gray.800" fontSize="xs">
                  Inactive
                </Badge>
              )}
            </Box>
          </Box>
        </Flex>
        
        {/* Positions */}
        <Box mt="4">
          <Flex align="center">
            <Text as="h4" fontSize="sm" fontWeight="medium" color="gray.500" mr="2">Primary:</Text>
            <HStack spacing="1">
              {player.primaryPositions.map((position) => (
                <PositionBadge 
                  key={`primary-${position}`} 
                  position={position} 
                  isPrimary={true}
                />
              ))}
              {player.primaryPositions.length === 0 && (
                <Text fontSize="sm" color="gray.500">None</Text>
              )}
            </HStack>
          </Flex>
          
          <Flex align="center" mt="1">
            <Text as="h4" fontSize="sm" fontWeight="medium" color="gray.500" mr="2">Secondary:</Text>
            <HStack spacing="1">
              {player.secondaryPositions.map((position) => (
                <PositionBadge 
                  key={`secondary-${position}`} 
                  position={position} 
                  isPrimary={false}
                />
              ))}
              {player.secondaryPositions.length === 0 && (
                <Text fontSize="sm" color="gray.500">None</Text>
              )}
            </HStack>
          </Flex>
        </Box>
        
        {/* Notes (if any) */}
        {player.notes && (
          <Box mt="4" fontSize="sm" color="gray.500">
            <Text noOfLines={1}>{player.notes}</Text>
          </Box>
        )}
      </Box>
      
      {/* Actions */}
      {showActions && (
        <Flex
          bg="gray.50"
          px="4"
          py="4"
          sx={{ '@media (min-width: 640px)': { px: '6' } }}
          justify="space-between"
          align="center"
        >
          <Link href={`/roster/${player.id}`} passHref>
            <Flex
              as="span"
              align="center"
              fontSize="sm"
              fontWeight="medium"
              color="primary.600"
              _hover={{ color: "primary.800" }}
            >
              View Details
              <ChevronRightIcon ml="1" h="5" w="5" />
            </Flex>
          </Link>
          <HStack spacing="2">
            <IconButton
              aria-label={player.active ? "Deactivate" : "Activate"}
              icon={player.active ? <CloseIcon boxSize="4" /> : <CheckIcon boxSize="4" />}
              variant="ghost"
              color={player.active ? "yellow.600" : "green.600"}
              _hover={{ color: player.active ? "yellow.800" : "green.800" }}
              size="sm"
              onClick={handleToggleActive}
            />
            <IconButton
              as={Link}
              href={`/roster/${player.id}/edit`}
              aria-label="Edit"
              icon={<EditIcon boxSize="4" />}
              variant="ghost"
              color="gray.600"
              _hover={{ color: "gray.800" }}
              size="sm"
            />
            <IconButton
              aria-label="Delete"
              icon={<DeleteIcon boxSize="4" />}
              variant="ghost"
              color="red.600"
              _hover={{ color: "red.800" }}
              size="sm"
              onClick={handleDelete}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
}