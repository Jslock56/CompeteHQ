"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Game } from '../../types/game';
import GameCard from './game-card';

interface GameListProps {
  /**
   * Games to display in the list
   */
  games: Game[];
  
  /**
   * Title for the list section
   */
  title: string;
  
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Error message to display (if any)
   */
  error?: string | null;
  
  /**
   * Called when a game is deleted
   */
  onDeleteGame?: (gameId: string) => void;
  
  /**
   * Whether this is displaying upcoming games
   */
  isUpcoming?: boolean;
  
  /**
   * Team ID (for creating new games)
   */
  teamId?: string;
  
  /**
   * Whether to show empty state
   */
  showEmptyState?: boolean;
}

/**
 * Component for displaying a list of games
 */
export default function GameList({
  games,
  title,
  isLoading = false,
  error = null,
  onDeleteGame,
  isUpcoming = false,
  teamId,
  showEmptyState = true,
}: GameListProps) {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter games based on search query
  const filteredGames = searchQuery.trim() 
    ? games.filter(game => 
        game.opponent.toLowerCase().includes(searchQuery.toLowerCase()) || 
        game.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : games;
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-32 rounded-lg"></div>
          ))}
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
  
  if (games.length === 0 && showEmptyState) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {isUpcoming && teamId && (
            <Link 
              href={`/games/new?teamId=${teamId}`} 
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg 
                className="h-4 w-4 mr-2" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Game
            </Link>
          )}
        </div>
        <div className="text-center py-12">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No games found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isUpcoming
              ? 'Get started by scheduling your first game.'
              : 'Past games will appear here when available.'}
          </p>
          {isUpcoming && teamId && (
            <div className="mt-6">
              <Link
                href={`/games/new?teamId=${teamId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg 
                  className="h-4 w-4 mr-2" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Game
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {isUpcoming && teamId && (
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <Link 
                href={`/games/new?teamId=${teamId}`} 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg 
                  className="-ml-1 mr-2 h-4 w-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Game
              </Link>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <div className="mt-1 relative rounded-md shadow-sm">
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
              placeholder="Search games by opponent or location..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      
      {filteredGames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No games match your search.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredGames.map((game) => (
            <div key={game.id} className="p-4">
              <GameCard
                game={game}
                onDelete={onDeleteGame}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}