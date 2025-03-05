"use client";

import React from 'react';
import Link from 'next/link';
import { Game } from '../../types/game';
import { format } from 'date-fns';

interface GameCardProps {
  /**
   * Game data to display
   */
  game: Game;
  
  /**
   * Whether to show additional actions
   */
  showActions?: boolean;
  
  /**
   * Callback when the delete button is clicked
   */
  onDelete?: (gameId: string) => void;
}

/**
 * Card component for displaying game information
 */
export default function GameCard({ game, showActions = true, onDelete }: GameCardProps) {
  // Format date from timestamp
  const gameDate = new Date(game.date);
  const formattedDate = format(gameDate, 'EEE, MMM d, yyyy');
  const formattedTime = format(gameDate, 'h:mm a');
  
  // Determine status styles
  const getStatusStyles = () => {
    switch (game.status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status for display
  const getStatusText = () => {
    switch (game.status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };
  
  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm(`Are you sure you want to delete this game against ${game.opponent}?`)) {
        onDelete(game.id);
      }
    }
  };
  
  // Check if the game has a lineup
  const hasLineup = Boolean(game.lineupId);
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              vs. {game.opponent}
            </h3>
            <div className="mt-1 text-sm text-gray-500">
              {formattedDate} at {formattedTime}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {game.location}
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}>
                {getStatusText()}
              </span>
              
              {game.status === 'scheduled' && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hasLineup ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasLineup ? 'Lineup Ready' : 'No Lineup'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showActions && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
          <Link
            href={`/games/${game.id}`}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            View Details
            <svg
              className="ml-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <div className="flex space-x-2">
            {game.status === 'scheduled' && !hasLineup && (
              <Link
                href={`/lineup/new?gameId=${game.id}`}
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </Link>
            )}
            <Link
              href={`/games/${game.id}/edit`}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}