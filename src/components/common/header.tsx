'use client';

import React from 'react';
import { Flex, Box, Text, IconButton, Container, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Button, Avatar, Spinner, MenuDivider, useToast } from '@chakra-ui/react';
import { FiSettings, FiMenu, FiLogOut, FiUser, FiChevronDown, FiImage } from 'react-icons/fi';
import NextLink from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { useTeamContext } from '../../contexts/team-context';
import { useRouter } from 'next/navigation';
import Logo from './logo';

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
  const { user, isAuthenticated, logout, changeActiveTeam } = useAuth();
  const { teams, isLoading: isTeamsLoading } = useTeamContext();
  const router = useRouter();
  const toast = useToast();
  
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
            
            {/* Logo using the new Logo component */}
            <Logo size="md" />
          </Flex>

          {/* Team information, user profile and settings */}
          <Flex align="center">
            {isAuthenticated && (
              <Menu>
                <MenuButton 
                  as={Button} 
                  rightIcon={<FiChevronDown />} 
                  variant="ghost"
                  size="sm"
                  mr="4"
                  display={{ base: 'none', sm: 'flex' }}
                >
                  {isTeamsLoading ? (
                    <Spinner size="xs" mr="2" />
                  ) : currentTeam ? (
                    <Text>
                      {currentTeam.name} {currentTeam.ageGroup && `| ${currentTeam.ageGroup}`}
                    </Text>
                  ) : (
                    <Text color="gray.500">Select a team</Text>
                  )}
                </MenuButton>
                <MenuList zIndex={100}>
                  <MenuItem fontWeight="bold" isDisabled>Your Teams</MenuItem>
                  <MenuDivider />
                  {isTeamsLoading ? (
                    <MenuItem justifyContent="center" isDisabled>
                      <Spinner size="sm" />
                    </MenuItem>
                  ) : teams && teams.length > 0 ? (
                    teams.map(team => (
                      <MenuItem 
                        key={team.id}
                        onClick={async () => {
                          // Handle team switching
                          // Create a variable for the toast ID outside the try block
                          let loadingToast: string | number | undefined;
                          
                          try {
                            console.log('Switching to team:', team.name, team.id);
                            
                            // Set a loading indicator
                            loadingToast = toast({
                              title: 'Switching teams...',
                              status: 'loading',
                              position: 'top',
                              duration: null,
                              id: 'team-switch-loading' // Add ID for easier reference
                            });
                            
                            // First update localStorage directly for reliability
                            // Use the correct key from STORAGE_KEYS
                            localStorage.setItem('competehq_current_team', team.id);
                            
                            // Then make the API call to update server state
                            console.log('Calling changeActiveTeam with ID:', team.id);
                            const success = await changeActiveTeam(team.id);
                            
                            // Always close the loading toast regardless of success or failure
                            toast.close(loadingToast);
                            
                            if (success) {
                              console.log('Switched to team:', team.name);
                              toast({
                                title: 'Team switched!',
                                description: `Now viewing ${team.name}`,
                                status: 'success',
                                duration: 2000,
                                position: 'top'
                              });
                              
                              // Force a full page reload to reset all state
                              setTimeout(() => {
                                console.log('Reloading page...');
                                window.location.href = '/dashboard';
                              }, 500);
                            } else {
                              toast({
                                title: 'Error switching teams',
                                status: 'error',
                                duration: 3000,
                                position: 'top'
                              });
                            }
                          } catch (error) {
                            // Ensure loading toast is closed in case of error
                            toast.close(loadingToast);
                            toast.close('team-switch-loading');
                            
                            console.error('Error switching teams:', error);
                            toast({
                              title: 'Error switching teams',
                              description: 'Please try again',
                              status: 'error',
                              duration: 3000,
                              position: 'top'
                            });
                          }
                        }}
                        fontWeight={currentTeam?.id === team.id ? 'bold' : 'normal'}
                      >
                        {team.name} {team.ageGroup && `| ${team.ageGroup}`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem isDisabled>No teams available</MenuItem>
                  )}
                  <MenuDivider />
                  <MenuItem as={NextLink} href="/teams/new">+ Create New Team</MenuItem>
                </MenuList>
              </Menu>
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
                  <MenuItem icon={<FiImage />} as={NextLink} href="/settings/assets">
                    Assets & Logo
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