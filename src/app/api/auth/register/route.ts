/**
 * API route for user registration
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

// Make sure MongoDB is connected
const connectDB = async () => {
  // Check if already connected
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // Get the MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

export async function POST(req: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectDB();
    
    // Parse request body
    const body = await req.json();
    const { email, password, name, invitationToken } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
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

    // If no invitation token, send verification email
    if (!invitationToken && result.user && !result.user.isEmailVerified) {
      // Get the JWT token from the registration result
      const token = result.token;

      // Send verification email
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'verification',
            userId: result.user._id,
            token: result.user.verificationToken
          })
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue registration process even if email sending fails
      }
    }

    // Set a cookie with the JWT token
    const cookieStore = cookies();
    cookieStore.set({
      name: 'auth_token',
      value: result.token!,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });

    // Return success with user data (excluding sensitive info)
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUserData } = result.user?.toObject() || {};
    
    return NextResponse.json({
      success: true,
      message: result.message,
      user: safeUserData,
      token: result.token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}