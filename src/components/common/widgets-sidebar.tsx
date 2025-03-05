// src/components/common/widgets-sidebar.tsx
"use client";

import React, { useState } from 'react';

// Sample widget components - you can customize these
const PlayerStatsWidget = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
    <h3 className="text-sm font-medium text-gray-700 mb-2">Player Stats</h3>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Total Players</span>
        <span className="text-sm font-semibold">14</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Active Players</span>
        <span className="text-sm font-semibold">12</span>
      </div>
    </div>
  </div>
);

const UpcomingGameWidget = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
    <h3 className="text-sm font-medium text-gray-700 mb-2">Next Game</h3>
    <div className="text-xs">
      <p className="font-medium">vs. Eagles</p>
      <p className="text-gray-500">Saturday, Mar 15 at 3:00 PM</p>
      <p className="text-gray-500">Home Field</p>
    </div>
  </div>
);

const FairPlayWidget = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
    <h3 className="text-sm font-medium text-gray-700 mb-2">Fair Play Metrics</h3>
    <div className="space-y-2">
      <div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Overall</span>
          <span>85%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full mt-1">
          <div className="h-1.5 bg-primary-500 rounded-full" style={{width: '85%'}}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Playing Time</span>
          <span>92%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full mt-1">
          <div className="h-1.5 bg-green-500 rounded-full" style={{width: '92%'}}></div>
        </div>
      </div>
    </div>
  </div>
);

const WidgetsSidebar = () => {
  const [widgets, setWidgets] = useState([
    { id: 'player-stats', component: <PlayerStatsWidget />, enabled: true },
    { id: 'upcoming-game', component: <UpcomingGameWidget />, enabled: true },
    { id: 'fair-play', component: <FairPlayWidget />, enabled: true },
  ]);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === id ? {...widget, enabled: !widget.enabled} : widget
    ));
  };

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-700">Widgets</h2>
        <button className="text-xs text-primary-600 hover:text-primary-800">Customize</button>
      </div>
      
      {widgets.filter(w => w.enabled).map(widget => (
        <React.Fragment key={widget.id}>
          {widget.component}
        </React.Fragment>
      ))}
      
      {/* Widget management section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-xs font-medium text-gray-500 mb-2">Manage Widgets</h3>
        {widgets.map(widget => (
          <div key={widget.id} className="flex items-center py-1">
            <input
              type="checkbox"
              id={`widget-${widget.id}`}
              checked={widget.enabled}
              onChange={() => toggleWidget(widget.id)}
              className="h-3 w-3 text-primary-600 rounded"
            />
            <label htmlFor={`widget-${widget.id}`} className="ml-2 text-xs text-gray-600">
              {widget.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetsSidebar;