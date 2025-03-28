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
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/auth-context';

/**
 * Signup page component integrated with MongoDB authentication
 */
export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { register, isLoading: authLoading, error: authError } = useAuth();
  
  // Get the invitation token if it exists
  const invitationToken = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Show auth errors as toast
  useEffect(() => {
    if (authError) {
      toast({
        title: 'Registration Error',
        description: authError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [authError, toast]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update full name when first or last name changes
    if (name === 'firstName' || name === 'lastName') {
      const firstName = name === 'firstName' ? value : formData.firstName;
      const lastName = name === 'lastName' ? value : formData.lastName;
      
      setFormData({
        ...formData,
        [name]: value,
        name: `${firstName} ${lastName}`.trim()
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Basic validation
  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // Use the auth context register function
      const success = await register(
        formData.name, 
        formData.email, 
        formData.password,
        invitationToken || undefined
      );
      
      if (success) {
        toast({
          title: 'Account created successfully',
          description: "You're now signed in",
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // The auth context will handle redirects based on invitation status
      }
    } catch (error) {
      toast({
        title: 'Sign up failed',
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
            {invitationToken ? 'Accept Team Invitation' : 'Create Your Account'}
          </Heading>
          <Text color="gray.500" textAlign="center" maxW="md">
            {invitationToken 
              ? 'Complete your registration to join the team' 
              : 'Sign up to start managing your baseball teams'}
          </Text>
        </Stack>
        
        {/* Show invitation banner if token present */}
        {invitationToken && (
          <Alert
            status="info"
            variant="solid"
            borderRadius="md"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={4}
          >
            <AlertIcon boxSize="40px" mr={0} mb={2} />
            <AlertTitle mt={2} mb={2} fontSize="lg">
              You've Been Invited!
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              You're signing up with a team invitation. Once you complete registration, 
              you'll be able to access the team immediately.
            </AlertDescription>
          </Alert>
        )}
        
        <Box
          py={8}
          px={10}
          bg="white"
          boxShadow="lg"
          borderRadius="xl"
        >
          <Stack as="form" spacing={4} onSubmit={handleSubmit}>
            <HStack>
              <FormControl id="firstName" isInvalid={!!errors.firstName}>
                <FormLabel>First Name</FormLabel>
                <Input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoFocus
                />
                <FormErrorMessage>{errors.firstName}</FormErrorMessage>
              </FormControl>
              
              <FormControl id="lastName" isInvalid={!!errors.lastName}>
                <FormLabel>Last Name</FormLabel>
                <Input 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.lastName}</FormErrorMessage>
              </FormControl>
            </HStack>
            
            <FormControl id="email" isInvalid={!!errors.email}>
              <FormLabel>Email address</FormLabel>
              <Input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            
            <FormControl id="password" isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <Input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Must be at least 8 characters
              </Text>
            </FormControl>
            
            <FormControl id="confirmPassword" isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <Input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>
            
            <Stack spacing={4} pt={4}>
              <Button
                type="submit"
                colorScheme="primary"
                size="lg"
                fontSize="md"
                isLoading={isLoading || authLoading}
              >
                {invitationToken ? 'Sign up & Join Team' : 'Sign up'}
              </Button>
              
              <Text align="center">
                Already have an account?{' '}
                <NextLink href={invitationToken ? `/login?token=${invitationToken}` : "/login"} passHref>
                  <Link color="primary.500">Log in</Link>
                </NextLink>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}