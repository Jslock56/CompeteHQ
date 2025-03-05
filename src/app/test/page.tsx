"use client";

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../../services/storage/enhanced-storage';
import { Team } from '../../types/team';

export default function TestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runTests = () => {
    const results: string[] = [];
    setError(null);
    
    try {
      // Test 1: Create team
      const teamId = uuidv4();
      const newTeam: Team = {
        id: teamId,
        name: "Test Team",
        ageGroup: "10U",
        season: "2023",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const saveResult = storageService.team.saveTeam(newTeam);
      results.push(`Team creation: ${saveResult ? "Success" : "Failed"}`);
      
      // Test 2: Get team
      const retrievedTeam = storageService.team.getTeam(teamId);
      results.push(`Team retrieval: ${retrievedTeam ? "Success" : "Failed"}`);
      
      // Test 3: Get all teams
      const allTeams = storageService.team.getAllTeams();
      results.push(`Get all teams: Found ${allTeams.length} teams`);
      
      // Test 4: Set current team
      const currentResult = storageService.team.setCurrentTeamId(teamId);
      results.push(`Set current team: ${currentResult ? "Success" : "Failed"}`);
      
      // Test 5: Get current team
      const currentTeamId = storageService.team.getCurrentTeamId();
      results.push(`Get current team: ${currentTeamId === teamId ? "Success" : "Failed"}`);
      
      // Test 6: Update team
      if (retrievedTeam) {
        const updatedTeam = {
          ...retrievedTeam,
          name: "Updated Team Name"
        };
        const updateResult = storageService.team.saveTeam(updatedTeam);
        results.push(`Team update: ${updateResult ? "Success" : "Failed"}`);
        
        // Verify update
        const afterUpdate = storageService.team.getTeam(teamId);
        results.push(`Verify update: ${afterUpdate?.name === "Updated Team Name" ? "Success" : "Failed"}`);
      }
      
      // Test 7: Delete team
      const deleteResult = storageService.team.deleteTeam(teamId);
      results.push(`Team deletion: ${deleteResult ? "Success" : "Failed"}`);
      
      // Verify deletion
      const afterDelete = storageService.team.getTeam(teamId);
      results.push(`Verify deletion: ${afterDelete === null ? "Success" : "Failed"}`);
      
      // Final verification
      const finalTeams = storageService.team.getAllTeams();
      results.push(`Final team count: ${finalTeams.length}`);
      
      setTestResults(results);
    } catch (err) {
      setError(`Test failed: ${String(err)}`);
      setTestResults(results);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Team Management Test Page</h1>
      
      <button 
        onClick={runTests}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Run Storage Tests
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Test Results</h2>
          <div className="border rounded overflow-hidden">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } ${
                  result.includes("Failed") ? 'text-red-600' : ''
                }`}
              >
                {index + 1}. {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}