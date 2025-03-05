"use client";

import React from 'react';
import Link from 'next/link';

// Mock data - this would come from your database in a real app
const upcomingGames = [
  {
    id: '1',
    opponent: 'Eagles',
    date: 'Mon, Mar 10 at 6:00 PM',
    location: 'Home Field',
    lineupStatus: 'ready'
  },
  {
    id: '2',
    opponent: 'Tigers',
    date: 'Mon, Mar 17 at 5:30 PM',
    location: 'Central Park',
    lineupStatus: 'notCreated'
  }
];

const recentGames = [
  {
    id: '3',
    opponent: 'Bears',
    date: 'Mon, Feb 24 at 6:00 PM',
    location: 'Home Field',
    result: { win: true, score: '7-4' }
  },
  {
    id: '4',
    opponent: 'Hawks',
    date: 'Mon, Feb 17 at 5:30 PM',
    location: 'Central Park',
    result: { win: false, score: '3-5' }
  }
];

const fairPlayMetrics = {
  overall: 86,
  playingTime: 92,
  positionVariety: 78
};

const playerAlerts = [
  { id: '1', player: 'Alex M.', alert: 'Needs infield experience', severity: 'high' },
  { id: '2', player: 'Jamie T.', alert: 'Hasn\'t played outfield', severity: 'medium' }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-4">
          <Link 
            href="/games/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            New Game
          </Link>
          <Link 
            href="/practices/new" 
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
          >
            New Practice
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link 
            href="#" 
            className="border-b-2 border-blue-500 text-blue-600 py-2 px-1 font-medium text-sm"
          >
            Overview
          </Link>
          <Link 
            href="#" 
            className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium text-sm"
          >
            Fair Play Metrics
          </Link>
          <Link 
            href="#" 
            className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium text-sm"
          >
            Team Status
          </Link>
        </nav>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Games */}
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-md shadow border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Upcoming Games</h2>
              <Link href="/games" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
            <div className="space-y-6">
              {upcomingGames.map(game => (
                <div key={game.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800">vs. {game.opponent}</h3>
                    {game.lineupStatus === 'ready' ? (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                        Lineup Ready
                      </span>
                    ) : (
                      <Link href={`/lineup/new?gameId=${game.id}`} 
                            className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full hover:bg-blue-200">
                        Create Lineup
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{game.date}</p>
                  <p className="text-sm text-gray-500">{game.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fair Play Metrics */}
        <div>
          <div className="bg-white p-4 rounded-md shadow border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Fair Play Metrics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Overall Score</span>
                  <span className="text-sm text-gray-600">{fairPlayMetrics.overall}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: `${fairPlayMetrics.overall}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Playing Time</span>
                  <span className="text-sm text-gray-600">{fairPlayMetrics.playingTime}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-green-600 rounded-full"
                    style={{ width: `${fairPlayMetrics.playingTime}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Position Variety</span>
                  <span className="text-sm text-gray-600">{fairPlayMetrics.positionVariety}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-purple-600 rounded-full"
                    style={{ width: `${fairPlayMetrics.positionVariety}%` }}
                  ></div>
                </div>
              </div>
              <Link href="/tracking" className="text-sm text-blue-600 hover:text-blue-800 inline-block mt-2">
                View detailed metrics
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-md shadow border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Recent Games</h2>
              <Link href="/games" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
            <div className="space-y-6">
              {recentGames.map(game => (
                <div key={game.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800">vs. {game.opponent}</h3>
                    <span className={`font-bold ${game.result.win ? 'text-green-600' : 'text-red-600'}`}>
                      {game.result.win ? 'W' : 'L'} {game.result.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{game.date}</p>
                  <p className="text-sm text-gray-500">{game.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Alerts */}
        <div>
          <div className="bg-white p-4 rounded-md shadow border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Player Alerts</h2>
            <div className="space-y-3">
              {playerAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-md ${alert.severity === 'high' ? 'bg-red-50' : 'bg-yellow-50'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-1 self-stretch ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'} rounded-l-md -ml-3 mr-2`}></div>
                    <div>
                      <p className="font-bold text-gray-900">{alert.player}</p>
                      <p className="text-sm text-gray-600">{alert.alert}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 bg-white p-4 rounded-md shadow border border-gray-200">
            <Link 
              href="/practice/new"
              className="w-full block text-center text-sm text-gray-700 py-2 px-4 rounded bg-gray-50 hover:bg-gray-100"
            >
              Generate Practice Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}