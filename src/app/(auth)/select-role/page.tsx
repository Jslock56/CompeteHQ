'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Stack,
  Icon,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FaBaseballBall, FaUserTie, FaUserCog, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../../contexts/auth-context';

// Role selection page that appears after a user creates an account
export default function SelectRolePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to dashboard if already in a team
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.activeTeamId) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Handle role selection
  const handleRoleSelect = async (role: string) => {
    setSelectedRole(role);
    setIsSubmitting(true);

    try {
      // Store the role selection in session storage temporarily
      sessionStorage.setItem('userRole', role);

      // Redirect to the appropriate page based on the role
      if (role === 'headCoach') {
        router.push('/teams/new');
      } else {
        router.push('/teams/join');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process your selection.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  // If still loading, show loading state
  if (authLoading) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Icon as={FaBaseballBall} boxSize={12} color="primary.500" />
          <Text>Loading...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="lg" py={{ base: 12, md: 24 }}>
      <VStack spacing={8} align="center">
        <Heading
          fontWeight={600}
          fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
          lineHeight="shorter"
          textAlign="center"
        >
          Welcome to CompeteHQ
        </Heading>
        <Text color="gray.600" textAlign="center" maxW="md">
          Tell us your role to get started
        </Text>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
          {/* Head Coach Card */}
          <Card
            borderWidth="1px"
            borderRadius="lg"
            cursor="pointer"
            boxShadow={selectedRole === 'headCoach' ? 'outline' : 'md'}
            borderColor={selectedRole === 'headCoach' ? 'primary.500' : 'transparent'}
            onClick={() => setSelectedRole('headCoach')}
            bg={selectedRole === 'headCoach' ? 'primary.50' : 'white'}
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
          >
            <CardHeader pb={0}>
              <Flex justify="center">
                <Icon as={FaUserTie} boxSize={10} color="primary.500" />
              </Flex>
              <Heading size="md" textAlign="center" mt={2}>
                Head Coach
              </Heading>
            </CardHeader>
            <CardBody>
              <Text textAlign="center" fontSize="sm" color="gray.600">
                Create and manage teams, set lineups, approve members
              </Text>
            </CardBody>
          </Card>

          {/* Assistant Coach Card */}
          <Card
            borderWidth="1px"
            borderRadius="lg"
            cursor="pointer"
            boxShadow={selectedRole === 'assistant' ? 'outline' : 'md'}
            borderColor={selectedRole === 'assistant' ? 'primary.500' : 'transparent'}
            onClick={() => setSelectedRole('assistant')}
            bg={selectedRole === 'assistant' ? 'primary.50' : 'white'}
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
          >
            <CardHeader pb={0}>
              <Flex justify="center">
                <Icon as={FaUserCog} boxSize={10} color="orange.500" />
              </Flex>
              <Heading size="md" textAlign="center" mt={2}>
                Assistant Coach
              </Heading>
            </CardHeader>
            <CardBody>
              <Text textAlign="center" fontSize="sm" color="gray.600">
                Help manage lineups, practices, and games
              </Text>
            </CardBody>
          </Card>

          {/* Parent/Fan Card */}
          <Card
            borderWidth="1px"
            borderRadius="lg"
            cursor="pointer"
            boxShadow={selectedRole === 'fan' ? 'outline' : 'md'}
            borderColor={selectedRole === 'fan' ? 'primary.500' : 'transparent'}
            onClick={() => setSelectedRole('fan')}
            bg={selectedRole === 'fan' ? 'primary.50' : 'white'}
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
          >
            <CardHeader pb={0}>
              <Flex justify="center">
                <Icon as={FaUsers} boxSize={10} color="blue.500" />
              </Flex>
              <Heading size="md" textAlign="center" mt={2}>
                Parent/Fan
              </Heading>
            </CardHeader>
            <CardBody>
              <Text textAlign="center" fontSize="sm" color="gray.600">
                View schedules, lineups, and track player participation
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Box pt={6} w="full">
          <Button
            colorScheme="primary"
            size="lg"
            width="full"
            isDisabled={!selectedRole}
            onClick={() => selectedRole && handleRoleSelect(selectedRole)}
            isLoading={isSubmitting}
            loadingText="Processing..."
          >
            Continue
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}