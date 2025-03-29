'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Card,
  CardBody,
  useToast
} from '@chakra-ui/react';
import ScheduleUploader from '../../components/common/schedule-uploader';
import { useRouter } from 'next/navigation';

/**
 * Import page for uploading CSVs and other data
 */
export default function ImportPage() {
  const router = useRouter();
  const toast = useToast();
  
  /**
   * Handle successful import of games
   */
  const handleGamesImportSuccess = (results: {
    created: number;
    failed: number;
    total: number;
  }) => {
    // Redirect to games page after successful import
    if (results.created > 0) {
      setTimeout(() => {
        router.push('/games');
      }, 2000);
    }
  };
  
  /**
   * Handle successful import of practices
   */
  const handlePracticesImportSuccess = (results: {
    created: number;
    failed: number;
    total: number;
  }) => {
    // Redirect to practice page after successful import
    if (results.created > 0) {
      setTimeout(() => {
        router.push('/practice');
      }, 2000);
    }
  };
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading mb={2}>Import Data</Heading>
          <Text color="gray.600">
            Import games, practices, or players from CSV files
          </Text>
        </Box>
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Games</Tab>
            <Tab>Practices</Tab>
            <Tab>Players</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={6}>
              <Card>
                <CardBody>
                  <ScheduleUploader 
                    defaultImportType="games" 
                    onSuccess={handleGamesImportSuccess}
                  />
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel p={0} pt={6}>
              <Card>
                <CardBody>
                  <ScheduleUploader 
                    defaultImportType="practices" 
                    onSuccess={handlePracticesImportSuccess}
                  />
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel p={0} pt={6}>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Import Players</Heading>
                    <Text>
                      Coming soon! Player imports will be available in a future update.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}