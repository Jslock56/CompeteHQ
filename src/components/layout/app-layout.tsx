'use client';

import { ReactNode } from "react";
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
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
import Header from "../common/header";
import Navigation from "../common/navigation";
import WidgetsSidebar from "../common/widgets-sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  // Use Chakra's useDisclosure for controlling drawer/sidebar states
  const navSidebar = useDisclosure();
  const widgetSidebar = useDisclosure();
  
  // Get current team from context or local state
  const currentTeam = {
    id: '1',
    name: 'Wildcats',
    ageGroup: '10U'
  };

  return (
    <Flex direction="column" h="100vh">
      {/* Header */}
      <Header currentTeam={currentTeam} />
      
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
            {children}
          </Box>
        </Box>
        
        {/* Right Widgets Sidebar */}
        <Box
          bg="white"
          w="280px"
          borderLeftWidth="1px"
          borderColor="gray.200"
          display={{ base: "none", lg: "block" }}
          flex="none"
        >
          <WidgetsSidebar />
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
        textAlign="center"
      >
        © {new Date().getFullYear()} competeHQ
      </Box>
    </Flex>
  );
}