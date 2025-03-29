import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  IconButton,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  useToast
} from '@chakra-ui/react';
import { AddIcon, StarIcon, EditIcon, DeleteIcon, CheckIcon } from '@chakra-ui/icons';
import { Lineup } from '../../types/lineup';
import { useTeamContext } from '../../contexts/team-context';

interface LineupDashboardProps {
  /**
   * Available lineups
   */
  lineups: Lineup[];
  
  /**
   * Whether lineups are loading
   */
  isLoading: boolean;
  
  /**
   * Error message, if any
   */
  error: string | null;
  
  /**
   * Called when a lineup is deleted
   */
  onDeleteLineup: (lineupId: string) => Promise<boolean>;
  
  /**
   * Called when a lineup is set as default
   */
  onSetDefault: (lineupId: string) => Promise<boolean>;
}

/**
 * Dashboard for managing field-position lineups
 */
const LineupDashboard: React.FC<LineupDashboardProps> = ({
  lineups,
  isLoading,
  error,
  onDeleteLineup,
  onSetDefault
}) => {
  // Call hooks in the same order every time
  const toast = useToast();
  const { currentTeam } = useTeamContext();
  
  // Call all color mode hooks at the top level consistently
  const colors = {
    cardBg: useColorModeValue('white', 'gray.700'),
    headerBg: useColorModeValue('gray.50', 'gray.800'),
    textColor: useColorModeValue('gray.600', 'gray.400'),
    defaultBg: useColorModeValue('yellow.50', 'yellow.900'),
    defaultBorderColor: useColorModeValue('yellow.300', 'yellow.600'),
    borderColor: useColorModeValue('gray.200', 'gray.700')
  };
  
  // Handle delete lineup
  const handleDelete = async (lineupId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the lineup "${name}"?`)) {
      const success = await onDeleteLineup(lineupId);
      
      if (success) {
        toast({
          title: "Lineup deleted",
          description: `"${name}" has been deleted successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete lineup. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };
  
  // Handle set as default
  const handleSetDefault = async (lineupId: string, name: string) => {
    const success = await onSetDefault(lineupId);
    
    if (success) {
      toast({
        title: "Default lineup set",
        description: `"${name}" is now the default lineup.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to set default lineup. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px" direction="column">
        <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
        <Text mt={4} color="gray.600">Loading lineups...</Text>
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md" mb={6}>
        <AlertIcon />
        <AlertTitle>Error loading lineups</AlertTitle>
        <Text>{error}</Text>
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Header with Create Button */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6}
      >
        <Heading size="lg">Field Position Lineups</Heading>
        
        <NextLink href="/lineup/new/field-position" passHref>
          <Button 
            as="a" 
            leftIcon={<AddIcon />} 
            colorScheme="primary"
            size="md"
          >
            Create New Lineup
          </Button>
        </NextLink>
      </Flex>
      
      {/* Lineup List */}
      {lineups.length === 0 ? (
        <Box 
          p={8} 
          bg={colors.cardBg} 
          borderRadius="lg" 
          shadow="sm" 
          textAlign="center"
          borderWidth="1px"
          borderColor={colors.textColor}
        >
          <Text mb={6} color="gray.600">
            You haven't created any field position lineups yet. Create your first lineup to get started.
          </Text>
          
          <NextLink href="/lineup/new/field-position" passHref>
            <Button 
              as="a" 
              leftIcon={<AddIcon />} 
              colorScheme="primary"
              size="md"
            >
              Create New Lineup
            </Button>
          </NextLink>
        </Box>
      ) : (
        <Stack spacing={4}>
          {lineups.map((lineup) => (
            <Flex
              key={lineup.id}
              direction={{ base: 'column', md: 'row' }}
              bg={colors.cardBg}
              borderRadius="lg"
              overflow="hidden"
              borderWidth="1px"
              borderColor={colors.textColor}
              shadow="sm"
            >
              {/* Lineup Info */}
              <Box 
                p={4} 
                flex="1"
                bg={lineup.isDefault ? colors.defaultBg : undefined}
              >
                <Flex align="center" mb={2}>
                  <Heading size="md" mr={2}>
                    {lineup.name || "Unnamed Lineup"}
                  </Heading>
                  
                  {lineup.isDefault && (
                    <Badge colorScheme="yellow" display="flex" alignItems="center">
                      <StarIcon mr={1} /> Default
                    </Badge>
                  )}
                  
                  <Badge 
                    ml={2} 
                    colorScheme={
                      lineup.type === 'competitive' ? 'blue' : 
                      lineup.type === 'developmental' ? 'green' : 
                      'gray'
                    }
                  >
                    {lineup.type === 'competitive' ? 'Competitive' : 
                     lineup.type === 'developmental' ? 'Developmental' : 
                     'Standard'}
                  </Badge>
                </Flex>
                
                <Text color="gray.600" fontSize="sm">
                  Last updated: {new Date(lineup.updatedAt).toLocaleString()}
                </Text>
              </Box>
              
              {/* Actions */}
              <Flex 
                p={3} 
                bg={headerBg} 
                align={{ base: 'stretch', md: 'center' }} 
                gap={2}
                direction={{ base: 'row', md: 'row' }}
                justify={{ base: 'flex-end', md: 'center' }}
              >
                {!lineup.isDefault && (
                  <IconButton
                    aria-label="Set as default"
                    icon={<StarIcon />}
                    colorScheme="yellow"
                    onClick={() => handleSetDefault(lineup.id, lineup.name || 'Unnamed Lineup')}
                    title="Set as default lineup"
                  />
                )}
                
                <NextLink href={`/lineup/${lineup.id}/edit`} passHref>
                  <IconButton
                    as="a"
                    aria-label="Edit lineup"
                    icon={<EditIcon />}
                    colorScheme="primary"
                    title="Edit lineup"
                  />
                </NextLink>
                
                <IconButton
                  aria-label="Delete lineup"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleDelete(lineup.id, lineup.name || 'Unnamed Lineup')}
                  title="Delete lineup"
                  isDisabled={lineup.isDefault}
                />
              </Flex>
            </Flex>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default LineupDashboard;