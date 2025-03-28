/**
 * API route to create and send team invitations
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../services/auth/auth-service';
import { Permission } from '../../../../models/user';

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
    const { teamId, email, role, permissions } = body;

    if (!teamId || !email || !role) {
      return NextResponse.json(
        { success: false, message: 'Team ID, email, and role are required' },
        { status: 400 }
      );
    }

    // Create the invitation
    const inviteResult = await authService.createInvitation(
      userId,
      teamId,
      email,
      role as 'headCoach' | 'assistant' | 'fan',
      permissions as Permission[]
    );

    if (!inviteResult.success) {
      return NextResponse.json(
        { success: false, message: inviteResult.message },
        { status: 400 }
      );
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
        invitationId: inviteResult.invitation?._id
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      // If email sending fails, still return success but with a warning
      return NextResponse.json({
        success: true,
        warning: true,
        message: 'Invitation created but email could not be sent. You can resend the email later.',
        invitation: inviteResult.invitation
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: inviteResult.invitation
    });
  } catch (error) {
    console.error('Invitation creation error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    );
  }
}