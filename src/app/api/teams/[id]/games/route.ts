import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../auth/me/route';
import { TeamMembership } from '../../../../../models/team-membership';
import { Permission } from '../../../../../models/user';

/**
 * GET /api/teams/:id/games
 * Get all games for a team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const user = await getCurrentUser(request, cookies());
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get team ID from route params
    const teamId = params.id;
    
    // Verify user is a member of this team
    const userMembership = await TeamMembership.findOne({ 
      userId: user._id, 
      teamId, 
      status: 'active' 
    });
    
    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this team' },
        { status: 403 }
      );
    }
    
    // Check if user has permission to view the schedule
    if (!userMembership.permissions.includes(Permission.VIEW_SCHEDULE)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to view the schedule' },
        { status: 403 }
      );
    }

    // Get games for this team
    const games = await mongoDBService.getGamesByTeam(teamId);
    
    // Sort games by date (newest first)
    games.sort((a, b) => b.date - a.date);

    return NextResponse.json({
      success: true,
      games
    });
  } catch (error) {
    console.error('Error fetching team games:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team games' },
      { status: 500 }
    );
  }
}