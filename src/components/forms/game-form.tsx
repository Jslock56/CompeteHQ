'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  FormErrorMessage,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { Game } from '../../types/game';
import { useGames } from '../../hooks/use-games';

interface GameFormProps {
  /**
   * Initial game data (for editing an existing game)
   */
  initialGame?: Game;
  
  /**
   * Whether this form is for editing an existing game
   */
  isEditing?: boolean;
  
  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: (game: Game) => void;
}

/**
 * Form for creating or editing a game
 */
const GameForm: React.FC<GameFormProps> = ({ initialGame, isEditing = false, onSuccess }) => {
  const router = useRouter();
  const toast = useToast();
  const { createGame, updateGame } = useGames();
  
  // Game status options
  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' }
  ];
  
  // Default date value for new games (set to today at noon)
  const getDefaultDate = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today.toISOString().substring(0, 16); // Format: YYYY-MM-DDThh:mm
  };
  
  // Parse date from timestamp
  const parseDateFromTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().substring(0, 16); // Format: YYYY-MM-DDThh:mm
  };
  
  // Form state
  const [opponent, setOpponent] = useState(initialGame?.opponent || '');
  const [dateTime, setDateTime] = useState(
    initialGame ? parseDateFromTimestamp(initialGame.date) : getDefaultDate()
  );
  const [location, setLocation] = useState(initialGame?.location || '');
  const [innings, setInnings] = useState(initialGame?.innings.toString() || '6');
  const [status, setStatus] = useState(initialGame?.status || 'scheduled');
  
  // Error state
  const [errors, setErrors] = useState<{
    opponent?: string;
    dateTime?: string;
    location?: string;
    innings?: string;
    general?: string;
  }>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    let isValid = true;
    const newErrors: typeof errors = {};
    
    if (!opponent.trim()) {
      newErrors.opponent = 'Opponent name is required';
      isValid = false;
    }
    
    if (!dateTime) {
      newErrors.dateTime = 'Game date and time are required';
      isValid = false;
    }
    
    if (!location.trim()) {
      newErrors.location = 'Game location is required';
      isValid = false;
    }
    
    const inningsNumber = parseInt(innings);
    if (isNaN(inningsNumber) || inningsNumber < 1 || inningsNumber > 9) {
      newErrors.innings = 'Innings must be between 1 and 9';
      isValid = false;
    }
    
    if (!isValid) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    try {
      // Convert date string to timestamp
      const dateTimestamp = new Date(dateTime).getTime();
      
      if (isEditing && initialGame) {
        // Update existing game
        const updated = updateGame({
          ...initialGame,
          opponent,
          date: dateTimestamp,
          location,
          innings: inningsNumber,
          status: status as Game['status']
        });
        
        if (updated) {
          toast({
            title: 'Game updated.',
            description: `Game against ${opponent} has been updated successfully.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          if (onSuccess) {
            onSuccess(initialGame);
          } else {
            router.push('/games');
          }
        } else {
          setErrors({ general: 'Failed to update game' });
        }
      } else {
        // Create new game
        const newGame = createGame({
          opponent,
          date: dateTimestamp,
          location,
          innings: inningsNumber,
          status: status as Game['status']
        });
        
        toast({
          title: 'Game created.',
          description: `Game against ${opponent} has been created successfully.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess(newGame);
        } else {
          router.push('/games');
        }
      }
    } catch (error) {
      setErrors({ 
        general: `Failed to ${isEditing ? 'update' : 'create'} game: ${String(error)}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* General error message */}
        {errors.general && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {errors.general}
          </Alert>
        )}
        
        {/* Form fields */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Opponent */}
          <FormControl isInvalid={!!errors.opponent} isRequired>
            <FormLabel htmlFor="opponent">Opponent</FormLabel>
            <Input
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Opponent team name"
            />
            {errors.opponent && <FormErrorMessage>{errors.opponent}</FormErrorMessage>}
          </FormControl>
          
          {/* Date and Time */}
          <FormControl isInvalid={!!errors.dateTime} isRequired>
            <FormLabel htmlFor="date-time">Date and Time</FormLabel>
            <Input
              id="date-time"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
            {errors.dateTime && <FormErrorMessage>{errors.dateTime}</FormErrorMessage>}
          </FormControl>
          
          {/* Location */}
          <FormControl isInvalid={!!errors.location} isRequired>
            <FormLabel htmlFor="location">Location</FormLabel>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Home Field, Central Park"
            />
            {errors.location && <FormErrorMessage>{errors.location}</FormErrorMessage>}
          </FormControl>
          
          {/* Innings */}
          <FormControl isInvalid={!!errors.innings} isRequired>
            <FormLabel htmlFor="innings">Innings</FormLabel>
            <Select
              id="innings"
              value={innings}
              onChange={(e) => setInnings(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </Select>
            {errors.innings && <FormErrorMessage>{errors.innings}</FormErrorMessage>}
          </FormControl>
          
          {/* Status */}
          <FormControl>
            <FormLabel htmlFor="status">Game Status</FormLabel>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Game['status'])}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>
        
        {/* Form Actions */}
        <HStack spacing={3} justify="flex-end">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="primary"
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            {isEditing ? 'Update' : 'Create'} Game
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default GameForm;