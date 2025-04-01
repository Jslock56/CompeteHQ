/**
 * Combined API route that returns user information and team memberships in a single request
 * This reduces network requests and improves performance
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
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock user with memberships
        console.log('API /me-with-memberships: Returning mock data for development');
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
          },
          memberships: [
            {
              _id: 'membership123',
              userId: '123456789',
              teamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
              role: 'headCoach',
              permissions: ['view:lineups', 'manage:lineups', 'view:players', 'manage:players'],
              status: 'active',
              createdAt: Date.now()
            }
          ],
          teams: [
            {
              id: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
              name: 'Mock Team',
              ageGroup: 'U12',
              season: '2023',
              sport: 'baseball'
            }
          ]
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
      cookieStore.delete('auth_token');
      
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    const userId = tokenVerification.userId;
    
    // Get user data and memberships in parallel
    const [user, memberships] = await Promise.all([
      authService.getUserById(userId),
      TeamMembership.find({ userId })
    ]);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Get team IDs from memberships
    const teamIds = memberships.map(membership => membership.teamId);
    
    // Get team data
    const teams = await Team.find({ id: { $in: teamIds } });
    
    // Format teams data for response
    const teamsData = teams.map(team => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      season: team.season,
      sport: team.sport
    }));
    
    // Return user data without sensitive fields
    const { passwordHash, resetPasswordToken, verificationToken, ...safeUser } = user;
    
    return NextResponse.json({
      success: true,
      user: safeUser,
      memberships,
      teams: teamsData
    });
  } catch (error) {
    console.error('Error fetching user data and memberships:', error);
    
    if (process.env.NODE_ENV !== 'production') {
      // For development, return mock data in case of errors
      console.log('API /me-with-memberships: Returning mock data for development due to error');
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
        },
        memberships: [
          {
            _id: 'membership123',
            userId: '123456789',
            teamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
            role: 'headCoach',
            permissions: ['view:lineups', 'manage:lineups', 'view:players', 'manage:players'],
            status: 'active',
            createdAt: Date.now()
          }
        ],
        teams: [
          {
            id: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
            name: 'Mock Team',
            ageGroup: 'U12',
            season: '2023',
            sport: 'baseball'
          }
        ]
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching user data and memberships'
    }, { status: 500 });
  }
}