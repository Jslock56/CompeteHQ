import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectMongoDB } from '../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../services/auth/api-auth';
import { TeamMembership } from '../../../../models/team-membership';

/**
 * GET /api/teams/:id
 * Get detailed information about a specific team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    try {
      await connectMongoDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const cookieStore = await cookies();
    const user = await getCurrentUser(request, cookieStore);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get team ID from route params - await params to properly access its properties
    const teamParams = await params;
    const teamId = Array.isArray(teamParams.id) ? teamParams.id[0] : teamParams.id;
    
    // Import Team model
    const { Team } = await import('../../../../models/team');
    
    // Fetch the team
    const team = await Team.findOne({ id: teamId });
    if (!team) {
      return NextResponse.json(
        { success: false, message: 'Team not found' },
        { status: 404 }
      );
    }

    // Get user's membership for this team
    const memberships = await TeamMembership.find({ userId: user._id, teamId, status: 'active' });
    const userMembership = memberships.length > 0 ? memberships[0] : null;

    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // Return team with user's membership details
    return NextResponse.json({
      success: true,
      team,
      userMembership
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team details' },
      { status: 500 }
    );
  }
}