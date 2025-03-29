'use client';

import React from 'react';
import { Box, Container, Flex, Stack, Link, Text, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Layout for settings pages with a side navigation
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Define settings navigation items
  const navItems = [
    { name: 'General', path: '/settings' },
    { name: 'Assets & Logo', path: '/settings/assets' },
    { name: 'Account', path: '/settings/account' },
    { name: 'Notifications', path: '/settings/notifications' },
  ];
  
  return (
    <Container maxW="container.xl" py={8}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={8}
      >
        {/* Settings sidebar navigation */}
        <Box
          width={{ base: 'full', md: '200px' }}
          flex="none"
        >
          <Box
            bg={bgColor}
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
            p={4}
            position={{ base: 'relative', md: 'sticky' }}
            top={{ base: 0, md: '100px' }}
          >
            <Text fontWeight="bold" mb={4}>Settings</Text>
            <Stack spacing={1}>
              {navItems.map((item) => (
                <NextLink href={item.path} key={item.path} passHref>
                  <Link
                    display="block"
                    px={3}
                    py={2}
                    borderRadius="md"
                    bgColor={pathname === item.path ? 'primary.50' : 'transparent'}
                    color={pathname === item.path ? 'primary.700' : 'inherit'}
                    fontWeight={pathname === item.path ? 'semibold' : 'normal'}
                    _hover={{ textDecoration: 'none', bg: 'primary.50', color: 'primary.700' }}
                  >
                    {item.name}
                  </Link>
                </NextLink>
              ))}
            </Stack>
          </Box>
        </Box>
        
        {/* Main content area */}
        <Box flex="1">
          {children}
        </Box>
      </Flex>
    </Container>
  );
}