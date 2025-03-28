'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Team } from '../../../../models/team';
import { User } from '../../../../models/user';
import { TeamMembership } from '../../../../models/team-membership';
import { Notification } from '../../../../models/notification';
import { connectMongoDB } from '../../../../services/database/mongodb';
import { Permission, PERMISSION_SETS } from '../../../../models/user';

// Join request API route
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get the request body
    const body = await request.json();
    const { teamId, role = 'fan' } = body;

    if (!teamId) {
      return NextResponse.json({
        success: false,
        message: 'Team ID is required'
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

    // Find the team
    const team = await Team.findOne({ id: teamId });

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
      } else if (existingMembership.status === 'pending') {
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

    // Create team membership with pending status
    const membership = new TeamMembership({
      userId: user.id,
      teamId: team.id,
      role: role || 'fan',
      permissions,
      status: team.joinRequiresApproval ? 'pending' : 'active',
      joinedAt: team.joinRequiresApproval ? undefined : Date.now()
    });

    await membership.save();

    // If the team doesn't require approval, add it to the user's teams
    if (!team.joinRequiresApproval) {
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
    }

    // Find team coaches to notify
    const coaches = await TeamMembership.find({
      teamId: team.id,
      role: 'headCoach',
      status: 'active'
    });

    // Create notifications for coaches
    for (const coach of coaches) {
      const notification = new Notification({
        userId: coach.userId,
        type: 'request',
        title: 'New Join Request',
        message: `${user.name} has requested to join your team ${team.name}`,
        relatedId: membership._id.toString(),
        actionUrl: `/teams/${team.id}/members`,
        createdAt: Date.now(),
        read: false,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await notification.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Join request sent successfully',
      team: {
        id: team.id,
        name: team.name,
        ageGroup: team.ageGroup,
        season: team.season
      }
    });
  } catch (error) {
    console.error('Error sending join request:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send join request'
    }, { status: 500 });
  }
}