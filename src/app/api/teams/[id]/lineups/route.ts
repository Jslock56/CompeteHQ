import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../auth/me/route';
import { TeamMembership } from '../../../../../models/team-membership';
import { Permission } from '../../../../../models/user';

/**
 * GET /api/teams/:id/lineups
 * Get all lineups for a team
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
    
    // Get lineup type from query parameters (game or non-game)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
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
    
    // Check if user has permission to view lineups
    if (!userMembership.permissions.includes(Permission.VIEW_STATS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to view lineups' },
        { status: 403 }
      );
    }

    let lineups = [];
    
    // Get lineups based on the requested type
    if (type === 'game' || type === 'all') {
      // Get all games for this team to find game lineups
      const games = await mongoDBService.getGamesByTeam(teamId);
      const gameLineups = [];
      
      // For each game, fetch its lineup if it exists
      for (const game of games) {
        if (game.lineupId) {
          const lineup = await mongoDBService.getLineup(game.lineupId);
          if (lineup) {
            gameLineups.push(lineup);
          }
        }
      }
      
      if (type === 'game') {
        lineups = gameLineups;
      } else {
        lineups = [...gameLineups];
      }
    }
    
    if (type === 'non-game' || type === 'all') {
      // Get non-game lineups
      const nonGameLineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
      
      if (type === 'non-game') {
        lineups = nonGameLineups;
      } else {
        lineups = [...lineups, ...nonGameLineups];
      }
    }
    
    // Sort lineups by updated date (newest first)
    lineups.sort((a, b) => b.updatedAt - a.updatedAt);

    return NextResponse.json({
      success: true,
      lineups
    });
  } catch (error) {
    console.error('Error fetching team lineups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team lineups' },
      { status: 500 }
    );
  }
}