import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../../services/auth/api-auth';

/**
 * POST /api/lineups/non-game/default
 * Set a non-game lineup as the default for a team
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    if (!mongoDBService.isConnectedToDatabase()) {
      const error = mongoDBService.getConnectionError();
      console.error('MongoDB connection failed when setting default lineup:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: error?.message },
        { status: 500 }
      );
    }

    // Get lineup ID and team ID from request body
    const requestData = await request.json();
    const lineupId = requestData.lineupId;
    const teamId = requestData.teamId;
    
    if (!lineupId) {
      return NextResponse.json(
        { success: false, message: 'Lineup ID is required' },
        { status: 400 }
      );
    }
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Setting non-game lineup ${lineupId} as default for team ${teamId}`);
    
    // Verify the lineup exists and belongs to this team
    const lineup = await mongoDBService.getLineup(lineupId);
    
    if (!lineup) {
      return NextResponse.json(
        { success: false, message: 'Lineup not found' },
        { status: 404 }
      );
    }
    
    if (lineup.teamId !== teamId) {
      return NextResponse.json(
        { success: false, message: 'Lineup does not belong to this team' },
        { status: 403 }
      );
    }
    
    // Set the lineup as default
    const success = await mongoDBService.setDefaultTeamLineup(lineupId, teamId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to set default lineup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Default lineup set successfully'
    });
  } catch (error) {
    console.error('Error setting default non-game lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set default lineup' },
      { status: 500 }
    );
  }
}