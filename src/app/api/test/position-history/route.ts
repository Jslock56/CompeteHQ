/**
 * Test endpoint for position history functionality
 * This is only for development and testing purposes
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { positionHistoryService } from '../../../../services/position/position-history-service';
import { connectMongoDB } from '../../../../services/database/mongodb';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      message: 'Test endpoint is not available in production'
    }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'test';

  try {
    // Ensure MongoDB is connected
    await connectMongoDB();

    switch (action) {
      case 'create':
        return await handleCreateTest();
      case 'get':
        return await handleGetTest(searchParams);
      case 'team':
        return await handleTeamTest(searchParams);
      default:
        return await handleBasicTest();
    }
  } catch (error) {
    console.error('Error in position history test:', error);
    return NextResponse.json({
      success: false,
      message: 'Error running position history test',
      error: String(error)
    }, { status: 500 });
  }
}

/**
 * Basic test to check if position history service is working
 */
async function handleBasicTest() {
  // Create test data
  const playerId = `test_player_${uuidv4()}`;
  const teamId = `test_team_${uuidv4()}`;
  const season = new Date().getFullYear().toString();

  // Create a mock position history
  const mockHistory = {
    id: `ph_${playerId}`,
    playerId,
    teamId,
    season,
    gamesPlayed: [`game_${uuidv4()}`, `game_${uuidv4()}`],
    metrics: {
      season: createMockMetrics(10, 20),
      last5Games: createMockMetrics(5, 10),
      last3Games: createMockMetrics(3, 6),
      lastGame: createMockMetrics(1, 2)
    },
    updatedAt: Date.now()
  };

  // Save the mock history
  const saved = await positionHistoryService.savePositionHistory(mockHistory);

  // Get the saved history
  const retrieved = await positionHistoryService.getPlayerPositionHistory(
    playerId,
    teamId,
    season
  );

  // Clean up test data
  await positionHistoryService.deletePositionHistory(playerId, teamId, season);

  return NextResponse.json({
    success: true,
    message: 'Position history test completed successfully',
    saved,
    retrieved,
    consistency: JSON.stringify(retrieved) === JSON.stringify(mockHistory)
  });
}

/**
 * Test creating a new position history
 */
async function handleCreateTest() {
  // Create test data
  const playerId = `test_player_${uuidv4()}`;
  const teamId = `test_team_${uuidv4()}`;
  const season = new Date().getFullYear().toString();

  // Create a mock position history
  const mockHistory = {
    id: `ph_${playerId}`,
    playerId,
    teamId,
    season,
    gamesPlayed: [`game_${uuidv4()}`, `game_${uuidv4()}`],
    metrics: {
      season: createMockMetrics(10, 20),
      last5Games: createMockMetrics(5, 10),
      last3Games: createMockMetrics(3, 6),
      lastGame: createMockMetrics(1, 2)
    },
    updatedAt: Date.now()
  };

  // Save the mock history
  const saved = await positionHistoryService.savePositionHistory(mockHistory);

  return NextResponse.json({
    success: true,
    message: 'Position history created successfully',
    positionHistory: mockHistory,
    saved,
    testIds: {
      playerId,
      teamId,
      season
    }
  });
}

/**
 * Test getting a position history
 */
async function handleGetTest(searchParams: URLSearchParams) {
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');
  const season = searchParams.get('season') || new Date().getFullYear().toString();

  if (!playerId || !teamId) {
    return NextResponse.json({
      success: false,
      message: 'Missing required parameters: playerId and teamId'
    }, { status: 400 });
  }

  // Get the position history
  const history = await positionHistoryService.getPlayerPositionHistory(
    playerId,
    teamId,
    season
  );

  return NextResponse.json({
    success: true,
    message: history ? 'Position history retrieved successfully' : 'No position history found',
    positionHistory: history
  });
}

/**
 * Test getting team position histories
 */
async function handleTeamTest(searchParams: URLSearchParams) {
  const teamId = searchParams.get('teamId');
  const season = searchParams.get('season') || new Date().getFullYear().toString();

  if (!teamId) {
    return NextResponse.json({
      success: false,
      message: 'Missing required parameter: teamId'
    }, { status: 400 });
  }

  // Get the position histories
  const histories = await positionHistoryService.getTeamPositionHistories(
    teamId,
    season
  );

  return NextResponse.json({
    success: true,
    message: 'Team position histories retrieved successfully',
    count: histories.length,
    positionHistories: histories
  });
}

/**
 * Create mock metrics for testing
 */
function createMockMetrics(gamesPlayed: number, totalInnings: number) {
  const positionCounts: Record<string, number> = {
    'P': Math.floor(Math.random() * 10),
    'C': Math.floor(Math.random() * 10),
    '1B': Math.floor(Math.random() * 10),
    '2B': Math.floor(Math.random() * 10),
    '3B': Math.floor(Math.random() * 10),
    'SS': Math.floor(Math.random() * 10),
    'LF': Math.floor(Math.random() * 10),
    'CF': Math.floor(Math.random() * 10),
    'RF': Math.floor(Math.random() * 10),
    'DH': Math.floor(Math.random() * 10),
    'BN': Math.floor(Math.random() * 10)
  };

  // Calculate percentages
  const totalCount = Object.values(positionCounts).reduce((sum, count) => sum + count, 0);
  const positionPercentages: Record<string, number> = {};
  
  Object.entries(positionCounts).forEach(([pos, count]) => {
    positionPercentages[pos] = totalCount > 0 ? (count / totalCount) * 100 : 0;
  });

  // Create positon type counts and percentages
  const positionTypeCounts: Record<string, number> = {
    'pitcher': positionCounts['P'],
    'catcher': positionCounts['C'],
    'infield': positionCounts['1B'] + positionCounts['2B'] + positionCounts['3B'] + positionCounts['SS'],
    'outfield': positionCounts['LF'] + positionCounts['CF'] + positionCounts['RF'],
    'bench': positionCounts['BN'],
    'dh': positionCounts['DH']
  };

  const positionTypePercentages: Record<string, number> = {};
  
  Object.entries(positionTypeCounts).forEach(([type, count]) => {
    positionTypePercentages[type] = totalCount > 0 ? (count / totalCount) * 100 : 0;
  });

  return {
    positionCounts,
    positionPercentages,
    positionTypeCounts,
    positionTypePercentages,
    benchPercentage: positionPercentages['BN'] || 0,
    varietyScore: Math.floor(Math.random() * 100),
    consecutiveBench: Math.floor(Math.random() * 5),
    benchStreak: {
      current: Math.floor(Math.random() * 3),
      max: Math.floor(Math.random() * 5)
    },
    needsInfield: Math.random() > 0.5,
    needsOutfield: Math.random() > 0.5,
    totalInnings,
    gamesPlayed,
    playingTimePercentage: 100 - (positionPercentages['BN'] || 0),
    samePositionStreak: {
      position: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'BN'][Math.floor(Math.random() * 11)],
      count: Math.floor(Math.random() * 5)
    }
  };
}