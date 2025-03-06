'use client';

import React from 'react';
import { Flex, Box, Text, IconButton, Container, useColorModeValue } from '@chakra-ui/react';
import { FiSettings, FiMenu } from 'react-icons/fi';
import NextLink from 'next/link';

interface HeaderProps {
  currentTeam?: {
    id: string;
    name: string;
    ageGroup?: string;
  } | null;
  onOpenSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTeam, onOpenSidebar }) => {
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box 
      as="header" 
      bg={bgColor} 
      borderBottomWidth="1px" 
      borderColor={borderColor} 
      h="14" 
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Container maxW="full" h="100%" px={{ base: 4, md: 6, lg: 8 }}>
        <Flex h="100%" align="center" justify="space-between">
          <Flex align="center">
            {/* Mobile menu button */}
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              variant="ghost"
              aria-label="Open menu"
              icon={<FiMenu />}
              size="sm"
              mr={2}
              onClick={onOpenSidebar}
            />
            
            {/* Logo */}
            <NextLink href="/" passHref>
              <Flex align="center" cursor="pointer">
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
                <Text fontWeight="bold" fontSize="base" color={textColor}>
                  competeHQ
                </Text>
              </Flex>
            </NextLink>
          </Flex>

          {/* Team information and settings */}
          {currentTeam && (
            <Flex align="center">
              <Text fontSize="sm" fontWeight="medium" mr="4" display={{ base: 'none', sm: 'block' }}>
                {currentTeam.name} {currentTeam.ageGroup && `| ${currentTeam.ageGroup}`}
              </Text>
              <IconButton
                aria-label="Settings"
                icon={<FiSettings />}
                variant="ghost"
                rounded="full"
                size="sm"
              />
            </Flex>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;