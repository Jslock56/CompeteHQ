"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Player, Position } from '../../types/player';
import PlayerCard from './player-card';

interface PlayerListProps {
  /**
   * Players to display in the list
   */
  players: Player[];
  
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Error message to display (if any)
   */
  error?: string | null;
  
  /**
   * Called when a player is deleted
   */
  onDeletePlayer?: (playerId: string) => void;
  
  /**
   * Called when a player's active status is toggled
   */
  onToggleActive?: (playerId: string) => void;
  
  /**
   * Whether to show inactive players (defaults to false)
   */
  showInactive?: boolean;
  
  /**
   * Filter by position (optional)
   */
  positionFilter?: Position | null;
  
  /**
   * Team ID (for creating new players)
   */
  teamId?: string;
}

/**
 * Component for displaying a list of players
 */
export default function PlayerList({
  players,
  isLoading = false,
  error = null,
  onDeletePlayer,
  onToggleActive,
  showInactive = false,
  positionFilter = null,
  teamId
}: PlayerListProps) {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter players based on active status, position filter, and search query
  const filteredPlayers = useMemo(() => {
    // Apply active filter
    let result = showInactive ? players : players.filter(player => player.active);
    
    // Apply position filter if specified
    if (positionFilter) {
      result = result.filter(player => 
        player.primaryPositions.includes(positionFilter) || 
        player.secondaryPositions.includes(positionFilter)
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(player => 
        player.firstName.toLowerCase().includes(query) || 
        player.lastName.toLowerCase().includes(query) ||
        player.jerseyNumber.toString().includes(query)
      );
    }
    
    // Sort by jersey number
    return result.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }, [players, showInactive, positionFilter, searchQuery]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
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
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Search input */}
          <div className="flex-1">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search players..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          {/* Create Player button */}
          <div>
            <Link
              href={teamId ? `/roster/new?teamId=${teamId}` : '/roster/new'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Player
            </Link>
          </div>
        </div>
      </div>
      
      {/* Player Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Players</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{players.length}</dd>
            </dl>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Active Players</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {players.filter(p => p.active).length}
              </dd>
            </dl>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Pitchers</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {players.filter(p => p.primaryPositions.includes('P')).length}
              </dd>
            </dl>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Catchers</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {players.filter(p => p.primaryPositions.includes('C')).length}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Players list */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No players found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {players.length === 0
              ? 'Get started by creating a new player.'
              : 'Try adjusting your search or filters.'}
          </p>
          {players.length === 0 && (
            <div className="mt-6">
              <Link
                href={teamId ? `/roster/new?teamId=${teamId}` : '/roster/new'}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Player
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onDelete={onDeletePlayer}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}