/**
 * API route for user login
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

// Import the connection manager
import { connectMongoDB } from '../../../../services/database/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();
    console.log("MongoDB connected in login route");
    
    const body = await request.json();
    const { email, password } = body;
    
    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Log in the user
    const result = await authService.login(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }
    
    // Set a cookie with the JWT token - cookies() must be awaited
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: result.token!,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });
    
    console.log("Login successful, token set in cookie");
    
    // Return user data without sensitive fields
    const { passwordHash, resetPasswordToken, verificationToken, ...safeUser } = result.user!;
    
    return NextResponse.json({
      success: true,
      message: result.message,
      user: safeUser,
      token: result.token // Include token in response
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}