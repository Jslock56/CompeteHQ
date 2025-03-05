"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useGames } from '../../hooks/use-games';
import { useTeamContext } from '../../contexts/team-context';
import { withTeam } from '../../contexts/team-context';
import GameList from '../../components/games/game-list';

/**
 * Games listing page component
 * Shows all games organized by upcoming and past
 */
function GamesPage() {
  const { currentTeam } = useTeamContext();
  const { 
    upcomingGames, 
    pastGames, 
    isLoading, 
    error, 
    deleteGame,
    refreshGames
  } = useGames();
  
  // State for filters and view options
  const [showPastGames, setShowPastGames] = useState(true);
  
  // Handle deleting a game
  const handleDeleteGame = (gameId: string) => {
    const success = deleteGame(gameId);
    if (success) {
      refreshGames();
    } else {
      alert('Failed to delete game');
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Games</h1>
          {currentTeam && (
            <p className="mt-1 text-sm text-gray-500">
              {currentTeam.name} · {currentTeam.ageGroup} · {currentTeam.season}
            </p>
          )}
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/games/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
            Add Game
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Upcoming Games */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Games</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {isLoading ? '-' : upcomingGames.length}
              </dd>
            </dl>
          </div>
        </div>
        
        {/* Past Games */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Past Games</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {isLoading ? '-' : pastGames.length}
              </dd>
            </dl>
          </div>
        </div>
        
        {/* Games with Lineups */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Games with Lineups</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {isLoading ? '-' : [...upcomingGames, ...pastGames].filter(game => game.lineupId).length}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="mt-6 bg-white shadow rounded-lg p-4 mb-6 flex justify-between">
        <div className="space-x-2">
          <button
            onClick={() => setShowPastGames(!showPastGames)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {showPastGames ? 'Hide Past Games' : 'Show Past Games'}
          </button>
        </div>
      </div>
      
      {/* Upcoming Games */}
      <GameList
        games={upcomingGames}
        title="Upcoming Games"
        isLoading={isLoading}
        error={error}
        onDeleteGame={handleDeleteGame}
        isUpcoming={true}
        teamId={currentTeam?.id}
      />
      
      {/* Past Games - conditionally shown */}
      {showPastGames && pastGames.length > 0 && (
        <GameList
          games={pastGames}
          title="Past Games"
          isLoading={isLoading}
          error={error}
          onDeleteGame={handleDeleteGame}
          isUpcoming={false}
          teamId={currentTeam?.id}
        />
      )}
    </div>
  );
}

// Wrap with withTeam HOC to ensure a team is selected
export default withTeam(GamesPage);