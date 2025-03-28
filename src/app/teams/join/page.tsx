'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Stack,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Divider,
  useToast,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { FaLink, FaKey, FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '../../../contexts/auth-context';

export default function JoinTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  
  // Form states
  const [teamCode, setTeamCode] = useState(searchParams.get('code') || '');
  const [teamId, setTeamId] = useState(searchParams.get('team') || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get selected role from session storage
  const [userRole, setUserRole] = useState<string>('fan');

  useEffect(() => {
    // Get the role from session storage if available
    const storedRole = sessionStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  // Redirect if already in a team
  useEffect(() => {
    if (!authLoading && user?.activeTeamId) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Handle join with code
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamCode) {
      setError('Please enter a team code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: teamCode,
          role: userRole // Pass the selected role
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Team joined!',
          description: `You have successfully joined ${data.team?.name || 'the team'}.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update user data
        await refreshUser();
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to join team. Please check the code and try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Join team error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle join with ID
  const handleJoinWithId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamId) {
      setError('Please enter a team ID or link');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Extract ID from link if needed
    let extractedId = teamId;
    if (teamId.includes('/teams/')) {
      const parts = teamId.split('/teams/');
      if (parts.length > 1) {
        extractedId = parts[1].split('/')[0];
      }
    }
    
    try {
      const response = await fetch('/api/teams/join-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          teamId: extractedId,
          role: userRole // Pass the selected role
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Request sent!',
          description: `Your request to join ${data.team?.name || 'the team'} has been sent. The team coach will review it soon.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update user data
        await refreshUser();
        
        // Redirect to teams page
        router.push('/teams');
      } else {
        setError(data.message || 'Failed to send join request. Please check the team ID and try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Join request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={{ base: 12, md: 24 }}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={3} align="center">
          <Heading fontSize="2xl">Join a Team</Heading>
          <Text color="gray.600" textAlign="center">
            Enter a team code or ID to join an existing team
          </Text>
        </VStack>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Card boxShadow="md" borderRadius="lg">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <VStack spacing={2} align="center">
                <Icon as={FaKey} boxSize={10} color="primary.500" />
                <Heading size="md">Join with Team Code</Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Enter a code provided by the team's coach
                </Text>
              </VStack>
              
              <FormControl as="form" onSubmit={handleJoinWithCode}>
                <Input
                  placeholder="Enter team code"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  size="lg"
                  autoFocus
                />
                <Button
                  mt={4}
                  colorScheme="primary"
                  width="full"
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Joining..."
                >
                  Join Team
                </Button>
              </FormControl>
              
              <Divider />
              
              <VStack spacing={2} align="center">
                <Icon as={FaLink} boxSize={8} color="blue.500" />
                <Heading size="md">Join with Team Link</Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Enter a team ID or paste a team link
                </Text>
              </VStack>
              
              <FormControl as="form" onSubmit={handleJoinWithId}>
                <Input
                  placeholder="Paste team link or ID"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  size="lg"
                />
                <Button
                  mt={4}
                  colorScheme="blue"
                  width="full"
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Requesting..."
                >
                  Request to Join
                </Button>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
        
        <Flex justify="center">
          <HStack spacing={1}>
            <Text fontSize="sm" color="gray.600">
              Want to create your own team?
            </Text>
            <NextLink href="/teams/new" passHref>
              <Button variant="link" colorScheme="primary" size="sm">
                Create a Team
              </Button>
            </NextLink>
          </HStack>
        </Flex>
      </VStack>
    </Container>
  );
}