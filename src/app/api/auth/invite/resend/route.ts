/**
 * API route to resend an invitation email
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../services/auth/auth-service';
import { Invitation } from '../../../../../models/invitation';
import { TeamMembership } from '../../../../../models/team-membership';
import { Permission } from '../../../../../models/user';

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
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { success: false, message: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if the user has permission to manage this team
    const userMembership = await TeamMembership.findOne({
      userId,
      teamId: invitation.teamId,
      status: 'active'
    });

    if (!userMembership || !userMembership.hasPermission(Permission.MANAGE_USERS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to manage invitations for this team' },
        { status: 403 }
      );
    }

    // Check if invitation is already used or expired
    if (invitation.used) {
      return NextResponse.json(
        { success: false, message: 'This invitation has already been used' },
        { status: 400 }
      );
    }

    if (invitation.isExpired()) {
      // If expired, refresh the expiration date
      invitation.expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      await invitation.save();
    }

    // Send the invitation email via the email API
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'invitation',
        invitationId: invitation._id
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email resent successfully'
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}