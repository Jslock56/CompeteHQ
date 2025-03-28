/**
 * API route to get team memberships for the current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../services/auth/auth-service';
import { TeamMembership } from '../../../../models/team-membership';
import { Team } from '../../../../models/team';
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
    
    console.log("Getting memberships for user", userId);
    
    // Get all memberships
    const memberships = await TeamMembership.find({ userId });
    console.log("Found memberships:", memberships);
    
    // Get team IDs
    const teamIds = memberships.map(membership => membership.teamId);
    console.log("Team IDs from memberships:", teamIds);
    
    // Get team data
    const teams = await Team.find({ id: { $in: teamIds } });
    console.log("Teams found:", teams);
    
    // Format response
    const teamsData = teams.map(team => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      season: team.season,
      sport: team.sport
    }));
    console.log("Formatted team data:", teamsData);
    
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