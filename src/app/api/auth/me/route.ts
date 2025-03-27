/**
 * API route to get current user's information
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const authToken = cookies().get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    const tokenVerification = await authService.verifyToken(authToken);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      // Clear invalid token
      cookies().delete('auth_token');
      
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    // Get user data
    const user = await authService.getUserById(tokenVerification.userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Return user data without sensitive fields
    const { passwordHash, resetPasswordToken, verificationToken, ...safeUser } = user;
    
    return NextResponse.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching user data'
    }, { status: 500 });
  }
}