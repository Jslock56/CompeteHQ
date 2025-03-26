'use client';

import React from 'react';
import { Flex, Box, Text, IconButton, Container, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Button, Avatar } from '@chakra-ui/react';
import { FiSettings, FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import NextLink from 'next/link';
import { useAuth } from '../../contexts/auth-context';

interface HeaderProps {
  currentTeam?: {
    id: string;
    name: string;
    ageGroup?: string;
  } | null;
  onOpenSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTeam, onOpenSidebar }) => {
  // Get authentication state
  const { user, isAuthenticated, logout } = useAuth();
  
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

          {/* Team information, user profile and settings */}
          <Flex align="center">
            {currentTeam && (
              <Text fontSize="sm" fontWeight="medium" mr="4" display={{ base: 'none', sm: 'block' }}>
                {currentTeam.name} {currentTeam.ageGroup && `| ${currentTeam.ageGroup}`}
              </Text>
            )}
            
            {isAuthenticated ? (
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="User menu"
                  icon={
                    <Avatar 
                      size="sm" 
                      name={user ? `${user.firstName} ${user.lastName}` : undefined} 
                      bg="primary.500"
                    />
                  }
                  variant="unstyled"
                  rounded="full"
                />
                <MenuList>
                  <MenuItem icon={<FiUser />} as={NextLink} href="/profile">
                    Profile
                  </MenuItem>
                  <MenuItem icon={<FiSettings />} as={NextLink} href="/settings">
                    Settings
                  </MenuItem>
                  <MenuItem icon={<FiLogOut />} onClick={logout}>
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <NextLink href="/login" passHref>
                <Button size="sm" variant="outline" colorScheme="primary">
                  Login
                </Button>
              </NextLink>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;