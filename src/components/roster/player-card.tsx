"use client";

import React from 'react';
import Link from 'next/link';
import { Player, Position } from '../../types/player';

interface PlayerCardProps {
  /**
   * Player data to display
   */
  player: Player;
  
  /**
   * Whether to show additional actions
   */
  showActions?: boolean;
  
  /**
   * Callback when the delete button is clicked
   */
  onDelete?: (playerId: string) => void;
  
  /**
   * Callback when the toggle active button is clicked
   */
  onToggleActive?: (playerId: string) => void;
}

/**
 * Position badge component
 */
const PositionBadge: React.FC<{ position: Position; isPrimary?: boolean }> = ({ position, isPrimary = true }) => {
  return (
    <span 
      className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
        isPrimary ? 'text-white' : 'text-gray-700 bg-gray-200'
      } position-${position}`}
      title={position}
    >
      {position}
    </span>
  );
};

/**
 * Card component for displaying player information
 */
export default function PlayerCard({ player, showActions = true, onDelete, onToggleActive }: PlayerCardProps) {
  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm(`Are you sure you want to delete ${player.firstName} ${player.lastName}?`)) {
        onDelete(player.id);
      }
    }
  };
  
  const handleToggleActive = () => {
    if (onToggleActive) {
      onToggleActive(player.id);
    }
  };
  
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg border ${
      player.active ? 'border-gray-200' : 'border-gray-200 opacity-75'
    }`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          {/* Jersey Number */}
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-700 font-bold text-xl">
            {player.jerseyNumber}
          </div>
          
          {/* Player Info */}
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {player.firstName} {player.lastName}
            </h3>
            <div className="mt-1">
              {!player.active && (
                <span className="inline-flex items-center mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Positions */}
        <div className="mt-4">
          <div className="flex items-center">
            <h4 className="text-sm font-medium text-gray-500 mr-2">Primary:</h4>
            <div className="flex space-x-1">
              {player.primaryPositions.map((position) => (
                <PositionBadge 
                  key={`primary-${position}`} 
                  position={position} 
                  isPrimary={true}
                />
              ))}
              {player.primaryPositions.length === 0 && (
                <span className="text-sm text-gray-500">None</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center mt-1">
            <h4 className="text-sm font-medium text-gray-500 mr-2">Secondary:</h4>
            <div className="flex space-x-1">
              {player.secondaryPositions.map((position) => (
                <PositionBadge 
                  key={`secondary-${position}`} 
                  position={position} 
                  isPrimary={false}
                />
              ))}
              {player.secondaryPositions.length === 0 && (
                <span className="text-sm text-gray-500">None</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Notes (if any) */}
        {player.notes && (
          <div className="mt-4 text-sm text-gray-500">
            <p className="truncate">{player.notes}</p>
          </div>
        )}
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
          <Link
            href={`/roster/${player.id}`}
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
            <button
              type="button"
              onClick={handleToggleActive}
              className={`inline-flex items-center text-sm font-medium ${
                player.active 
                  ? 'text-yellow-600 hover:text-yellow-800' 
                  : 'text-green-600 hover:text-green-800'
              }`}
            >
              {player.active ? (
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            <Link
              href={`/roster/${player.id}/edit`}
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