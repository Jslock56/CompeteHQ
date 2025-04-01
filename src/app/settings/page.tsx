'use client';

import React, { useState, useEffect } from 'react';
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
  Select,
  HStack,
  FormHelperText,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/auth-context';
import { settingsService } from '../../services/database/settings-service';

/**
 * General Settings Page
 */
export default function SettingsPage() {
  const toast = useToast();
  const { user } = useAuth();
  
  // State for form values
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [defaultInnings, setDefaultInnings] = useState(7);
  
  // Load current settings
  useEffect(() => {
    // Function to load settings
    const loadSettings = async () => {
      try {
        // First load from local storage for immediate display
        const localSettings = settingsService.getSettings();
        setDarkMode(localSettings.theme === 'dark');
        setDefaultInnings(localSettings.defaultInnings);
        
        // Then try to load from the server
        const response = await fetch('/api/settings');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.settings) {
            console.log('Loaded settings from server:', data.settings);
            
            // Update state with server values
            if (data.settings.theme) {
              setDarkMode(data.settings.theme === 'dark');
              // Also update local storage
              settingsService.setTheme(data.settings.theme);
            }
            
            if (data.settings.defaultInnings !== undefined) {
              setDefaultInnings(data.settings.defaultInnings);
              // Also update local storage
              settingsService.setDefaultInnings(data.settings.defaultInnings);
            }
            
            if (data.settings.emailNotifications !== undefined) {
              setNotifications(data.settings.emailNotifications);
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings from server:', error);
        // Continue using local settings if server fails
      }
    };
    
    loadSettings();
    
    // Set display name if user exists
    if (user) {
      setDisplayName(`${user.firstName} ${user.lastName}`);
    }
  }, [user]);
  
  // Save handler
  const handleSave = async () => {
    try {
      // First, save to local storage for immediate effect
      settingsService.setTheme(darkMode ? 'dark' : 'light');
      settingsService.setDefaultInnings(defaultInnings);
      
      // Then save to MongoDB for persistence
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            theme: darkMode ? 'dark' : 'light',
            defaultInnings: defaultInnings,
            emailNotifications: notifications
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings to server');
      }
      
      // Show success message
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated and synced to the server.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Show error message
      toast({
        title: 'Save error',
        description: 'Settings saved locally but could not be synced to the server.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
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
              <Switch 
                id="dark-mode" 
                colorScheme="primary" 
                isChecked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notifications" mb="0">
                Email Notifications
              </FormLabel>
              <Switch 
                id="notifications" 
                colorScheme="primary" 
                isChecked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name" 
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Default Number of Innings</FormLabel>
              <Select
                value={defaultInnings}
                onChange={(e) => setDefaultInnings(Number(e.target.value))}
                width="120px"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                This setting will be used as the default for new games
              </FormHelperText>
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