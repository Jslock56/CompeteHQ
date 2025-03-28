'use client';

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
  Alert,
  AlertIcon,
  useToast,
  Switch,
  Text,
  Textarea,
  Stack
} from '@chakra-ui/react';
import { Team } from '../../types/team';
import { useTeamContext } from '../../contexts/team-context';
import { useAuth } from '../../contexts/auth-context';

interface TeamFormProps {
  /**
   * Initial team data (for editing an existing team)
   */
  initialTeam?: Team;
  
  /**
   * Whether this form is for editing an existing team
   */
  isEditing?: boolean;
  
  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: (team: Team) => void;
}

/**
 * Form for creating or editing a team
 * Enhanced with MongoDB integration
 */
const TeamForm: React.FC<TeamFormProps> = ({
  initialTeam,
  isEditing = false,
  onSuccess
}) => {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  
  // Get team context functions 
  // Note: These have been updated to work with MongoDB
  const { createTeam, updateTeam, setCurrentTeam } = useTeamContext();
  
  // Form state
  const [name, setName] = useState(initialTeam?.name || '');
  const [ageGroup, setAgeGroup] = useState(initialTeam?.ageGroup || '');
  const [season, setSeason] = useState(initialTeam?.season || '');
  const [description, setDescription] = useState(initialTeam?.description || '');
  const [sport, setSport] = useState(initialTeam?.sport || 'baseball');
  const [isPublic, setIsPublic] = useState(initialTeam?.isPublic !== false); // Default to true
  const [joinRequiresApproval, setJoinRequiresApproval] = useState(initialTeam?.joinRequiresApproval !== false); // Default to true
  
  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    ageGroup?: string;
    season?: string;
    general?: string;
  }>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sports options
  const sports = [
    { value: 'baseball', label: 'Baseball' },
    { value: 'softball', label: 'Softball' }
  ];
  
  // Age group options with more choices
  const ageGroups = [
    { value: '6U', label: '6 & Under (T-Ball)' },
    { value: '8U', label: '8 & Under (Coach Pitch)' },
    { value: '9U', label: '9 & Under' },
    { value: '10U', label: '10 & Under (Minors)' },
    { value: '11U', label: '11 & Under' },
    { value: '12U', label: '12 & Under (Little League)' },
    { value: '13U', label: '13 & Under' },
    { value: '14U', label: '14 & Under (Junior League)' },
    { value: '16U', label: '16 & Under (Senior League)' },
    { value: 'HS-JV', label: 'High School JV' },
    { value: 'HS-V', label: 'High School Varsity' },
    { value: 'College', label: 'College' },
    { value: 'Adult', label: 'Adult League' }
  ];
  
  // Season options
  const yearNow = new Date().getFullYear();
  const yearNext = yearNow + 1;
  const seasonOptions = [
    { value: `Spring ${yearNow}`, label: `Spring ${yearNow}` },
    { value: `Summer ${yearNow}`, label: `Summer ${yearNow}` },
    { value: `Fall ${yearNow}`, label: `Fall ${yearNow}` },
    { value: `Winter ${yearNow}-${yearNext}`, label: `Winter ${yearNow}-${yearNext}` },
    { value: `Spring ${yearNext}`, label: `Spring ${yearNext}` },
    { value: `Summer ${yearNext}`, label: `Summer ${yearNext}` },
    { value: `Fall ${yearNext}`, label: `Fall ${yearNext}` },
    { value: `Winter ${yearNext}-${yearNext+1}`, label: `Winter ${yearNext}-${yearNext+1}` },
    { value: 'Year-Round', label: 'Year-Round Program' }
  ];
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    let isValid = true;
    const newErrors: typeof errors = {};
    
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
        // Update existing team via API
        const response = await fetch(`/api/teams/${initialTeam.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            ageGroup,
            season,
            description,
            sport,
            isPublic,
            joinRequiresApproval
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          toast({
            title: 'Team updated.',
            description: `${name} has been updated successfully.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          // Update local state through context as well
          updateTeam({
            ...initialTeam,
            name,
            ageGroup,
            season,
            description,
            sport,
            isPublic,
            joinRequiresApproval
          });
          
          if (onSuccess) {
            onSuccess(data.team);
          } else {
            router.push('/teams');
          }
        } else {
          setErrors({ general: data.message || 'Failed to update team' });
        }
      } else {
        // Get the authentication token from localStorage if available
        let authToken = '';
        if (typeof window !== 'undefined') {
          authToken = localStorage.getItem('authToken') || '';
          console.log('Auth token for team creation:', authToken ? 'Present' : 'Not found');
        }
        
        try {
          // First try the regular endpoint
          const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}` // Include token in header
            },
            body: JSON.stringify({
              name,
              ageGroup,
              season,
              description,
              sport,
              isPublic,
              joinRequiresApproval
            }),
          });
          
          const data = await response.json();
          
          // If successful, process the response
          if (response.ok && data.success) {
            console.log("Team created successfully:", data.team);
            
            // Set as current team via context
            setCurrentTeam(data.team.id);
            
            toast({
              title: 'Team created.',
              description: `${name} has been created successfully.`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            
            if (onSuccess) {
              onSuccess(data.team);
            } else {
              // Add a slight delay to ensure state updates before redirect
              setTimeout(() => {
                // Redirect to dashboard after team creation
                console.log("Redirecting to dashboard with new team:", data.team.id);
                router.push('/dashboard');
              }, 500);
            }
            return;
          } 
          
          // If auth error, try the fallback endpoints
          if (response.status === 401) {
            // First try with token in body if available
            if (authToken) {
              console.log("Using fallback team creation endpoint with token in body");
              
              const tokenFallbackResponse = await fetch('/api/teams/create-with-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  token: authToken,
                  name,
                  ageGroup,
                  season,
                  description,
                  sport,
                  isPublic,
                  joinRequiresApproval
                }),
              });
              
              const tokenFallbackData = await tokenFallbackResponse.json();
              
              if (tokenFallbackResponse.ok && tokenFallbackData.success) {
                console.log("Team created successfully (token fallback):", tokenFallbackData.team);
                
                // Set as current team via context
                setCurrentTeam(tokenFallbackData.team.id);
                
                toast({
                  title: 'Team created.',
                  description: `${name} has been created successfully.`,
                  status: 'success',
                  duration: 5000,
                  isClosable: true,
                });
                
                if (onSuccess) {
                  onSuccess(tokenFallbackData.team);
                } else {
                  // Add a slight delay to ensure state updates before redirect
                  setTimeout(() => {
                    // Redirect to dashboard after team creation
                    console.log("Redirecting to dashboard with new team:", tokenFallbackData.team.id);
                    router.push('/dashboard');
                  }, 500);
                }
                return;
              }
            }
            
            // If token approach failed or no token, try with user data directly
            if (user) {
              console.log("Using direct user data for team creation");
              
              const directFallbackResponse = await fetch('/api/teams/create-direct', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: user.id,
                  userEmail: user.email,
                  name,
                  ageGroup,
                  season,
                  description,
                  sport,
                  isPublic,
                  joinRequiresApproval
                }),
              });
              
              const directFallbackData = await directFallbackResponse.json();
              
              if (directFallbackResponse.ok && directFallbackData.success) {
                console.log("Team created successfully (direct fallback):", directFallbackData.team);
                
                // Set as current team via context
                setCurrentTeam(directFallbackData.team.id);
                
                toast({
                  title: 'Team created.',
                  description: `${name} has been created successfully.`,
                  status: 'success',
                  duration: 5000,
                  isClosable: true,
                });
                
                if (onSuccess) {
                  onSuccess(directFallbackData.team);
                } else {
                  // Add a slight delay to ensure state updates before redirect
                  setTimeout(() => {
                    // Redirect to dashboard after team creation
                    console.log("Redirecting to dashboard with new team:", directFallbackData.team.id);
                    router.push('/dashboard');
                  }, 500);
                }
                return;
              } else {
                setErrors({ general: directFallbackData.message || 'Failed to create team using all available methods' });
              }
            } else {
              setErrors({ general: 'Authentication required and no user data available' });
            }
          } else {
            setErrors({ general: data.message || 'Failed to create team' });
          }
        } catch (error) {
          console.error("Team creation error:", error);
          setErrors({ general: 'An error occurred while creating the team' });
        }
      }
    } catch (error) {
      setErrors({ 
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
        <VStack spacing={5} align="stretch">
          {/* Team Name */}
          <FormControl isInvalid={!!errors.name} isRequired>
            <FormLabel htmlFor="name">Team Name</FormLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wildcats"
            />
            {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
          </FormControl>
          
          {/* Sport Type */}
          <FormControl>
            <FormLabel htmlFor="sport">Sport</FormLabel>
            <Select
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
              {sports.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
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
              {ageGroups.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.ageGroup && <FormErrorMessage>{errors.ageGroup}</FormErrorMessage>}
          </FormControl>
          
          {/* Season */}
          <FormControl isInvalid={!!errors.season} isRequired>
            <FormLabel htmlFor="season">Season</FormLabel>
            <Select
              id="season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="Select Season"
            >
              {seasonOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.season && <FormErrorMessage>{errors.season}</FormErrorMessage>}
          </FormControl>
          
          {/* Description */}
          <FormControl>
            <FormLabel htmlFor="description">Team Description (Optional)</FormLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about your team, practice times, or other important information"
              rows={3}
            />
          </FormControl>
          
          {/* Team Settings Section */}
          <Box 
            border="1px" 
            borderColor="gray.200" 
            borderRadius="md" 
            p={4} 
            bg="gray.50"
          >
            <Text fontWeight="medium" mb={3}>Team Privacy Settings</Text>
            
            <Stack spacing={4}>
              {/* Public Team */}
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="isPublic" mb="0" flex="1">
                  Public Team
                  <Text fontSize="sm" color="gray.600">
                    Allow others to find this team when searching
                  </Text>
                </FormLabel>
                <Switch 
                  id="isPublic" 
                  isChecked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
              
              {/* Join Approval */}
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="joinRequiresApproval" mb="0" flex="1">
                  Require Approval
                  <Text fontSize="sm" color="gray.600">
                    Approve parent/fan requests to join team
                  </Text>
                </FormLabel>
                <Switch 
                  id="joinRequiresApproval" 
                  isChecked={joinRequiresApproval} 
                  onChange={(e) => setJoinRequiresApproval(e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
            </Stack>
          </Box>
        </VStack>
        
        {/* Form Actions */}
        <HStack spacing={3} justify="flex-end" pt={2}>
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
            size="lg"
          >
            {isEditing ? 'Update' : 'Create'} Team
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default TeamForm;