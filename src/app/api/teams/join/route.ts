'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { TeamCode } from '../../../../models/team-code';
import { Team } from '../../../../models/team';
import { User } from '../../../../models/user';
import { TeamMembership } from '../../../../models/team-membership';
import { connectMongoDB } from '../../../../services/database/mongodb';
import { Permission, PERMISSION_SETS } from '../../../../models/user';

// Join team with code API route
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get the request body
    const body = await request.json();
    const { code, role = 'fan' } = body;

    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'Team code is required'
      }, { status: 400 });
    }

    // Get the current user from JWT token
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || '';
    let decodedToken;

    try {
      decodedToken = jwt.verify(authToken, secret);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication token'
      }, { status: 401 });
    }

    const userId = (decodedToken as any).userId;

    // Find the user
    const user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Find the team code
    const teamCode = await TeamCode.findOne({ code, isActive: true });

    if (!teamCode) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired team code'
      }, { status: 404 });
    }

    // Check if code is expired
    if (teamCode.isExpired()) {
      return NextResponse.json({
        success: false,
        message: 'This team code has expired'
      }, { status: 400 });
    }

    // Check if max uses is reached
    if (teamCode.maxUses && teamCode.uses >= teamCode.maxUses) {
      return NextResponse.json({
        success: false,
        message: 'This team code has reached maximum uses'
      }, { status: 400 });
    }

    // Find the team
    const team = await Team.findOne({ id: teamCode.teamId });

    if (!team) {
      return NextResponse.json({
        success: false,
        message: 'Team not found'
      }, { status: 404 });
    }

    // Check if user is already a member of the team
    const existingMembership = await TeamMembership.findOne({
      userId: user.id,
      teamId: team.id
    });

    if (existingMembership) {
      // User is already a member or has a pending request
      if (existingMembership.status === 'active') {
        return NextResponse.json({
          success: false,
          message: 'You are already a member of this team'
        }, { status: 400 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'You already have a pending request to join this team'
        }, { status: 400 });
      }
    }

    // Determine the appropriate permissions based on role
    let permissions: Permission[] = [];
    
    if (role === 'headCoach') {
      permissions = [...PERMISSION_SETS.HEAD_COACH];
    } else if (role === 'assistant') {
      permissions = [...PERMISSION_SETS.ASSISTANT_COACH];
    } else {
      permissions = [...PERMISSION_SETS.FAN];
    }

    // Create team membership (with active status since using code)
    const membership = new TeamMembership({
      userId: user.id,
      teamId: team.id,
      role: role || 'fan',
      permissions,
      status: 'active',
      joinedAt: Date.now()
    });

    await membership.save();

    // Increment code uses
    teamCode.incrementUses();
    await teamCode.save();

    // Add team to user's teams and set as active
    user.addTeam(team.id);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Successfully joined team',
      team: {
        id: team.id,
        name: team.name,
        ageGroup: team.ageGroup,
        season: team.season
      }
    });
  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to join team'
    }, { status: 500 });
  }
}