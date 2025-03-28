/**
 * API route to approve a team join request
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../services/auth/auth-service';
import { teamService } from '../../../../../../services/auth/team-service';
import { Team } from '../../../../../../models/team';
import { User } from '../../../../../../models/user';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { valid, userId } = await authService.verifyToken(token);
    
    if (!valid || !userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { requestId, role, permissions } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Process the join request
    const result = await teamService.processJoinRequest(
      userId,
      requestId,
      'approve',
      role,
      permissions
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Send approval email notification if request was approved
    if (result.success && result.membership) {
      try {
        // Get team and user details
        const team = await Team.findOne({ id: result.membership.teamId });
        const user = await User.findById(result.membership.userId);

        if (team && user) {
          // Send join request approved email
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: 'join-approved',
              userId: user._id,
              teamName: team.name
            })
          });
        }
      } catch (emailError) {
        console.error('Failed to send join request approval email:', emailError);
        // Continue with the approval even if email sending fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Join request approved successfully',
      membership: result.membership
    });
  } catch (error) {
    console.error('Join request approval error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to approve join request' },
      { status: 500 }
    );
  }
}