'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Team } from '../../../../models/team';
import { User } from '../../../../models/user';
import { TeamMembership } from '../../../../models/team-membership';
import { Permission, PERMISSION_SETS } from '../../../../models/user';
import { connectMongoDB } from '../../../../services/database/mongodb';
import { v4 as uuidv4 } from 'uuid';

// Create team with user data directly in the body (less secure but useful as fallback)
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();

    // Parse request body
    const body = await request.json();
    const { 
      userId, 
      userEmail,
      name, 
      ageGroup, 
      season, 
      description, 
      sport = 'baseball', 
      isPublic = true, 
      joinRequiresApproval = true 
    } = body;

    if (!userId || !userEmail) {
      return NextResponse.json({
        success: false,
        message: 'User ID and email are required'
      }, { status: 400 });
    }

    if (!name || !ageGroup || !season) {
      return NextResponse.json({
        success: false,
        message: 'Name, age group, and season are required'
      }, { status: 400 });
    }

    // Find the user by ID and email (both must match for security)
    const user = await User.findOne({ id: userId, email: userEmail });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found or credentials do not match'
      }, { status: 404 });
    }

    // Create a new team
    const teamId = uuidv4();
    const team = new Team({
      id: teamId,
      name,
      ageGroup,
      season,
      sport,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user.id,
      joinRequiresApproval,
      isPublic
    });

    await team.save();

    // Create team membership for the creator as head coach
    const membership = new TeamMembership({
      userId: user.id,
      teamId: teamId,
      role: 'headCoach',
      permissions: [...PERMISSION_SETS.HEAD_COACH],
      status: 'active',
      joinedAt: Date.now()
    });

    await membership.save();

    // Add team to user's teams and set as active
    user.addTeam(teamId);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        ageGroup: team.ageGroup,
        season: team.season,
        description: team.description,
        sport: team.sport
      }
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create team'
    }, { status: 500 });
  }
}