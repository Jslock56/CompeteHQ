/**
 * API route to get current user's information
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

// Import MongoDB connection manager
import { connectMongoDB } from '../../../../services/database/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();
    
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock user
        console.log('API /me: Returning mock user for development');
        return NextResponse.json({
          success: true,
          user: {
            _id: '123456789',
            id: '123456789',
            email: 'dev@example.com',
            name: 'Dev User',
            teams: ['773a9421-07e8-45e8-8f77-4a6943c7d1d8'],
            activeTeamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
            isEmailVerified: true,
            createdAt: Date.now()
          }
        });
      }
      
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    const tokenVerification = await authService.verifyToken(authToken);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      // Clear invalid token
      const cookieStore = await cookies();
      cookieStore.delete('auth_token');
      
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
    
    if (process.env.NODE_ENV !== 'production') {
      // For development, return a mock user in case of errors
      console.log('API /me: Returning mock user for development due to error');
      return NextResponse.json({
        success: true,
        user: {
          _id: '123456789',
          id: '123456789',
          email: 'dev@example.com',
          name: 'Dev User',
          teams: ['773a9421-07e8-45e8-8f77-4a6943c7d1d8'],
          activeTeamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
          isEmailVerified: true,
          createdAt: Date.now()
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching user data'
    }, { status: 500 });
  }
}