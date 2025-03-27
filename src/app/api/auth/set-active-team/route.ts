/**
 * API route to set the active team for the current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { User } from '../../../../models/user';
import { authService } from '../../../../services/auth/auth-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    // Get request body
    const { teamId } = await request.json();
    
    if (!teamId) {
      return NextResponse.json({
        success: false,
        message: 'Team ID is required'
      }, { status: 400 });
    }
    
    // Get user
    const user = await User.findById(tokenVerification.userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if user is a member of this team
    if (!user.teams.includes(teamId)) {
      return NextResponse.json({
        success: false,
        message: 'User is not a member of this team'
      }, { status: 403 });
    }
    
    // Update active team
    user.activeTeamId = teamId;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Active team updated successfully'
    });
  } catch (error) {
    console.error('Error updating active team:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while updating active team'
    }, { status: 500 });
  }
}