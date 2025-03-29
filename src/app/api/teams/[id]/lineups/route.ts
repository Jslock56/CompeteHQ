import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../../services/auth/api-auth';
import { TeamMembership } from '../../../../../models/team-membership';
import { Permission } from '../../../../../models/user';

/**
 * GET /api/teams/[id]/lineups
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
      console.error('MongoDB connection failed when getting team lineups');
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get the team ID from route params
    const teamId = params.id;
    console.log(`Getting lineups for team: ${teamId}`);

    // Get user - In development mode, this will return a mock user
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Skip permission checks in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping permission check in development mode');
    } else if (user) {
      // Verify user is a member of the team
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
    }

    // Get the request type (game or non-game lineups)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let lineups;
    
    if (type === 'non-game') {
      // Get non-game lineups
      lineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
      console.log(`Retrieved ${lineups.length} non-game lineups for team ${teamId}`);
    } else if (type === 'game') {
      // Get game lineups (only for games related to this team)
      const games = await mongoDBService.getGamesByTeam(teamId);
      const gameIds = games.map(game => game.id);
      
      // Placeholder for game lineups functionality
      // This would require a method to get lineups by game IDs
      lineups = []; // TODO: Implement game lineups
    } else {
      // Get all lineups
      const nonGameLineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
      lineups = nonGameLineups; // For now, just return non-game lineups
    }

    return NextResponse.json({
      success: true,
      lineups
    });
  } catch (error) {
    console.error('Error fetching lineups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch lineups' },
      { status: 500 }
    );
  }
}