// src/app/page.tsx (Landing Page)
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Flex,
  Stack,
  HStack,
  VStack,
  Image,
  SimpleGrid,
  Icon,
  Divider,
  Card,
  CardBody,
  useColorModeValue
} from '@chakra-ui/react';
import { FaBaseballBall, FaChartLine, FaCalendarAlt, FaUsers, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../contexts/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const accentColor = useColorModeValue('primary.500', 'primary.300');

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // If still loading auth state, show minimal loading indicator
  if (isLoading) {
    return (
      <Flex align="center" justify="center" minH="100vh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </Flex>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Simple Navbar */}
      <Box as="nav" bg="white" py={4} boxShadow="sm" position="sticky" top={0} zIndex={10}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="lg" color="primary.600">
              CompeteHQ
            </Heading>
            <HStack spacing={4}>
              <NextLink href="/login" passHref>
                <Button as="a" variant="ghost" colorScheme="primary">
                  Log In
                </Button>
              </NextLink>
              <NextLink href="/signup" passHref>
                <Button as="a" colorScheme="primary">
                  Sign Up Free
                </Button>
              </NextLink>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box as="section" py={20} bg="primary.600" color="white">
        <Container maxW="container.xl">
          <Flex 
            direction={{ base: "column", lg: "row" }} 
            align="center" 
            justify="space-between"
            gap={8}
          >
            <Box maxW={{ base: "100%", lg: "50%" }}>
              <Heading 
                as="h1" 
                size="3xl" 
                mb={6}
                lineHeight="1.2"
              >
                The Ultimate Baseball Team Management Platform
              </Heading>
              <Text fontSize="xl" mb={8} opacity={0.9}>
                CompeteHQ helps coaches organize rosters, create balanced lineups, 
                track playing time, and ensure every player gets a fair opportunity.
              </Text>
              <HStack spacing={4}>
                <NextLink href="/signup" passHref>
                  <Button 
                    as="a" 
                    size="lg" 
                    colorScheme="white" 
                    variant="solid"
                    bg="white"
                    color="primary.600"
                    _hover={{ bg: "gray.100" }}
                    px={8}
                  >
                    Get Started Free
                  </Button>
                </NextLink>
                <NextLink href="#features" passHref>
                  <Button
                    as="a"
                    size="lg"
                    variant="outline"
                    colorScheme="white"
                    px={8}
                  >
                    Learn More
                  </Button>
                </NextLink>
              </HStack>
            </Box>
            <Box 
              maxW={{ base: "100%", lg: "45%" }} 
              borderRadius="xl" 
              overflow="hidden"
              boxShadow="2xl"
            >
              {/* Hero image - Baseball field or dashboard screenshot */}
              <Box 
                bg="primary.500" 
                h={{ base: "300px", md: "400px" }} 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Icon as={FaBaseballBall} boxSize={20} color="white" opacity={0.5} />
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>
      
      {/* Features Section */}
      <Box as="section" py={20} id="features">
        <Container maxW="container.xl">
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center" maxW="800px" mx="auto">
              <Heading size="xl">Everything You Need to Coach Better</Heading>
              <Text fontSize="lg" color="gray.600">
                CompeteHQ combines roster management, lineup building, and fair play tracking 
                in one easy-to-use platform.
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              {/* Feature 1 */}
              <Card 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="lg" 
                height="100%"
                _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
                transition="all 0.3s"
              >
                <CardBody>
                  <VStack spacing={4} align="flex-start">
                    <Flex
                      w={12}
                      h={12}
                      align="center"
                      justify="center"
                      color="white"
                      rounded="full"
                      bg="primary.500"
                    >
                      <Icon as={FaUsers} boxSize={5} />
                    </Flex>
                    <Heading size="md">Team Management</Heading>
                    <Text color="gray.600">
                      Create multiple teams, manage players and coaches, and track team stats all in one place.
                      Easily invite parents and assistant coaches to collaborate.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Feature 2 */}
              <Card 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="lg" 
                height="100%"
                _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
                transition="all 0.3s"
              >
                <CardBody>
                  <VStack spacing={4} align="flex-start">
                    <Flex
                      w={12}
                      h={12}
                      align="center"
                      justify="center"
                      color="white"
                      rounded="full"
                      bg="green.500"
                    >
                      <Icon as={FaClipboardList} boxSize={5} />
                    </Flex>
                    <Heading size="md">Smart Lineup Builder</Heading>
                    <Text color="gray.600">
                      Create balanced lineups in minutes instead of hours. Our intuitive builder helps
                      you position players optimally and ensures everyone gets fair playing time.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Feature 3 */}
              <Card 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="lg" 
                height="100%"
                _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
                transition="all 0.3s"
              >
                <CardBody>
                  <VStack spacing={4} align="flex-start">
                    <Flex
                      w={12}
                      h={12}
                      align="center"
                      justify="center"
                      color="white"
                      rounded="full"
                      bg="purple.500"
                    >
                      <Icon as={FaChartLine} boxSize={5} />
                    </Flex>
                    <Heading size="md">Fair Play Analytics</Heading>
                    <Text color="gray.600">
                      Track playing time, position variety, and other metrics to ensure every player 
                      gets fair opportunities throughout the season.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            {/* Secondary Features */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} w="100%">
              {/* Feature 4 */}
              <Card 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="lg" 
                height="100%"
                _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
                transition="all 0.3s"
              >
                <CardBody>
                  <HStack spacing={4} align="flex-start">
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      color="white"
                      rounded="full"
                      bg="blue.500"
                      flexShrink={0}
                    >
                      <Icon as={FaCalendarAlt} boxSize={4} />
                    </Flex>
                    <VStack spacing={2} align="flex-start">
                      <Heading size="sm">Game & Practice Scheduling</Heading>
                      <Text color="gray.600" fontSize="sm">
                        Manage your entire season calendar, including games, practices, and events.
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
              
              {/* Feature 5 */}
              <Card 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="lg" 
                height="100%"
                _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
                transition="all 0.3s"
              >
                <CardBody>
                  <HStack spacing={4} align="flex-start">
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      color="white"
                      rounded="full"
                      bg="red.500"
                      flexShrink={0}
                    >
                      <Icon as={FaUsers} boxSize={4} />
                    </Flex>
                    <VStack spacing={2} align="flex-start">
                      <Heading size="sm">Parent Portal</Heading>
                      <Text color="gray.600" fontSize="sm">
                        Give parents access to schedules, lineups, and their child's statistics.
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
      
      {/* Testimonial Section */}
      <Box 
        as="section" 
        py={16} 
        bg={useColorModeValue('primary.50', 'primary.900')}
      >
        <Container maxW="container.xl">
          <Stack 
            direction={{ base: "column", lg: "row" }} 
            spacing={10} 
            align={{ base: "center", lg: "flex-start" }}
          >
            <Box maxW={{ base: "100%", lg: "40%" }}>
              <Heading size="xl" mb={6}>
                Trusted by Coaches Nationwide
              </Heading>
              <Text fontSize="lg" color="gray.600" mb={8}>
                Hear what coaches are saying about how CompeteHQ has transformed their coaching experience.
              </Text>
              <Button 
                as={NextLink} 
                href="/signup"
                colorScheme="primary" 
                size="lg"
              >
                Join Them Today
              </Button>
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} flex="1">
              {/* Testimonial 1 */}
              <Box 
                p={6} 
                bg="white" 
                borderRadius="lg" 
                boxShadow="md"
              >
                <Text fontSize="md" fontStyle="italic" mb={4}>
                  "CompeteHQ has been a game-changer for our team. Creating lineups used to take me hours, 
                  now I can do it in minutes. The parents love seeing the fair play metrics too!"
                </Text>
                <HStack>
                  <Box 
                    bg="gray.200" 
                    borderRadius="full" 
                    w={10} 
                    h={10} 
                    flexShrink={0}
                  />
                  <Box>
                    <Text fontWeight="bold">Mike Johnson</Text>
                    <Text fontSize="sm" color="gray.500">12U Head Coach</Text>
                  </Box>
                </HStack>
              </Box>
              
              {/* Testimonial 2 */}
              <Box 
                p={6} 
                bg="white" 
                borderRadius="lg" 
                boxShadow="md"
              >
                <Text fontSize="md" fontStyle="italic" mb={4}>
                  "As a new coach, I was overwhelmed with all the logistics. CompeteHQ made it easy 
                  to manage my team and ensure everyone gets fair playing time."
                </Text>
                <HStack>
                  <Box 
                    bg="gray.200" 
                    borderRadius="full" 
                    w={10} 
                    h={10} 
                    flexShrink={0}
                  />
                  <Box>
                    <Text fontWeight="bold">Sarah Miller</Text>
                    <Text fontSize="sm" color="gray.500">8U Coach Pitch</Text>
                  </Box>
                </HStack>
              </Box>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Box as="section" py={20}>
        <Container maxW="container.lg" textAlign="center">
          <Heading size="2xl" mb={6}>
            Ready to Transform Your Coaching?
          </Heading>
          <Text fontSize="xl" color="gray.600" mb={10} maxW="800px" mx="auto">
            Join thousands of coaches who are using CompeteHQ to streamline their team management 
            and create better experiences for their players.
          </Text>
          <Button 
            as={NextLink} 
            href="/signup" 
            colorScheme="primary" 
            size="lg" 
            px={10}
            py={7}
            fontSize="lg"
          >
            Get Started for Free
          </Button>
          <Text mt={4} color="gray.500">
            No credit card required. Free forever for basic teams.
          </Text>
        </Container>
      </Box>
      
      {/* Footer */}
      <Box as="footer" bg="gray.800" color="white" py={12}>
        <Container maxW="container.xl">
          <Stack 
            direction={{ base: "column", md: "row" }} 
            spacing={10} 
            justify="space-between"
            align={{ base: "center", md: "flex-start" }}
          >
            <VStack align={{ base: "center", md: "flex-start" }} spacing={4}>
              <Heading size="md">CompeteHQ</Heading>
              <Text color="gray.400">
                © {new Date().getFullYear()} CompeteHQ. All rights reserved.
              </Text>
            </VStack>
            
            <HStack spacing={4}>
              <NextLink href="/login" passHref>
                <Button as="a" variant="link" color="white">
                  Log In
                </Button>
              </NextLink>
              <NextLink href="/signup" passHref>
                <Button as="a" variant="link" color="white">
                  Sign Up
                </Button>
              </NextLink>
            </HStack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}