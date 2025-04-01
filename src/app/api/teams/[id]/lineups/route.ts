import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../../services/auth/api-auth';
import { TeamMembership } from '../../../../../models/team-membership';
import { Permission } from '../../../../../models/user';
import { Lineup } from '../../../../../types/lineup';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/teams/[id]/lineups
 * Get all lineups for a team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      const error = mongoDBService.getConnectionError();
      console.error('MongoDB connection failed when getting team lineups:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: error?.message },
        { status: 500 }
      );
    }

    // Get the team ID from route params
    const teamParams = await params;
    const teamId = Array.isArray(teamParams.id) ? teamParams.id[0] : teamParams.id;
    console.log(`Getting lineups for team: ${teamId}`);

    // Get user - In development mode, this will return a mock user
    const cookieStore = await cookies();
    const user = await getCurrentUser(request, cookieStore);

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Skip permission checks in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping permission check in development mode');
    } else if (user) {
      // Verify user is a member of the team
      const userMembership = await TeamMembership.findOne({ 
        userId: user._id, 
        teamId, 
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
    }

    // Get the request type (game or non-game lineups)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let lineups;
    
    if (type === 'non-game') {
      // Get non-game lineups
      lineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
      console.log(`Retrieved ${lineups.length} non-game lineups for team ${teamId}`);
    } else if (type === 'game') {
      // Get game lineups (only for games related to this team)
      const games = await mongoDBService.getGamesByTeam(teamId);
      const gameIds = games.map(game => game.id);
      
      // Placeholder for game lineups functionality
      // This would require a method to get lineups by game IDs
      lineups = []; // TODO: Implement game lineups
    } else {
      // Get all lineups
      const nonGameLineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
      lineups = nonGameLineups; // For now, just return non-game lineups
    }

    return NextResponse.json({
      success: true,
      lineups
    });
  } catch (error) {
    console.error('Error fetching lineups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch lineups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[id]/lineups
 * Create a new lineup for a team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      const error = mongoDBService.getConnectionError();
      console.error('MongoDB connection failed when creating team lineup:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: error?.message },
        { status: 500 }
      );
    }

    // Get the team ID from route params
    const teamParams = await params;
    const teamId = Array.isArray(teamParams.id) ? teamParams.id[0] : teamParams.id;
    console.log(`Creating lineup for team: ${teamId}`);

    // Get user - In development mode, this will return a mock user
    const cookieStore = await cookies();
    const user = await getCurrentUser(request, cookieStore);

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Skip permission checks in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping permission check in development mode');
    } else if (user) {
      // Verify user is a member of the team
      const userMembership = await TeamMembership.findOne({ 
        userId: user._id, 
        teamId, 
        status: 'active' 
      });
      
      if (!userMembership) {
        return NextResponse.json(
          { success: false, message: 'You are not a member of this team' },
          { status: 403 }
        );
      }
      
      // Check if user has permission to create lineups
      if (!userMembership.permissions.includes(Permission.MANAGE_LINEUPS)) {
        return NextResponse.json(
          { success: false, message: 'You do not have permission to create lineups' },
          { status: 403 }
        );
      }
    }

    // Get lineup data from request body
    const body = await request.json();
    const { lineup } = body;
    
    if (!lineup) {
      return NextResponse.json(
        { success: false, message: 'Lineup data is required' },
        { status: 400 }
      );
    }
    
    // Validate that the team ID matches
    if (lineup.teamId !== teamId) {
      return NextResponse.json(
        { success: false, message: 'Lineup team ID does not match the requested team ID' },
        { status: 400 }
      );
    }
    
    // Ensure the lineup has required fields
    const now = Date.now();
    const lineupToSave: Lineup = {
      ...lineup,
      id: lineup.id || uuidv4(),
      createdAt: lineup.createdAt || now,
      updatedAt: now
    };
    
    console.log(`Saving lineup to MongoDB: ${JSON.stringify({
      id: lineupToSave.id,
      name: lineupToSave.name,
      teamId: lineupToSave.teamId,
      gameId: lineupToSave.gameId || 'N/A (non-game lineup)'
    })}`);
    
    // Save the lineup to MongoDB
    try {
      const success = await mongoDBService.saveLineup(lineupToSave);
      
      if (!success) {
        console.error('Failed to save lineup to MongoDB');
        return NextResponse.json(
          { success: false, message: 'Failed to save lineup to database' },
          { status: 500 }
        );
      }
    } catch (saveError) {
      console.error('Error during MongoDB saveLineup operation:', saveError);
      return NextResponse.json(
        { success: false, message: 'Error during save operation', error: String(saveError) },
        { status: 500 }
      );
    }
    
    console.log('Lineup saved successfully to MongoDB');
    return NextResponse.json({
      success: true,
      message: 'Lineup created successfully',
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
 * PUT /api/teams/[id]/lineups
 * Update an existing lineup
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      const error = mongoDBService.getConnectionError();
      console.error('MongoDB connection failed when updating team lineup:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: error?.message },
        { status: 500 }
      );
    }

    // Get the team ID from route params
    const teamParams = await params;
    const teamId = Array.isArray(teamParams.id) ? teamParams.id[0] : teamParams.id;
    console.log(`Updating lineup for team: ${teamId}`);

    // Get user - In development mode, this will return a mock user
    const cookieStore = await cookies();
    const user = await getCurrentUser(request, cookieStore);

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Skip permission checks in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping permission check in development mode');
    } else if (user) {
      // Verify user is a member of the team
      const userMembership = await TeamMembership.findOne({ 
        userId: user._id, 
        teamId, 
        status: 'active' 
      });
      
      if (!userMembership) {
        return NextResponse.json(
          { success: false, message: 'You are not a member of this team' },
          { status: 403 }
        );
      }
      
      // Check if user has permission to update lineups
      if (!userMembership.permissions.includes(Permission.MANAGE_LINEUPS)) {
        return NextResponse.json(
          { success: false, message: 'You do not have permission to update lineups' },
          { status: 403 }
        );
      }
    }

    // Get lineup data from request body
    const body = await request.json();
    const { lineup } = body;
    
    if (!lineup || !lineup.id) {
      return NextResponse.json(
        { success: false, message: 'Lineup data with ID is required' },
        { status: 400 }
      );
    }
    
    // Validate that the team ID matches
    if (lineup.teamId !== teamId) {
      return NextResponse.json(
        { success: false, message: 'Lineup team ID does not match the requested team ID' },
        { status: 400 }
      );
    }
    
    // Get the existing lineup
    const existingLineup = await mongoDBService.getLineup(lineup.id);
    
    if (!existingLineup) {
      console.log(`Lineup with ID ${lineup.id} not found in MongoDB`);
      return NextResponse.json(
        { success: false, message: 'Lineup not found' },
        { status: 404 }
      );
    }
    
    // Update the lineup
    const lineupToSave: Lineup = {
      ...existingLineup,
      ...lineup,
      updatedAt: Date.now()
    };
    
    console.log(`Updating lineup in MongoDB: ${JSON.stringify({
      id: lineupToSave.id,
      name: lineupToSave.name,
      teamId: lineupToSave.teamId,
      gameId: lineupToSave.gameId || 'N/A (non-game lineup)'
    })}`);
    
    // Save the updated lineup to MongoDB
    try {
      const success = await mongoDBService.saveLineup(lineupToSave);
      
      if (!success) {
        console.error('Failed to update lineup in MongoDB');
        return NextResponse.json(
          { success: false, message: 'Failed to update lineup in database' },
          { status: 500 }
        );
      }
    } catch (saveError) {
      console.error('Error during MongoDB saveLineup operation for update:', saveError);
      return NextResponse.json(
        { success: false, message: 'Error during update operation', error: String(saveError) },
        { status: 500 }
      );
    }
    
    console.log('Lineup updated successfully in MongoDB');
    return NextResponse.json({
      success: true,
      message: 'Lineup updated successfully',
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