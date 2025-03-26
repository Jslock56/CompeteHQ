'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@chakra-ui/react';

/**
 * Signup page component
 * 
 * This is a placeholder that will be integrated with MongoDB in the future.
 * For now, it provides a simple UI without actual user creation.
 */
export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Basic validation
  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      // This is a placeholder for actual user creation logic
      // In the future, this would integrate with MongoDB/authentication service
      setTimeout(() => {
        // Simulate successful signup
        toast({
          title: 'Account created successfully',
          description: "You're now signed in",
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Redirect to team creation
        router.push('/teams/new');
      }, 1500);
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
            Create Your Account
          </Heading>
          <Text color="gray.500" textAlign="center" maxW="md">
            Sign up to start managing your baseball teams
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
            <HStack>
              <FormControl id="firstName" isInvalid={!!errors.firstName}>
                <FormLabel>First Name</FormLabel>
                <Input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
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
            
            <Stack spacing={4} pt={2}>
              <Button
                type="submit"
                colorScheme="primary"
                size="lg"
                fontSize="md"
                isLoading={isLoading}
              >
                Sign up
              </Button>
              
              <Text align="center">
                Already have an account?{' '}
                <NextLink href="/login" passHref>
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