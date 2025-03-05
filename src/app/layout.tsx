// src/app/layout.tsx
"use client";

import { ReactNode, useState } from "react";
import { Providers } from "./providers";
import { Box, Flex, Text } from "@chakra-ui/react";
import Header from "../components/common/header";
import Navigation from "../components/common/navigation";
import WidgetsSidebar from "../components/common/widgets-sidebar";
import { TeamProvider } from "../contexts/team-context";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isWidgetSidebarOpen, setWidgetSidebarOpen] = useState(false);
  
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
                {/* Left Navigation Sidebar */}
                <Box
                  bg="white"
                  w="60"
                  borderRightWidth="1px"
                  borderColor="gray.200"
                  flexShrink={0}
                  transition="all 0.3s ease-in-out"
                  ml={isSidebarOpen ? 0 : "-60"}
                  position="relative"
                >
                  <Navigation currentTeam={currentTeam} />
                  
                  {/* Sidebar toggle button */}
                  <Box
                    as="button"
                    position="absolute"
                    bottom="4"
                    left="4"
                    p="1"
                    borderRadius="full"
                    bg="gray.200"
                    color="gray.600"
                    _hover={{ bg: "gray.300" }}
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    {/* Icon could go here */}
                  </Box>
                </Box>
                
                {/* Main Content */}
                <Box flex="1" overflow="auto">
                  <Box as="main" p="6">
                    {children}
                  </Box>
                </Box>
                
                {/* Right Widgets Sidebar */}
                <Box
                  bg="white"
                  w="72"
                  borderLeftWidth="1px"
                  borderColor="gray.200"
                  flexShrink={0}
                  transition="all 0.3s ease-in-out"
                  transform={isWidgetSidebarOpen ? "none" : "translateX(100%)"}
                >
                  <WidgetsSidebar />
                  
                  {/* Toggle button */}
                  <Box
                    as="button"
                    position="absolute"
                    top="20"
                    right="0"
                    p="1"
                    borderRadius="md"
                    borderRightRadius="0"
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRight="0"
                    color="gray.600"
                    _hover={{ bg: "gray.50" }}
                    transform="translateX(-100%)"
                    onClick={() => setWidgetSidebarOpen(!isWidgetSidebarOpen)}
                    title={isWidgetSidebarOpen ? "Hide widgets" : "Show widgets"}
                  >
                    {/* Icon would go here */}
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