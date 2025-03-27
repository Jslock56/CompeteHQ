/**
 * API route for user registration
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, invitationToken } = body;
    
    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Register the user
    const result = await authService.register(email, password, name, invitationToken);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    // Set a cookie with the JWT token
    cookies().set({
      name: 'auth_token',
      value: result.token!,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });
    
    // Return user data without sensitive fields
    const { passwordHash, resetPasswordToken, verificationToken, ...safeUser } = result.user!;
    
    return NextResponse.json({
      success: true,
      message: result.message,
      user: safeUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}