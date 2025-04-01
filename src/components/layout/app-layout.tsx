'use client';

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { 
  Box, 
  Flex, 
  useDisclosure, 
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
import { useTeamContext } from "../../contexts/team-context";
import { useAuth } from "../../contexts/auth-context";
import Header from "../common/header";
import Navigation from "../common/navigation";
import Logo from "../common/logo";
import PageTransitions from "../common/page-transitions";

export function AppLayout({ children }: { children: ReactNode }) {
  // Use Chakra's useDisclosure for controlling drawer/sidebar state
  const navSidebar = useDisclosure();
  
  // Get current team from the team context
  const { currentTeam, isLoading } = useTeamContext();
  
  // Get auth context and pathname
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Check if this is a public page or part of the setup process
  const isPublicPage = [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/verify-email',
    '/select-role',
    '/teams/join',
    '/teams/new'
  ].includes(pathname) || pathname.startsWith('/teams/new');

  // For public pages, render without the app shell
  if (isPublicPage) {
    return (
      <Box minH="100vh">
        {children}
      </Box>
    );
  }

  // For authenticated pages, render with the app shell
  return (
    <Flex direction="column" h="100vh">
      {/* Header */}
      <Header currentTeam={currentTeam} onOpenSidebar={navSidebar.onOpen} />
      
      {/* Main area with sidebars */}
      <Flex flex="1" overflow="hidden">
        {/* Left Navigation Sidebar - Desktop */}
        <Box
          bg="white"
          w="240px"
          borderRightWidth="1px"
          borderColor="gray.200"
          display={{ base: "none", md: "block" }}
          flex="none"
        >
          <Navigation currentTeam={currentTeam} />
        </Box>
        
        {/* Mobile Navigation Drawer */}
        <Drawer
          isOpen={navSidebar.isOpen}
          placement="left"
          onClose={navSidebar.onClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <Navigation currentTeam={currentTeam} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        
        {/* Main Content */}
        <Box flex="1" overflow="auto">
          {/* Mobile nav toggle */}
          <IconButton
            aria-label="Open navigation"
            icon={<HamburgerIcon />}
            display={{ base: "block", md: "none" }}
            position="fixed"
            top="70px"
            left="4"
            zIndex="dropdown"
            colorScheme="primary"
            variant="ghost"
            onClick={navSidebar.onOpen}
          />
          
          <Box as="main">
            <PageTransitions type="fade" duration={0.4}>
              {children}
            </PageTransitions>
          </Box>
        </Box>
        
      </Flex>
      
      {/* Footer */}
      <Box
        as="footer"
        bg="white"
        borderTopWidth="1px"
        borderColor="gray.200"
        py="2"
        px="4"
        fontSize="xs"
        color="gray.500"
      >
        <Flex justify="center" align="center" gap={2}>
          <Logo showText={false} size="sm" />
          <Text suppressHydrationWarning>© {new Date().getFullYear()} competeHQ</Text>
        </Flex>
      </Box>
    </Flex>
  );
}