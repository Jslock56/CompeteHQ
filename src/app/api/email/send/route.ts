/**
 * API route to handle email sending requests
 */
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../../services/email/email-service';
import { authService } from '../../../../services/auth/auth-service';
import { User } from '../../../../models/user';
import { Invitation } from '../../../../models/invitation';

/**
 * Send an invitation email
 */
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

    // Parse the request body
    const body = await req.json();
    const { type, invitationId, userId: targetUserId, token: emailToken, teamName } = body;

    // Handle different email types
    switch (type) {
      case 'invitation': {
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

        // Send the invitation email
        const sent = await emailService.sendInvitationEmail(invitation);
        return NextResponse.json({ success: sent, message: sent ? 'Invitation email sent' : 'Failed to send invitation email' });
      }

      case 'verification': {
        if (!targetUserId || !emailToken) {
          return NextResponse.json(
            { success: false, message: 'User ID and token are required' },
            { status: 400 }
          );
        }

        // Find the user
        const user = await User.findById(targetUserId);
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        // Send the verification email
        const sent = await emailService.sendVerificationEmail(user, emailToken);
        return NextResponse.json({ success: sent, message: sent ? 'Verification email sent' : 'Failed to send verification email' });
      }

      case 'password-reset': {
        if (!targetUserId || !emailToken) {
          return NextResponse.json(
            { success: false, message: 'User ID and token are required' },
            { status: 400 }
          );
        }

        // Find the user
        const user = await User.findById(targetUserId);
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        // Send the password reset email
        const sent = await emailService.sendPasswordResetEmail(user, emailToken);
        return NextResponse.json({ success: sent, message: sent ? 'Password reset email sent' : 'Failed to send password reset email' });
      }

      case 'team-added': {
        if (!targetUserId || !teamName) {
          return NextResponse.json(
            { success: false, message: 'User ID and team name are required' },
            { status: 400 }
          );
        }

        // Find the user
        const user = await User.findById(targetUserId);
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        // Send the team added email
        const sent = await emailService.sendTeamAddedEmail(user, teamName);
        return NextResponse.json({ success: sent, message: sent ? 'Team added email sent' : 'Failed to send team added email' });
      }

      case 'join-approved': {
        if (!targetUserId || !teamName) {
          return NextResponse.json(
            { success: false, message: 'User ID and team name are required' },
            { status: 400 }
          );
        }

        // Find the user
        const user = await User.findById(targetUserId);
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        // Send the join request approved email
        const sent = await emailService.sendJoinRequestApprovedEmail(user, teamName);
        return NextResponse.json({ success: sent, message: sent ? 'Join request approved email sent' : 'Failed to send join request approved email' });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid email type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Email sending failed' },
      { status: 500 }
    );
  }
}