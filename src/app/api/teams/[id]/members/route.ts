import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../auth/me/route';
import { TeamMembership } from '../../../../../models/team-membership';
import { User } from '../../../../../models/user';

/**
 * GET /api/teams/:id/members
 * Get team members with optional filtering
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
    
    // Get status filter from query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    
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

    // Find all memberships for this team with the specified status
    const memberships = await TeamMembership.find({ 
      teamId, 
      status: status === 'all' ? { $exists: true } : status 
    });
    
    // Get all user IDs from memberships
    const userIds = memberships.map(membership => membership.userId);
    
    // Find all users matching these IDs
    const users = await User.find({ _id: { $in: userIds } });
    
    // Map users to their memberships
    const members = memberships.map(membership => {
      const memberUser = users.find(u => u._id.toString() === membership.userId.toString());
      return {
        membership,
        user: memberUser ? {
          id: memberUser._id,
          name: memberUser.name,
          email: memberUser.email,
          firstName: memberUser.firstName,
          lastName: memberUser.lastName,
          avatarUrl: memberUser.avatarUrl
        } : null
      };
    });
    
    // Filter out any entries where we couldn't find the user
    const validMembers = members.filter(m => m.user !== null);

    return NextResponse.json({
      success: true,
      members: validMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}