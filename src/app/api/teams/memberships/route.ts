/**
 * API route to get team memberships for the current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../services/auth/auth-service';
import { TeamMembership } from '../../../../models/team-membership';
import { Team } from '../../../../models/team';
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
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    const userId = tokenVerification.userId;
    
    // Get all memberships
    const memberships = await TeamMembership.find({ userId });
    
    // Get team IDs
    const teamIds = memberships.map(membership => membership.teamId);
    
    // Get team data
    const teams = await Team.find({ id: { $in: teamIds } });
    
    // Format response
    const teamsData = teams.map(team => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      season: team.season,
      sport: team.sport
    }));
    
    return NextResponse.json({
      success: true,
      memberships,
      teams: teamsData
    });
  } catch (error) {
    console.error('Error fetching team memberships:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching team memberships'
    }, { status: 500 });
  }
}