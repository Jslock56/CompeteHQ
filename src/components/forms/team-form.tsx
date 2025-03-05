// src/components/forms/team-form.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  FormErrorMessage,
  useToast,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { Team } from '../../types/team';
import { useTeamContext } from '../../contexts/team-context';

interface TeamFormProps {
  initialTeam?: Team;
  isEditing?: boolean;
  onSuccess?: (team: Team) => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  initialTeam,
  isEditing = false,
  onSuccess
}) => {
  const router = useRouter();
  const toast = useToast();
  const { createTeam, updateTeam, setCurrentTeam } = useTeamContext();
  
  // Form state
  const [name, setName] = useState(initialTeam?.name || '');
  const [ageGroup, setAgeGroup] = useState(initialTeam?.ageGroup || '');
  const [season, setSeason] = useState(initialTeam?.season || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({
    name: '',
    ageGroup: '',
    season: '',
    general: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({
      name: '',
      ageGroup: '',
      season: '',
      general: ''
    });
    
    // Validate form
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!name.trim()) {
      newErrors.name = 'Team name is required';
      isValid = false;
    }
    
    if (!ageGroup.trim()) {
      newErrors.ageGroup = 'Age group is required';
      isValid = false;
    }
    
    if (!season.trim()) {
      newErrors.season = 'Season is required';
      isValid = false;
    }
    
    if (!isValid) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialTeam) {
        // Update existing team
        const updated = updateTeam({
          ...initialTeam,
          name,
          ageGroup,
          season
        });
        
        if (updated) {
          toast({
            title: 'Team updated.',
            description: `${name} has been updated successfully.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          if (onSuccess) {
            onSuccess(initialTeam);
          } else {
            router.push('/teams');
          }
        } else {
          setErrors({ ...errors, general: 'Failed to update team' });
        }
      } else {
        // Create new team
        const newTeam = createTeam({
          name,
          ageGroup,
          season
        });
        
        // Set as current team
        setCurrentTeam(newTeam.id);
        
        toast({
          title: 'Team created.',
          description: `${name} has been created successfully.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess(newTeam);
        } else {
          router.push('/teams');
        }
      }
    } catch (error) {
      setErrors({ 
        ...errors,
        general: `Failed to ${isEditing ? 'update' : 'create'} team: ${String(error)}` 
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
        <VStack spacing={4} align="stretch">
          {/* Team Name */}
          <FormControl isInvalid={!!errors.name} isRequired>
            <FormLabel htmlFor="name">Team Name</FormLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wildcats"
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>
          
          {/* Age Group */}
          <FormControl isInvalid={!!errors.ageGroup} isRequired>
            <FormLabel htmlFor="ageGroup">Age Group</FormLabel>
            <Select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              placeholder="Select Age Group"
            >
              <option value="6U">6 & Under</option>
              <option value="8U">8 & Under</option>
              <option value="10U">10 & Under</option>
              <option value="12U">12 & Under</option>
              <option value="14U">14 & Under</option>
              <option value="16U">16 & Under</option>
              <option value="18U">18 & Under</option>
            </Select>
            <FormErrorMessage>{errors.ageGroup}</FormErrorMessage>
          </FormControl>
          
          {/* Season */}
          <FormControl isInvalid={!!errors.season} isRequired>
            <FormLabel htmlFor="season">Season</FormLabel>
            <Input
              id="season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g. Spring 2023"
            />
            <FormErrorMessage>{errors.season}</FormErrorMessage>
          </FormControl>
        </VStack>
        
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
            {isEditing ? 'Update' : 'Create'} Team
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default TeamForm;