'use client';

import React from 'react';
import { Box, VStack, Text, Flex, Link, Icon, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiUsers, 
  FiUser, 
  FiCalendar, 
  FiList, 
  FiActivity,
  FiUpload,
  FiSettings
} from 'react-icons/fi';

interface NavigationProps {
  currentTeam?: {
    id: string;
    name: string;
    ageGroup?: string;
  } | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactElement;
}

const Navigation: React.FC<NavigationProps> = ({ currentTeam }) => {
  const pathname = usePathname();
  
  const navigationItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Icon as={FiHome} boxSize={4} />,
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: <Icon as={FiUsers} boxSize={4} />,
    },
    {
      name: 'Roster',
      href: '/roster',
      icon: <Icon as={FiUser} boxSize={4} />,
    },
    {
      name: 'Games',
      href: '/games',
      icon: <Icon as={FiCalendar} boxSize={4} />,
    },
    {
      name: 'Lineups',
      href: '/lineup/dashboard',
      icon: <Icon as={FiList} boxSize={4} />,
    },
    {
      name: 'Practice',
      href: '/practice',
      icon: <Icon as={FiActivity} boxSize={4} />,
    },
    {
      name: 'Import',
      href: '/import',
      icon: <Icon as={FiUpload} boxSize={4} />,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: <Icon as={FiSettings} boxSize={4} />,
    },
  ];

  // Color values for active and inactive states
  const activeTextColor = useColorModeValue('primary.700', 'primary.200');
  const inactiveTextColor = useColorModeValue('gray.600', 'gray.400');
  const activeBgColor = useColorModeValue('primary.50', 'primary.900');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const activeIconColor = useColorModeValue('primary.500', 'primary.300');
  const inactiveIconColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box h="full" py={4} overflowY="auto">
      {currentTeam && (
        <Box px={4} mb={6}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500">
            CURRENT TEAM
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900" isTruncated>
            {currentTeam.name}
          </Text>
          {currentTeam.ageGroup && (
            <Text fontSize="xs" color="gray.500">
              {currentTeam.ageGroup}
            </Text>
          )}
        </Box>
      )}
      
      <VStack spacing={1} align="stretch" px={2}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              as={NextLink}
              href={item.href}
              display="flex"
              alignItems="center"
              px={2}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              rounded="md"
              color={isActive ? activeTextColor : inactiveTextColor}
              bg={isActive ? activeBgColor : 'transparent'}
              _hover={{ bg: !isActive ? hoverBgColor : undefined }}
              textDecoration="none"
            >
              <Flex
                mr={3}
                color={isActive ? activeIconColor : inactiveIconColor}
                _groupHover={{ color: isActive ? undefined : 'gray.500' }}
              >
                {item.icon}
              </Flex>
              {item.name}
            </Link>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Navigation;