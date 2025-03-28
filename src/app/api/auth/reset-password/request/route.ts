/**
 * API route to request a password reset
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../services/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Request password reset
    const result = await authService.requestPasswordReset(email);

    // If successful and user exists, send reset email
    if (result.success && result.user) {
      try {
        // Create a temporary token for API access
        const tempToken = authService.createTemporaryToken(result.user.id);
        
        // Send password reset email
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`
          },
          body: JSON.stringify({
            type: 'password-reset',
            userId: result.user._id,
            token: result.user.resetPasswordToken
          })
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue with the request even if email sending fails
      }
    }

    // Always return the same message for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { success: false, message: 'Password reset request failed' },
      { status: 500 }
    );
  }
}