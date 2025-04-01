/**
 * API route for accessing player position history
 * GET /api/players/position-history?playerId=...&teamId=...&season=...
 * GET /api/players/position-history/team?teamId=...&season=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { positionHistoryService } from '../../../../services/position/position-history-service';
import { connectMongoDB } from '../../../../services/database/mongodb';

/**
 * Get position history for a specific player
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');
  const season = searchParams.get('season');

  // Check required parameters
  if (!playerId || !teamId) {
    return NextResponse.json({
      success: false,
      message: 'Missing required parameters: playerId and teamId are required',
    }, { status: 400 });
  }

  try {
    // Ensure MongoDB is connected
    await connectMongoDB();

    // Get position history
    const history = await positionHistoryService.getPlayerPositionHistory(
      playerId,
      teamId,
      season || undefined
    );

    // If player has no position history, return empty data with success
    if (!history) {
      return NextResponse.json({
        success: true,
        positionHistory: null,
        message: 'No position history found for this player',
      });
    }

    // Return successful response with position history
    return NextResponse.json({
      success: true,
      positionHistory: history,
    });
  } catch (error) {
    console.error('Error fetching position history:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching position history',
    }, { status: 500 });
  }
}