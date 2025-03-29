import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../services/database/mongodb';
import { getCurrentUser } from '../auth/me/route';
import { TeamMembership } from '../../../models/team-membership';
import { Permission } from '../../../models/user';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/lineups/:id
 * Get a lineup by ID
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const user = await getCurrentUser(request, cookies());
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get lineup ID from query parameters
    const { searchParams } = new URL(request.url);
    const lineupId = searchParams.get('id');
    
    if (!lineupId) {
      return NextResponse.json(
        { success: false, message: 'Lineup ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the lineup
    const lineup = await mongoDBService.getLineup(lineupId);
    if (!lineup) {
      return NextResponse.json(
        { success: false, message: 'Lineup not found' },
        { status: 404 }
      );
    }

    // Verify user is a member of the team that owns this lineup
    const userMembership = await TeamMembership.findOne({ 
      userId: user._id, 
      teamId: lineup.teamId, 
      status: 'active' 
    });
    
    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this team' },
        { status: 403 }
      );
    }
    
    // Check if user has permission to view lineups
    if (!userMembership.permissions.includes(Permission.VIEW_STATS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to view lineups' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      lineup
    });
  } catch (error) {
    console.error('Error fetching lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch lineup' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lineups
 * Create a new lineup
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const user = await getCurrentUser(request, cookies());
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get lineup data from request body
    const lineup = await request.json();
    
    // Validate required fields
    if (!lineup.teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the team
    const userMembership = await TeamMembership.findOne({ 
      userId: user._id, 
      teamId: lineup.teamId, 
      status: 'active' 
    });
    
    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this team' },
        { status: 403 }
      );
    }
    
    // Check if user has permission to create lineups
    if (!userMembership.permissions.includes(Permission.CREATE_LINEUPS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to create lineups' },
        { status: 403 }
      );
    }

    // Ensure the lineup has an ID
    const lineupToSave = {
      ...lineup,
      id: lineup.id || uuidv4(),
      createdAt: lineup.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    
    // Save to MongoDB
    const success = await mongoDBService.saveLineup(lineupToSave);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to save lineup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lineup: lineupToSave
    });
  } catch (error) {
    console.error('Error creating lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create lineup' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lineups
 * Update an existing lineup
 */
export async function PUT(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const user = await getCurrentUser(request, cookies());
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get lineup data from request body
    const lineup = await request.json();
    
    // Validate required fields
    if (!lineup.id || !lineup.teamId) {
      return NextResponse.json(
        { success: false, message: 'Lineup ID and Team ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the team
    const userMembership = await TeamMembership.findOne({ 
      userId: user._id, 
      teamId: lineup.teamId, 
      status: 'active' 
    });
    
    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this team' },
        { status: 403 }
      );
    }
    
    // Check if user has permission to edit lineups
    if (!userMembership.permissions.includes(Permission.EDIT_LINEUPS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to edit lineups' },
        { status: 403 }
      );
    }

    // Check if the lineup exists
    const existingLineup = await mongoDBService.getLineup(lineup.id);
    if (!existingLineup) {
      return NextResponse.json(
        { success: false, message: 'Lineup not found' },
        { status: 404 }
      );
    }

    // Update the lineup
    const lineupToSave = {
      ...lineup,
      updatedAt: Date.now()
    };
    
    // Save to MongoDB
    const success = await mongoDBService.saveLineup(lineupToSave);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update lineup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lineup: lineupToSave
    });
  } catch (error) {
    console.error('Error updating lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update lineup' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lineups
 * Delete a lineup
 */
export async function DELETE(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const user = await getCurrentUser(request, cookies());
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get lineup ID from query parameters
    const { searchParams } = new URL(request.url);
    const lineupId = searchParams.get('id');
    
    if (!lineupId) {
      return NextResponse.json(
        { success: false, message: 'Lineup ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the lineup
    const lineup = await mongoDBService.getLineup(lineupId);
    if (!lineup) {
      return NextResponse.json(
        { success: false, message: 'Lineup not found' },
        { status: 404 }
      );
    }

    // Verify user is a member of the team that owns this lineup
    const userMembership = await TeamMembership.findOne({ 
      userId: user._id, 
      teamId: lineup.teamId, 
      status: 'active' 
    });
    
    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this team' },
        { status: 403 }
      );
    }
    
    // Check if user has permission to edit lineups
    if (!userMembership.permissions.includes(Permission.EDIT_LINEUPS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete lineups' },
        { status: 403 }
      );
    }

    // Delete the lineup
    const success = await mongoDBService.deleteLineup(lineupId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete lineup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lineup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete lineup' },
      { status: 500 }
    );
  }
}