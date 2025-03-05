"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
export default function GameForm({ initialGame, isEditing = false, onSuccess }: GameFormProps) {
  const router = useRouter();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
        {/* Opponent */}
        <div className="sm:col-span-3">
          <label htmlFor="opponent" className="block text-sm font-medium text-gray-700">
            Opponent
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.opponent ? 'border-red-300' : ''
              }`}
              placeholder="Opponent team name"
            />
            {errors.opponent && (
              <p className="mt-1 text-sm text-red-600">{errors.opponent}</p>
            )}
          </div>
        </div>
        
        {/* Date and Time */}
        <div className="sm:col-span-3">
          <label htmlFor="date-time" className="block text-sm font-medium text-gray-700">
            Date and Time
          </label>
          <div className="mt-1">
            <input
              type="datetime-local"
              id="date-time"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.dateTime ? 'border-red-300' : ''
              }`}
            />
            {errors.dateTime && (
              <p className="mt-1 text-sm text-red-600">{errors.dateTime}</p>
            )}
          </div>
        </div>
        
        {/* Location */}
        <div className="sm:col-span-4">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.location ? 'border-red-300' : ''
              }`}
              placeholder="e.g. Home Field, Central Park"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        </div>
        
        {/* Innings */}
        <div className="sm:col-span-2">
          <label htmlFor="innings" className="block text-sm font-medium text-gray-700">
            Innings
          </label>
          <div className="mt-1">
            <select
              id="innings"
              value={innings}
              onChange={(e) => setInnings(e.target.value)}
              className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.innings ? 'border-red-300' : ''
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            {errors.innings && (
              <p className="mt-1 text-sm text-red-600">{errors.innings}</p>
            )}
          </div>
        </div>
        
        {/* Status */}
        <div className="sm:col-span-3">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Game Status
          </label>
          <div className="mt-1">
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Game['status'])}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* General Error Message */}
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
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
            `${isEditing ? 'Update' : 'Create'} Game`
          )}
        </button>
      </div>
    </form>
  );
}