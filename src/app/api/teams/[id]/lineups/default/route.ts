import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../auth/me/route';
import { TeamMembership } from '../../../../../../models/team-membership';
import { Permission } from '../../../../../../models/user';

/**
 * POST /api/teams/:id/lineups/default
 * Set a lineup as the default for a team
 */
export async function POST(
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
    
    // Get lineup ID from request body
    const { lineupId } = await request.json();
    
    if (!lineupId) {
      return NextResponse.json(
        { success: false, message: 'Lineup ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Check if user has permission to edit lineups
    if (!userMembership.permissions.includes(Permission.EDIT_LINEUPS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to set default lineup' },
        { status: 403 }
      );
    }

    // Verify the lineup exists and belongs to this team
    const lineup = await mongoDBService.getLineup(lineupId);
    if (!lineup) {
      return NextResponse.json(
        { success: false, message: 'Lineup not found' },
        { status: 404 }
      );
    }
    
    if (lineup.teamId !== teamId) {
      return NextResponse.json(
        { success: false, message: 'Lineup does not belong to this team' },
        { status: 400 }
      );
    }
    
    // Set the lineup as default
    const success = await mongoDBService.setDefaultTeamLineup(lineupId, teamId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to set default lineup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Default lineup set successfully'
    });
  } catch (error) {
    console.error('Error setting default lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set default lineup' },
      { status: 500 }
    );
  }
}