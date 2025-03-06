"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Switch,
  VStack,
  HStack,
  SimpleGrid,
  Heading,
  Text,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  Divider
} from '@chakra-ui/react';
import { Player, Position } from '../../types/player';
import { usePlayers } from '../../hooks/use-players';

interface PlayerFormProps {
  /**
   * Initial player data (for editing an existing player)
   */
  initialPlayer?: Player;
  
  /**
   * Whether this form is for editing an existing player
   */
  isEditing?: boolean;
  
  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: (player: Player) => void;
}

/**
 * Available baseball positions
 */
const POSITIONS: { value: Position; label: string }[] = [
  { value: 'P', label: 'Pitcher (P)' },
  { value: 'C', label: 'Catcher (C)' },
  { value: '1B', label: 'First Base (1B)' },
  { value: '2B', label: 'Second Base (2B)' },
  { value: '3B', label: 'Third Base (3B)' },
  { value: 'SS', label: 'Shortstop (SS)' },
  { value: 'LF', label: 'Left Field (LF)' },
  { value: 'CF', label: 'Center Field (CF)' },
  { value: 'RF', label: 'Right Field (RF)' },
  { value: 'DH', label: 'Designated Hitter (DH)' },
  { value: 'BN', label: 'Bench (BN)' }
];

/**
 * Form for creating or editing a player
 */
export default function PlayerForm({ initialPlayer, isEditing = false, onSuccess }: PlayerFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { createPlayer, updatePlayer } = usePlayers();
  
  // Form state
  const [firstName, setFirstName] = useState(initialPlayer?.firstName || '');
  const [lastName, setLastName] = useState(initialPlayer?.lastName || '');
  const [jerseyNumber, setJerseyNumber] = useState(initialPlayer?.jerseyNumber?.toString() || '');
  const [primaryPositions, setPrimaryPositions] = useState<Position[]>(initialPlayer?.primaryPositions || []);
  const [secondaryPositions, setSecondaryPositions] = useState<Position[]>(initialPlayer?.secondaryPositions || []);
  const [notes, setNotes] = useState(initialPlayer?.notes || '');
  const [active, setActive] = useState(initialPlayer?.active !== false);
  
  // Error state
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    jerseyNumber?: string;
    primaryPositions?: string;
    general?: string;
  }>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle position selection for primary positions
  const handlePrimaryPositionChange = (position: Position) => {
    if (primaryPositions.includes(position)) {
      // Remove if already selected
      setPrimaryPositions(primaryPositions.filter(p => p !== position));
    } else {
      // Add if not selected
      setPrimaryPositions([...primaryPositions, position]);
      
      // Remove from secondary positions if present
      if (secondaryPositions.includes(position)) {
        setSecondaryPositions(secondaryPositions.filter(p => p !== position));
      }
    }
  };
  
  // Handle position selection for secondary positions
  const handleSecondaryPositionChange = (position: Position) => {
    if (secondaryPositions.includes(position)) {
      // Remove if already selected
      setSecondaryPositions(secondaryPositions.filter(p => p !== position));
    } else {
      // Add if not selected
      setSecondaryPositions([...secondaryPositions, position]);
      
      // Remove from primary positions if present
      if (primaryPositions.includes(position)) {
        setPrimaryPositions(primaryPositions.filter(p => p !== position));
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    let isValid = true;
    const newErrors: typeof errors = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    
    const jerseyNum = parseInt(jerseyNumber);
    if (isNaN(jerseyNum) || jerseyNum < 0 || jerseyNum > 99) {
      newErrors.jerseyNumber = 'Jersey number must be between 0 and 99';
      isValid = false;
    }
    
    if (primaryPositions.length === 0) {
      newErrors.primaryPositions = 'At least one primary position is required';
      isValid = false;
    }
    
    if (!isValid) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialPlayer) {
        // Update existing player
        const updated = updatePlayer({
          ...initialPlayer,
          firstName,
          lastName,
          jerseyNumber: jerseyNum,
          primaryPositions,
          secondaryPositions,
          notes,
          active
        });
        
        if (updated) {
          toast({
            title: "Player updated",
            description: `${firstName} ${lastName} has been updated successfully.`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          
          if (onSuccess) {
            onSuccess(initialPlayer);
          } else {
            router.push('/roster');
          }
        } else {
          setErrors({ general: 'Failed to update player' });
        }
      } else {
        // Create new player
        const newPlayer = createPlayer({
          firstName,
          lastName,
          jerseyNumber: jerseyNum,
          primaryPositions,
          secondaryPositions,
          notes,
          active
        });
        
        toast({
          title: "Player created",
          description: `${firstName} ${lastName} has been added to the roster.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess(newPlayer);
        } else {
          router.push('/roster');
        }
      }
    } catch (error) {
      setErrors({ 
        general: `Failed to ${isEditing ? 'update' : 'create'} player: ${String(error)}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Position button component
  const PositionButton = ({ 
    position, 
    isSelected, 
    onClick, 
    isPrimary = true 
  }: { 
    position: Position; 
    isSelected: boolean; 
    onClick: () => void; 
    isPrimary?: boolean;
  }) => (
    <Button
      size="sm"
      variant={isSelected ? "solid" : "outline"}
      colorScheme={isSelected ? (isPrimary ? "primary" : "blue") : "gray"}
      onClick={onClick}
      mb={2}
    >
      {position}
    </Button>
  );
  
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
        
        {/* Basic Information */}
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Basic Information</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 6 }} spacing={4}>
            {/* First Name */}
            <FormControl isInvalid={!!errors.firstName} isRequired gridColumn={{ md: "span 3" }}>
              <FormLabel>First Name</FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <FormErrorMessage>{errors.firstName}</FormErrorMessage>}
            </FormControl>
            
            {/* Last Name */}
            <FormControl isInvalid={!!errors.lastName} isRequired gridColumn={{ md: "span 3" }}>
              <FormLabel>Last Name</FormLabel>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <FormErrorMessage>{errors.lastName}</FormErrorMessage>}
            </FormControl>
            
            {/* Jersey Number */}
            <FormControl isInvalid={!!errors.jerseyNumber} isRequired gridColumn={{ md: "span 2" }}>
              <FormLabel>Jersey Number</FormLabel>
              <Input
                type="number"
                min={0}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
              />
              {errors.jerseyNumber && <FormErrorMessage>{errors.jerseyNumber}</FormErrorMessage>}
            </FormControl>
            
            {/* Active Status */}
            <FormControl display="flex" alignItems="center" gridColumn={{ md: "span 4" }} pt={6}>
              <FormLabel htmlFor="active-status" mb="0">
                Active Player
              </FormLabel>
              <Switch
                id="active-status"
                isChecked={active}
                onChange={(e) => setActive(e.target.checked)}
                colorScheme="primary"
              />
            </FormControl>
          </SimpleGrid>
        </VStack>
        
        <Divider />
        
        {/* Positions */}
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Positions</Heading>
          
          {/* Primary Positions */}
          <FormControl isInvalid={!!errors.primaryPositions} isRequired>
            <FormLabel>Primary Positions</FormLabel>
            {errors.primaryPositions && <FormErrorMessage>{errors.primaryPositions}</FormErrorMessage>}
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={2}>
              {POSITIONS.map((position) => (
                <PositionButton
                  key={`primary-${position.value}`}
                  position={position.value}
                  isSelected={primaryPositions.includes(position.value)}
                  onClick={() => handlePrimaryPositionChange(position.value)}
                  isPrimary={true}
                />
              ))}
            </SimpleGrid>
          </FormControl>
          
          {/* Secondary Positions */}
          <FormControl>
            <FormLabel>Secondary Positions</FormLabel>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={2}>
              {POSITIONS.map((position) => (
                <PositionButton
                  key={`secondary-${position.value}`}
                  position={position.value}
                  isSelected={secondaryPositions.includes(position.value)}
                  onClick={() => handleSecondaryPositionChange(position.value)}
                  isPrimary={false}
                />
              ))}
            </SimpleGrid>
          </FormControl>
        </VStack>
        
        <Divider />
        
        {/* Notes */}
        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional information, playing preferences, etc."
            rows={3}
          />
        </FormControl>
        
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
            {isEditing ? 'Update' : 'Create'} Player
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}