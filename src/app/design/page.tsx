"use client";

import React from 'react';
import {
  Box, 
  Heading, 
  Text, 
  VStack,
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  SimpleGrid,
  Divider
} from '@chakra-ui/react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/chakra';
import { PageContainer } from '../../components/layout/page-container';
import { PositionBadge } from '../../components/common/position-badge';

// This page showcases all your UI components in one place
export default function DesignPage() {
  return (
    <PageContainer title="Design System" subtitle="UI Components & Patterns">
      <Tabs>
        <TabList>
          <Tab>Typography</Tab>
          <Tab>Colors</Tab>
          <Tab>Components</Tab>
          <Tab>Layouts</Tab>
          <Tab>Baseball Elements</Tab>
        </TabList>
        
        <TabPanels>
          {/* Typography Panel */}
          <TabPanel>
            <Card>
              <VStack align="start" spacing={6}>
                <Box>
                  <Heading as="h1" size="2xl">Heading 1 (2xl)</Heading>
                  <Text>Used for main page titles</Text>
                </Box>
                
                <Box>
                  <Heading as="h2" size="xl">Heading 2 (xl)</Heading>
                  <Text>Used for section titles</Text>
                </Box>
                
                <Box>
                  <Heading as="h3" size="lg">Heading 3 (lg)</Heading>
                  <Text>Used for card titles</Text>
                </Box>
                
                <Box>
                  <Heading as="h4" size="md">Heading 4 (md)</Heading>
                  <Text>Used for subsections</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontSize="xl">Large Text (xl)</Text>
                  <Text>Used for important information</Text>
                </Box>
                
                <Box>
                  <Text>Normal Text (md)</Text>
                  <Text fontSize="sm">This is the default text size</Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm">Small Text (sm)</Text>
                  <Text fontSize="sm">Used for secondary information</Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs">Extra Small Text (xs)</Text>
                  <Text fontSize="sm">Used for metadata and timestamps</Text>
                </Box>
              </VStack>
            </Card>
          </TabPanel>
          
          {/* Colors Panel */}
          <TabPanel>
            <Card>
              <Heading size="md" mb={6}>Primary Colors</Heading>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(weight => (
                  <Box key={weight} bg={`primary.${weight}`} p={4} borderRadius="md">
                    <Text color={weight > 400 ? "white" : "black"} fontWeight="bold">
                      {weight}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              
              <Heading size="md" mt={8} mb={6}>Position Colors</Heading>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                {['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'BN'].map(position => (
                  <Flex key={position} direction="column" align="center">
                    <PositionBadge position={position} h="12" w="12" fontSize="md" />
                    <Text mt={2}>{position}</Text>
                  </Flex>
                ))}
              </SimpleGrid>
            </Card>
          </TabPanel>
          
          {/* Components Panel */}
          <TabPanel>
            <Card>
              <Heading size="md" mb={6}>Buttons</Heading>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Button colorScheme="primary">Primary</Button>
                <Button colorScheme="primary" variant="outline">Outline</Button>
                <Button colorScheme="gray">Secondary</Button>
                <Button colorScheme="red">Danger</Button>
              </SimpleGrid>
              
              {/* Add more component examples */}
            </Card>
          </TabPanel>
          
          {/* Continue with other tabs */}
        </TabPanels>
      </Tabs>
    </PageContainer>
  );
}