'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Switch,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/auth-context';

/**
 * General Settings Page
 */
export default function SettingsPage() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Sample save handler
  const handleSave = () => {
    toast({
      title: 'Settings saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>Settings</Heading>
        <Text color="gray.600">
          Manage your application preferences and account settings
        </Text>
      </Box>
      
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="md">General Settings</Heading>
            <Divider />
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="dark-mode" mb="0">
                Dark Mode
              </FormLabel>
              <Switch id="dark-mode" colorScheme="primary" />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notifications" mb="0">
                Email Notifications
              </FormLabel>
              <Switch id="notifications" colorScheme="primary" defaultChecked />
            </FormControl>
            
            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input 
                defaultValue={user ? `${user.firstName} ${user.lastName}` : ''}
                placeholder="Your display name" 
              />
            </FormControl>
            
            <Button colorScheme="primary" alignSelf="flex-start" onClick={handleSave}>
              Save Changes
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}