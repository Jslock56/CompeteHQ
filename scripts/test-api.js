/**
 * API Integration Test Script
 * 
 * This script tests the critical API endpoints in sequence to validate
 * the backend functionality of CompeteHQ.
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'apitest@example.com';
const TEST_PASSWORD = 'TestApi123!';
const TEST_USERNAME = 'API Test User';

// State that will be populated during test execution
let authToken;
let userId;
let teamId;
let teamCode;
let playerId;
let gameId;

// Utility for API requests with authentication
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  return await response.json();
}

// Test Runner
async function runTests() {
  console.log('🧪 Starting API Integration Tests');
  
  try {
    // 1. User Registration
    console.log('\n--- Testing User Registration ---');
    const registerResult = await apiRequest('/auth/register', 'POST', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_USERNAME
    });
    
    if (!registerResult.success) {
      // If user already exists, try login instead
      console.log('User may already exist, attempting login...');
    } else {
      console.log('✅ User Registration Success');
      authToken = registerResult.token;
      userId = registerResult.user.id;
    }
    
    // 2. User Login (in case registration failed due to existing user)
    if (!authToken) {
      console.log('\n--- Testing User Login ---');
      const loginResult = await apiRequest('/auth/login', 'POST', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      if (!loginResult.success) {
        throw new Error('Login failed: ' + loginResult.message);
      }
      
      console.log('✅ User Login Success');
      authToken = loginResult.token;
      userId = loginResult.user.id;
    }
    
    // 3. Get Current User
    console.log('\n--- Testing Get Current User ---');
    const meResult = await apiRequest('/auth/me');
    
    if (!meResult.success) {
      throw new Error('Get current user failed: ' + meResult.message);
    }
    
    console.log('✅ Get Current User Success');
    console.log(`User Details: ${meResult.user.name}, ${meResult.user.email}`);
    
    // 4. Create Team
    console.log('\n--- Testing Team Creation ---');
    const teamResult = await apiRequest('/teams', 'POST', {
      name: 'API Test Team',
      ageGroup: '12U',
      season: 'Spring 2025',
      description: 'Team created via API tests'
    });
    
    if (!teamResult.success) {
      throw new Error('Team creation failed: ' + teamResult.message);
    }
    
    console.log('✅ Team Creation Success');
    teamId = teamResult.team.id;
    console.log(`Team ID: ${teamId}`);
    
    // 5. Get Team Code
    console.log('\n--- Testing Team Code Generation ---');
    const codeResult = await apiRequest(`/teams/codes/generate?teamId=${teamId}`, 'POST');
    
    if (!codeResult.success) {
      throw new Error('Team code generation failed: ' + codeResult.message);
    }
    
    console.log('✅ Team Code Generation Success');
    teamCode = codeResult.code;
    console.log(`Team Code: ${teamCode}`);
    
    // 6. Create Player
    console.log('\n--- Testing Player Creation ---');
    const playerResult = await apiRequest('/teams/players', 'POST', {
      name: 'Test Player',
      jerseyNumber: '42',
      teamId: teamId,
      primaryPositions: ['pitcher', 'firstBase'],
      secondaryPositions: ['outfield'],
      active: true
    });
    
    if (!playerResult.success) {
      throw new Error('Player creation failed: ' + playerResult.message);
    }
    
    console.log('✅ Player Creation Success');
    playerId = playerResult.player.id;
    console.log(`Player ID: ${playerId}`);
    
    // 7. Get Players
    console.log('\n--- Testing Get Team Players ---');
    const playersResult = await apiRequest(`/teams/players?teamId=${teamId}`);
    
    if (!playersResult.success) {
      throw new Error('Get players failed: ' + playersResult.message);
    }
    
    console.log('✅ Get Team Players Success');
    console.log(`Players Count: ${playersResult.players.length}`);
    
    // 8. Create Game
    console.log('\n--- Testing Game Creation ---');
    const gameResult = await apiRequest('/teams/games', 'POST', {
      teamId: teamId,
      opponent: 'Test Opponents',
      date: Date.now() + 7 * 24 * 60 * 60 * 1000, // One week in the future
      location: 'Test Field',
      status: 'scheduled'
    });
    
    if (!gameResult.success) {
      throw new Error('Game creation failed: ' + gameResult.message);
    }
    
    console.log('✅ Game Creation Success');
    gameId = gameResult.game.id;
    console.log(`Game ID: ${gameId}`);
    
    // 9. Create Lineup
    console.log('\n--- Testing Lineup Creation ---');
    const lineupResult = await apiRequest('/teams/lineups', 'POST', {
      teamId: teamId,
      gameId: gameId,
      innings: [
        {
          inning: 1,
          positions: {
            pitcher: playerId,
            catcher: null,
            firstBase: null,
            secondBase: null,
            thirdBase: null,
            shortstop: null,
            leftField: null,
            centerField: null,
            rightField: null
          }
        }
      ]
    });
    
    if (!lineupResult.success) {
      throw new Error('Lineup creation failed: ' + lineupResult.message);
    }
    
    console.log('✅ Lineup Creation Success');
    const lineupId = lineupResult.lineup.id;
    console.log(`Lineup ID: ${lineupId}`);
    
    // 10. Update Player
    console.log('\n--- Testing Player Update ---');
    const playerUpdateResult = await apiRequest('/teams/players', 'PUT', {
      id: playerId,
      teamId: teamId,
      name: 'Updated Test Player',
      jerseyNumber: '43',
      primaryPositions: ['pitcher', 'firstBase', 'secondBase'],
      secondaryPositions: ['outfield'],
      active: true
    });
    
    if (!playerUpdateResult.success) {
      throw new Error('Player update failed: ' + playerUpdateResult.message);
    }
    
    console.log('✅ Player Update Success');
    
    // 11. Set Active Team
    console.log('\n--- Testing Set Active Team ---');
    const setActiveTeamResult = await apiRequest('/auth/set-active-team', 'POST', {
      teamId: teamId
    });
    
    if (!setActiveTeamResult.success) {
      throw new Error('Set active team failed: ' + setActiveTeamResult.message);
    }
    
    console.log('✅ Set Active Team Success');
    
    // 12. Get Team Memberships
    console.log('\n--- Testing Get Team Memberships ---');
    const membershipsResult = await apiRequest('/teams/memberships');
    
    if (!membershipsResult.success) {
      throw new Error('Get memberships failed: ' + membershipsResult.message);
    }
    
    console.log('✅ Get Team Memberships Success');
    console.log(`Memberships Count: ${membershipsResult.memberships.length}`);
    
    console.log('\n✅✅ All API Tests Passed Successfully! ✅✅');
    
  } catch (error) {
    console.error('\n❌ Test Failure:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);