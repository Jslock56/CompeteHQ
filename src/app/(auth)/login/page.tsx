'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  FormErrorMessage,
  useToast,
  Container,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/auth-context';

/**
 * Login page component integrated with MongoDB authentication
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { login, isLoading: authLoading, error: authError } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Get the callback URL from search params
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Show auth errors as toast
  useEffect(() => {
    if (authError) {
      toast({
        title: 'Authentication Error',
        description: authError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [authError, toast]);

  // Basic validation
  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
    };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use the login function from auth context
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // The context will handle the redirect based on user state
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="lg" py={{ base: 12, md: 24 }}>
      <Stack spacing={8}>
        <Stack spacing={6} align="center">
          <Heading
            fontWeight={600}
            fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
            lineHeight="shorter"
            textAlign="center"
          >
            Welcome to CompeteHQ
          </Heading>
          <Text color="gray.500" textAlign="center" maxW="md">
            Log in to your account to manage your baseball teams
          </Text>
        </Stack>
        
        <Box
          py={8}
          px={10}
          bg="white"
          boxShadow="lg"
          borderRadius="xl"
        >
          <Stack as="form" spacing={4} onSubmit={handleSubmit}>
            <FormControl id="email" isInvalid={!!errors.email}>
              <FormLabel>Email address</FormLabel>
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            
            <FormControl id="password" isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>
            
            <Stack spacing={4} pt={2}>
              <Button
                type="submit"
                colorScheme="primary"
                size="lg"
                fontSize="md"
                isLoading={isLoading}
              >
                Log in
              </Button>
              
              <Text align="center">
                Don&apos;t have an account?{' '}
                <NextLink href="/signup" passHref>
                  <Link color="primary.500">Sign up</Link>
                </NextLink>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}