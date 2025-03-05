"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '../../types/team';
import { useTeamContext } from '../../contexts/team-context';

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
 */
export default function TeamForm({ initialTeam, isEditing = false, onSuccess }: TeamFormProps) {
  const router = useRouter();
  const { createTeam, updateTeam, setCurrentTeam } = useTeamContext();
  
  // Form state
  const [name, setName] = useState(initialTeam?.name || '');
  const [ageGroup, setAgeGroup] = useState(initialTeam?.ageGroup || '');
  const [season, setSeason] = useState(initialTeam?.season || '');
  
  // Error state
  const [errors, setErrors] = useState<{
    name?: string;
    ageGroup?: string;
    season?: string;
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
          if (onSuccess) {
            onSuccess(initialTeam);
          } else {
            router.push('/teams');
          }
        } else {
          setErrors({ general: 'Failed to update team' });
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
        
        if (onSuccess) {
          onSuccess(newTeam);
        } else {
          router.push('/teams');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Team Name */}
        <div>
          <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
            Team Name
          </label>
          <input
            type="text"
            id="team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="e.g. Wildcats"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        {/* Age Group */}
        <div>
          <label htmlFor="age-group" className="block text-sm font-medium text-gray-700">
            Age Group
          </label>
          <select
            id="age-group"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.ageGroup ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
          >
            <option value="">Select Age Group</option>
            <option value="6U">6 & Under</option>
            <option value="8U">8 & Under</option>
            <option value="10U">10 & Under</option>
            <option value="12U">12 & Under</option>
            <option value="14U">14 & Under</option>
            <option value="16U">16 & Under</option>
            <option value="18U">18 & Under</option>
          </select>
          {errors.ageGroup && (
            <p className="mt-1 text-sm text-red-600">{errors.ageGroup}</p>
          )}
        </div>
        
        {/* Season */}
        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-700">
            Season
          </label>
          <input
            type="text"
            id="season"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.season ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="e.g. Spring 2023"
          />
          {errors.season && (
            <p className="mt-1 text-sm text-red-600">{errors.season}</p>
          )}
        </div>
      </div>
      
      {/* General Error Message */}
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            `${isEditing ? 'Update' : 'Create'} Team`
          )}
        </button>
      </div>
    </form>
  );
}