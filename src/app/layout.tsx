// src/app/layout.tsx
"use client";

import { ReactNode, useState } from "react";
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
import { Providers } from "./providers";
import Header from "../components/common/header";
import Navigation from "../components/common/navigation";
import WidgetsSidebar from "../components/common/widgets-sidebar";
import { TeamProvider } from "../contexts/team-context";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Use Chakra's useDisclosure for controlling drawer/sidebar states
  const navSidebar = useDisclosure({ defaultIsOpen: true });
  const widgetSidebar = useDisclosure();
  
  // Get current team from context or local state
  const currentTeam = {
    id: '1',
    name: 'Wildcats',
    ageGroup: '10U'
  };

  return (
    <html lang="en">
      <body>
        <Providers>
          <TeamProvider>
            {/* Layout structure using Chakra components */}
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
                  display={{ base: "block", md: "none" }}
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
          </TeamProvider>
        </Providers>
      </body>
    </html>
  );
}