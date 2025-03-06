"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useTeamContext } from '../../contexts/team-context';
import { PageContainer } from '../../components/layout/page-container';
import { Card } from '../../components/common/card';

/**
 * Teams listing page
 * Shows all teams and allows creating, selecting, editing, and deleting teams
 */
export default function TeamsPage() {
  const router = useRouter();
  const { teams, currentTeam, setCurrentTeam, deleteTeam, isLoading, error } = useTeamContext();
  
  // State for delete confirmation
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Handle team selection
  const handleSelectTeam = (teamId: string) => {
    setCurrentTeam(teamId);
    router.push('/dashboard');
  };
  
  // Handle team deletion
  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
    onOpen();
  };
  
  // Confirm team deletion
  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete);
      onClose();
      setTeamToDelete(null);
    }
  };
  
  // Colors
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const activeBorderColor = useColorModeValue('primary.500', 'primary.300');
  
  return (
    <PageContainer
      title="Teams"
      action={
        <NextLink href="/teams/new" passHref>
          <Button 
            as="a" 
            leftIcon={<AddIcon />} 
            colorScheme="primary"
          >
            Create Team
          </Button>
        </NextLink>
      }
    >
      {error && (
        <Box mb={6} p={4} borderRadius="md" bg="red.50" color="red.700">
          <Flex align="center">
            <Box mr={3} color="red.400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </Box>
            <Text fontSize="sm">{error}</Text>
          </Flex>
        </Box>
      )}
      
      {isLoading ? (
        <Flex justify="center" align="center" minH="60vh" direction="column">
          <Box
            h="12" 
            w="12" 
            borderWidth="2px" 
            borderColor="primary.500" 
            borderBottomColor="transparent" 
            borderRadius="full" 
            style={{ animation: "spin 1s linear infinite" }}
            animation="spin 1s linear infinite"
          />
          <Text mt={4} color="gray.500">Loading teams...</Text>
        </Flex>
      ) : teams.length === 0 ? (
        <Card py={12} textAlign="center">
          <Box
            display="inline-flex"
            mx="auto"
            h="12"
            w="12"
            borderRadius="full"
            bg="gray.100"
            color="gray.400"
            alignItems="center"
            justifyContent="center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </Box>
          <Heading mt={2} size="sm" fontWeight="medium" color="gray.900">
            No teams
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Get started by creating a new team.
          </Text>
          <Box mt={6}>
            <NextLink href="/teams/new" passHref>
              <Button
                as="a"
                leftIcon={<AddIcon />}
                colorScheme="primary"
              >
                Create Team
              </Button>
            </NextLink>
          </Box>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
          {teams.map((team) => (
            <Card 
              key={team.id} 
              p={0} 
              borderColor={currentTeam?.id === team.id ? activeBorderColor : cardBorderColor}
              borderWidth="1px"
              boxShadow={currentTeam?.id === team.id ? 'md' : 'sm'}
            >
              <Box p={4}>
                <Box>
                  <Heading size="md" isTruncated mb={1}>
                    {team.name}
                  </Heading>
                  <Flex align="center" fontSize="sm" color="gray.500" mt={1} flexWrap="wrap">
                    <Text>{team.ageGroup}</Text>
                    <Box mx={2} h="1" w="1" borderRadius="full" bg="gray.400" />
                    <Text>{team.season}</Text>
                  </Flex>
                </Box>
                {currentTeam?.id === team.id && (
                  <Badge mt={2} colorScheme="green" fontSize="xs">
                    Active
                  </Badge>
                )}
              </Box>
              
              <Flex 
                bg="gray.50" 
                p={4} 
                borderTopWidth="1px" 
                borderColor="gray.200"
                justify="space-between" 
                align="center"
              >
                <Button
                  onClick={() => handleSelectTeam(team.id)}
                  variant="link"
                  size="sm"
                  colorScheme="primary"
                  rightIcon={<ChevronRightIcon />}
                >
                  {currentTeam?.id === team.id ? 'View Team' : 'Select Team'}
                </Button>
                
                <HStack spacing={2}>
                  <NextLink href={`/teams/${team.id}/edit`} passHref>
                    <IconButton
                      as="a"
                      aria-label="Edit team"
                      icon={<EditIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                    />
                  </NextLink>
                  
                  <IconButton
                    aria-label="Delete team"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteTeam(team.id)}
                  />
                </HStack>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Team
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this team? This action cannot be undone.
              All data associated with this team will be permanently removed.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteTeam} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageContainer>
  );
}