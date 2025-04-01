/**
 * API route for accessing team-wide position histories
 * GET /api/players/position-history/team?teamId=...&season=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { positionHistoryService } from '../../../../../services/position/position-history-service';
import { connectMongoDB } from '../../../../../services/database/mongodb';

/**
 * Get position histories for all players in a team
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');
  const season = searchParams.get('season');

  // Check required parameters
  if (!teamId) {
    return NextResponse.json({
      success: false,
      message: 'Missing required parameter: teamId is required',
    }, { status: 400 });
  }

  try {
    // Ensure MongoDB is connected
    await connectMongoDB();

    // Get position histories for the team
    const histories = await positionHistoryService.getTeamPositionHistories(
      teamId,
      season || undefined
    );

    // Return successful response with position histories
    return NextResponse.json({
      success: true,
      positionHistories: histories,
    });
  } catch (error) {
    console.error('Error fetching team position histories:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching team position histories',
    }, { status: 500 });
  }
}