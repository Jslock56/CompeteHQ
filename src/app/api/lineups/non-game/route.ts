import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoDBService from '../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../services/auth/api-auth';
import { v4 as uuidv4 } from 'uuid';
import { Lineup } from '../../../../types/lineup';

/**
 * GET /api/lineups/non-game
 * Get non-game lineups for the specified team
 */
export async function GET(request: NextRequest) {
  try {
    // Get the team ID from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }

    console.log(`Getting non-game lineups for team: ${teamId}`);

    // Connect to MongoDB
    try {
      await mongoDBService.connect();
      console.log('MongoDB connection attempt completed for GET request');
      
      // Even in development mode, verify the connection
      if (!mongoDBService.isConnectedToDatabase()) {
        const error = mongoDBService.getConnectionError();
        console.error('MongoDB connection failed when getting non-game lineups:', error);
        
        // In development, return mock data for testing
        if (process.env.NODE_ENV !== 'production') {
          console.log('DEVELOPMENT MODE: Returning mock lineup data');
          return NextResponse.json({
            success: true,
            lineups: [
              {
                id: 'mock-lineup-1',
                name: 'Mock Lineup 1',
                teamId: teamId,
                type: 'competitive',
                createdAt: Date.now() - 86400000, // yesterday
                updatedAt: Date.now(),
                innings: [
                  {
                    inning: 1,
                    positions: []
                  }
                ]
              }
            ]
          });
        } else {
          return NextResponse.json(
            { success: false, message: 'Database connection failed', error: error?.message },
            { status: 500 }
          );
        }
      }
    } catch (connError) {
      console.error('Error during MongoDB connection attempt for GET:', connError);
      
      // In development, return mock data
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEVELOPMENT MODE: Returning mock lineup data after error');
        return NextResponse.json({
          success: true,
          lineups: [
            {
              id: 'mock-lineup-1',
              name: 'Mock Lineup 1',
              teamId: teamId,
              type: 'competitive',
              createdAt: Date.now() - 86400000, // yesterday
              updatedAt: Date.now(),
              innings: [
                {
                  inning: 1,
                  positions: []
                }
              ]
            }
          ]
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Exception during database connection', error: String(connError) },
          { status: 500 }
        );
      }
    }

    // Get non-game lineups for the team
    const lineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
    console.log(`Found ${lineups.length} non-game lineups for team ${teamId}`);

    return NextResponse.json({
      success: true,
      lineups
    });
  } catch (error) {
    console.error('Error fetching non-game lineups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch non-game lineups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lineups/non-game
 * Create a new non-game lineup
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    try {
      await mongoDBService.connect();
      console.log('MongoDB connection attempt completed');
      
      // Even in development mode, verify the connection
      if (!mongoDBService.isConnectedToDatabase()) {
        const error = mongoDBService.getConnectionError();
        console.error('MongoDB connection failed when creating non-game lineup:', error);
        
        // In development, create a mock success response for testing
        if (process.env.NODE_ENV !== 'production') {
          console.log('DEVELOPMENT MODE: Creating mock connection success');
          // Continue execution despite connection failure in development
        } else {
          return NextResponse.json(
            { success: false, message: 'Database connection failed', error: error?.message },
            { status: 500 }
          );
        }
      }
    } catch (connError) {
      console.error('Error during MongoDB connection attempt:', connError);
      
      // In development, create a mock success response
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEVELOPMENT MODE: Proceeding despite connection error');
        // Continue execution despite connection failure in development
      } else {
        return NextResponse.json(
          { success: false, message: 'Exception during database connection', error: String(connError) },
          { status: 500 }
        );
      }
    }

    // Get lineup data from request body
    const body = await request.json();
    const lineup = body.lineup;
    
    if (!lineup) {
      return NextResponse.json(
        { success: false, message: 'No lineup data provided' },
        { status: 400 }
      );
    }
    
    if (!lineup.teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Creating non-game lineup for team: ${lineup.teamId}, name: ${lineup.name}`);
    
    // Ensure the lineup does not have a gameId (it's a non-game lineup)
    delete lineup.gameId;
    
    // Ensure the lineup has required fields
    const now = Date.now();
    const lineupToSave: Lineup = {
      ...lineup,
      id: lineup.id || uuidv4(),
      createdAt: lineup.createdAt || now,
      updatedAt: now
    };
    
    console.log(`Saving non-game lineup to MongoDB: ${JSON.stringify({
      id: lineupToSave.id,
      name: lineupToSave.name,
      teamId: lineupToSave.teamId
    })}`);
    
    // Save directly to MongoDB without transactions for non-game lineups
    try {
      // Use the specific saveNonGameLineup method to avoid issues with transactions
      console.log(`MongoDB: About to save non-game lineup: ${JSON.stringify(lineupToSave, null, 2)}`);
      const success = await mongoDBService.saveNonGameLineup(lineupToSave);
      console.log(`MongoDB: Save non-game lineup result: ${success}`);
      
      if (!success) {
        console.error('Failed to save non-game lineup to MongoDB');
        return NextResponse.json(
          { success: false, message: 'Failed to save lineup to database' },
          { status: 500 }
        );
      }
      
      console.log('Non-game lineup saved successfully to MongoDB');
      return NextResponse.json({
        success: true,
        message: 'Non-game lineup created successfully',
        lineup: lineupToSave
      });
    } catch (saveError) {
      console.error('Error during MongoDB saveNonGameLineup operation:', saveError);
      return NextResponse.json(
        { success: false, message: 'Error during save operation', error: String(saveError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating non-game lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create non-game lineup' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lineups/non-game
 * Update an existing non-game lineup
 */
export async function PUT(request: NextRequest) {
  try {
    // Connect to MongoDB
    try {
      await mongoDBService.connect();
      console.log('MongoDB connection attempt completed for PUT request');
      
      // Even in development mode, verify the connection
      if (!mongoDBService.isConnectedToDatabase()) {
        const error = mongoDBService.getConnectionError();
        console.error('MongoDB connection failed when updating non-game lineup:', error);
        
        // In development, create a mock success response for testing
        if (process.env.NODE_ENV !== 'production') {
          console.log('DEVELOPMENT MODE: Creating mock connection success for update');
          // Continue execution despite connection failure in development
        } else {
          return NextResponse.json(
            { success: false, message: 'Database connection failed', error: error?.message },
            { status: 500 }
          );
        }
      }
    } catch (connError) {
      console.error('Error during MongoDB connection attempt for update:', connError);
      
      // In development, create a mock success response
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEVELOPMENT MODE: Proceeding despite connection error for update');
        // Continue execution despite connection failure in development
      } else {
        return NextResponse.json(
          { success: false, message: 'Exception during database connection', error: String(connError) },
          { status: 500 }
        );
      }
    }

    // Get lineup data from request body
    const body = await request.json();
    const lineup = body.lineup;
    
    if (!lineup || !lineup.id) {
      return NextResponse.json(
        { success: false, message: 'Lineup data with ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Updating non-game lineup: ${lineup.id}, name: ${lineup.name}`);
    
    // Ensure the lineup does not have a gameId (it's a non-game lineup)
    delete lineup.gameId;
    
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
    
    console.log(`Updating non-game lineup in MongoDB: ${JSON.stringify({
      id: lineupToSave.id,
      name: lineupToSave.name,
      teamId: lineupToSave.teamId
    })}`);
    
    // Save directly to MongoDB without transactions for non-game lineups
    try {
      const success = await mongoDBService.saveNonGameLineup(lineupToSave);
      
      if (!success) {
        console.error('Failed to update non-game lineup in MongoDB');
        return NextResponse.json(
          { success: false, message: 'Failed to update lineup in database' },
          { status: 500 }
        );
      }
      
      console.log('Non-game lineup updated successfully in MongoDB');
      return NextResponse.json({
        success: true,
        message: 'Non-game lineup updated successfully',
        lineup: lineupToSave
      });
    } catch (saveError) {
      console.error('Error during MongoDB saveNonGameLineup operation for update:', saveError);
      return NextResponse.json(
        { success: false, message: 'Error during update operation', error: String(saveError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating non-game lineup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update non-game lineup' },
      { status: 500 }
    );
  }
}