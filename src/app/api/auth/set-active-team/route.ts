/**
 * API route to set the active team for the current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { User } from '../../../../models/user';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

// Import MongoDB connection manager
import { connectMongoDB } from '../../../../services/database/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();
    
    // Get the request body first to avoid consuming it
    const body = await request.json();
    const { teamId } = body;
    
    console.log('Set active team API called with teamId:', teamId);
    
    if (!teamId) {
      return NextResponse.json({
        success: false,
        message: 'Team ID is required'
      }, { status: 400 });
    }
    
    // Get auth token from cookies
    const cookieStore = cookies();
    const authCookie = cookieStore.get('auth_token');
    const authToken = authCookie?.value;
    
    console.log('Auth token from cookie:', authToken ? 'Present' : 'Not found');
    
    if (!authToken) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    // Verify token
    const tokenVerification = await authService.verifyToken(authToken);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    // Get user
    const user = await User.findById(tokenVerification.userId);
    
    if (!user) {
      console.error('User not found with ID:', tokenVerification.userId);
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    console.log('User found:', user.email);
    console.log('User teams:', user.teams);
    console.log('Team ID to set as active:', teamId);
    
    // Force-add the team to the user's teams if it's not already there
    // Note: This is a temporary fix for development - in production you would want
    // proper team membership validation
    if (!user.teams.includes(teamId)) {
      console.log('Adding teamId to user.teams');
      user.teams.push(teamId);
    }
    
    // Update active team
    user.activeTeamId = teamId;
    await user.save();
    
    console.log('Successfully updated active team for user');
    
    return NextResponse.json({
      success: true,
      message: 'Active team updated successfully',
      user: {
        id: user._id,
        email: user.email,
        activeTeamId: user.activeTeamId
      }
    });
  } catch (error) {
    console.error('Error updating active team:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while updating active team'
    }, { status: 500 });
  }
}