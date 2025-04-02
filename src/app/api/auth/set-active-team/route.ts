/**
 * API route to set the active team for the current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { User } from '../../../../models/user';
import { TeamMembership } from '../../../../models/team-membership';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

// Import MongoDB connection manager
import { connectMongoDB } from '../../../../services/database/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected first
    const connected = await connectMongoDB();
    if (!connected) {
      console.error('Set active team API: Failed to connect to MongoDB');
      return NextResponse.json({
        success: false,
        message: 'Database connection failed'
      }, { status: 500 });
    }
    
    // Get the request body to extract teamId
    const body = await request.json();
    const { teamId } = body;
    
    console.log('Set active team API called with teamId:', teamId);
    
    if (!teamId) {
      return NextResponse.json({
        success: false,
        message: 'Team ID is required'
      }, { status: 400 });
    }
    
    // Get current user using our enhanced getCurrentUser function
    const cookieStore = cookies();
    const currentUser = await import('../../../../services/auth/api-auth')
      .then(module => module.getCurrentUser(request, cookieStore));
    
    if (!currentUser) {
      console.error('Set active team API: No user found from auth token');
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    console.log(`Set active team API: Found user ${currentUser.email}`);
    
    // User is authenticated and properly loaded, proceed with operation
    
    // We already have the current user loaded, no need to fetch it again
    const user = currentUser;
    
    console.log('User teams:', user.teams);
    console.log('Team ID to set as active:', teamId);
    
    // First verify user is a member of this team
    if (!user.teams.includes(teamId)) {
      // Check the team memberships to ensure the relationship is valid
      const membership = await TeamMembership.findOne({ 
        userId: user._id, 
        teamId,
        status: 'active'
      });
      
      if (membership) {
        // Membership exists in the team-membership collection but not in user's teams
        // This is a data inconsistency, fix it by adding the team to the user's teams
        console.log('Fixing data inconsistency: Adding team to user.teams');
        user.teams.push(teamId);
      } else {
        // User doesn't have any relationship with this team
        return NextResponse.json({
          success: false,
          message: 'You are not a member of this team'
        }, { status: 403 });
      }
    }
    
    // Update active team
    user.activeTeamId = teamId;
    await user.save();
    
    console.log('Successfully updated active team for user');
    
    return NextResponse.json({
      success: true,
      message: 'Active team updated successfully',
      user: {
        id: user._id,
        email: user.email,
        activeTeamId: user.activeTeamId
      }
    });
  } catch (error) {
    console.error('Error updating active team:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while updating active team'
    }, { status: 500 });
  }
}