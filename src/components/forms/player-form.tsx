"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          {/* First Name */}
          <div className="sm:col-span-3">
            <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          {/* Last Name */}
          <div className="sm:col-span-3">
            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
          
          {/* Jersey Number */}
          <div className="sm:col-span-2">
            <label htmlFor="jersey-number" className="block text-sm font-medium text-gray-700">
              Jersey Number
            </label>
            <input
              type="number"
              id="jersey-number"
              min="0"
              max="99"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.jerseyNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            {errors.jerseyNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.jerseyNumber}</p>
            )}
          </div>
          
          {/* Active Status */}
          <div className="sm:col-span-4">
            <div className="flex items-center pt-5">
              <input
                id="active"
                name="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
                Active Player
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Positions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Positions</h3>
        
        {/* Primary Positions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Positions
          </label>
          {errors.primaryPositions && (
            <p className="mb-2 text-sm text-red-600">{errors.primaryPositions}</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {POSITIONS.map((position) => (
              <button
                key={`primary-${position.value}`}
                type="button"
                onClick={() => handlePrimaryPositionChange(position.value)}
                className={`px-3 py-2 border rounded text-sm font-medium ${
                  primaryPositions.includes(position.value)
                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {position.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Secondary Positions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Positions
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {POSITIONS.map((position) => (
              <button
                key={`secondary-${position.value}`}
                type="button"
                onClick={() => handleSecondaryPositionChange(position.value)}
                className={`px-3 py-2 border rounded text-sm font-medium ${
                  secondaryPositions.includes(position.value)
                    ? 'bg-secondary-100 text-secondary-800 border-secondary-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {position.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Additional information, playing preferences, etc."
        />
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
            `${isEditing ? 'Update' : 'Create'} Player`
          )}
        </button>
      </div>
    </form>
  );
}