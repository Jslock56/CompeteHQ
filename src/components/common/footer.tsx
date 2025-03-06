'use client';

import React from 'react';
import { Box, Container, Flex, HStack, Text, Link } from '@chakra-ui/react';
import NextLink from 'next/link';

type FooterProps = object;

const Footer: React.FC<FooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box as="footer" bg="white" borderTopWidth="1px" borderColor="gray.200" mt="auto">
      <Container maxW="7xl" py={6} px={{ base: 4, md: 6, lg: 8 }}>
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          align={{ base: 'center', md: 'center' }}
          justify={{ base: 'center', md: 'space-between' }}
          gap={{ base: 4, md: 0 }}
        >
          {/* Logo and Brand */}
          <Flex align="center" justify={{ base: 'center', md: 'flex-start' }}>
            <NextLink href="/" passHref>
              <Flex as={Link} align="center" _hover={{ textDecoration: 'none' }}>
                <Flex 
                  h="6" 
                  w="6" 
                  rounded="md" 
                  bg="primary.600" 
                  align="center" 
                  justify="center" 
                  color="white" 
                  fontWeight="bold" 
                  fontSize="xs" 
                  mr="2"
                >
                  C
                </Flex>
                <Text fontSize="sm" fontWeight="medium" color="gray.900">
                  competeHQ
                </Text>
              </Flex>
            </NextLink>
          </Flex>

          {/* Copyright */}
          <Box mt={{ base: 4, md: 0 }}>
            <Text textAlign="center" fontSize="sm" color="gray.500">
              &copy; {currentYear} competeHQ. All rights reserved.
            </Text>
          </Box>

          {/* Links */}
          <HStack spacing={6} mt={{ base: 4, md: 0 }}>
            <NextLink href="/privacy" passHref>
              <Link fontSize="sm" color="gray.500" _hover={{ color: 'gray.700' }}>
                Privacy Policy
              </Link>
            </NextLink>
            <NextLink href="/terms" passHref>
              <Link fontSize="sm" color="gray.500" _hover={{ color: 'gray.700' }}>
                Terms of Service
              </Link>
            </NextLink>
            <NextLink href="/contact" passHref>
              <Link fontSize="sm" color="gray.500" _hover={{ color: 'gray.700' }}>
                Contact
              </Link>
            </NextLink>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;