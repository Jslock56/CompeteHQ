/**
 * API route for team operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../services/auth/auth-service';
import { teamService } from '../../../services/auth/team-service';
import { cookies } from 'next/headers';

// Helper to get the current user from the token
async function getCurrentUser(request: NextRequest) {
  const authToken = cookies().get('auth_token')?.value;
  
  if (!authToken) {
    return null;
  }
  
  const tokenVerification = await authService.verifyToken(authToken);
  
  if (!tokenVerification.valid || !tokenVerification.userId) {
    return null;
  }
  
  return authService.getUserById(tokenVerification.userId);
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { name, ageGroup, season, description } = await request.json();
    
    // Validate inputs
    if (!name || !ageGroup || !season) {
      return NextResponse.json(
        { success: false, message: 'Team name, age group, and season are required' },
        { status: 400 }
      );
    }
    
    // Create the team
    const result = await authService.createTeam(
      user.id,
      name,
      ageGroup,
      season,
      description
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: result.team
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the team' },
      { status: 500 }
    );
  }
}

// GET /api/teams - Get all teams for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const result = await teamService.getUserTeams(user.id);
    
    return NextResponse.json({
      success: true,
      teams: result.teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching teams' },
      { status: 500 }
    );
  }
}