"use client";

import React, { useState } from 'react';
import { useTeamContext } from '../../contexts/team-context';
import { usePlayers } from '../../hooks/use-players';
import { withTeam } from '../../contexts/team-context';
import { Position } from '../../types/player';
import PlayerList from '../../components/roster/player-list';

/**
 * Available filter positions
 */
const POSITION_FILTERS: { value: Position | 'all'; label: string }[] = [
  { value: 'all', label: 'All Positions' },
  { value: 'P', label: 'Pitchers' },
  { value: 'C', label: 'Catchers' },
  { value: '1B', label: 'First Base' },
  { value: '2B', label: 'Second Base' },
  { value: '3B', label: 'Third Base' },
  { value: 'SS', label: 'Shortstop' },
  { value: 'LF', label: 'Left Field' },
  { value: 'CF', label: 'Center Field' },
  { value: 'RF', label: 'Right Field' }
];

/**
 * Roster page component
 * Displays the team's roster with filtering options
 */
function RosterPage() {
  const { currentTeam } = useTeamContext();
  const { 
    players, 
    isLoading, 
    error, 
    deletePlayer, 
    togglePlayerActive,
    refreshPlayers
  } = usePlayers();
  
  // States for filters
  const [showInactive, setShowInactive] = useState(false);
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  
  // Handle position filter change
  const handlePositionFilterChange = (position: Position | 'all') => {
    setPositionFilter(position === 'all' ? null : position);
  };
  
  // Handle deleting a player
  const handleDeletePlayer = (playerId: string) => {
    const success = deletePlayer(playerId);
    if (success) {
      refreshPlayers();
    } else {
      alert('Failed to delete player');
    }
  };
  
  // Handle toggling player active status
  const handleToggleActive = (playerId: string) => {
    const success = togglePlayerActive(playerId);
    if (success) {
      refreshPlayers();
    } else {
      alert('Failed to update player status');
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Team Roster</h1>
          {currentTeam && (
            <p className="mt-1 text-sm text-gray-500">
              {currentTeam.name} · {currentTeam.ageGroup} · {currentTeam.season}
            </p>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Position filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <div className="flex flex-wrap gap-2">
              {POSITION_FILTERS.map((position) => (
                <button
                  key={position.value}
                  type="button"
                  onClick={() => handlePositionFilterChange(position.value)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    (position.value === 'all' && positionFilter === null) || positionFilter === position.value
                      ? 'bg-primary-100 text-primary-800 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {position.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Include inactive toggle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowInactive(!showInactive)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded ${
                showInactive
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showInactive ? (
                <svg 
                  className="h-5 w-5 mr-1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              ) : (
                <svg 
                  className="h-5 w-5 mr-1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              )}
              {showInactive ? 'Showing Inactive' : 'Show Inactive'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Player List */}
      <PlayerList
        players={players}
        isLoading={isLoading}
        error={error}
        onDeletePlayer={handleDeletePlayer}
        onToggleActive={handleToggleActive}
        showInactive={showInactive}
        positionFilter={positionFilter}
        teamId={currentTeam?.id}
      />
    </div>
  );
}

// Wrap with withTeam HOC to ensure a team is selected
export default withTeam(RosterPage);