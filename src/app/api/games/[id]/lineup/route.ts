import { NextRequest } from 'next/server';
import { mongoDBService } from '../../../../../services/database/mongodb';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../../../../../services/auth/api-auth';

/**
 * GET handler to fetch the lineup for a specific game
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    
    // Get the game ID from route params
    const gameId = Array.isArray(params.id) ? params.id[0] : params.id;
    console.log(`Getting lineup for game: ${gameId}`);
    
    // Get the current user from cookies
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'User is not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the game first to verify it belongs to a team the user has access to
    const game = await mongoDBService.getGame(gameId);
    
    if (!game) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the team
    if (!user.teams.includes(game.teamId)) {
      return Response.json(
        { success: false, error: 'User does not have access to this team' },
        { status: 403 }
      );
    }
    
    // If game has no lineup ID, return early
    if (!game.lineupId) {
      return Response.json(
        { success: true, lineup: null },
        { status: 200 }
      );
    }
    
    // Get the lineup for the game
    const lineup = await mongoDBService.getLineup(game.lineupId);
    
    if (!lineup) {
      return Response.json(
        { success: false, error: 'Lineup not found' },
        { status: 404 }
      );
    }
    
    return Response.json(
      { success: true, lineup },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting game lineup:', error);
    return Response.json(
      { success: false, error: 'Failed to get game lineup' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a lineup for a specific game
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    
    // Get the game ID from route params
    const gameId = Array.isArray(params.id) ? params.id[0] : params.id;
    console.log(`Creating lineup for game: ${gameId}`);
    
    // Get the current user from cookies
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'User is not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the lineup data from the request body
    const body = await request.json();
    const lineup = body.lineup;
    
    if (!lineup) {
      return Response.json(
        { success: false, error: 'No lineup data provided' },
        { status: 400 }
      );
    }
    
    // Get the game first to verify it belongs to a team the user has access to
    const game = await mongoDBService.getGame(gameId);
    
    if (!game) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the team
    if (!user.teams.includes(game.teamId)) {
      return Response.json(
        { success: false, error: 'User does not have access to this team' },
        { status: 403 }
      );
    }
    
    // Check if game already has a lineup
    if (game.lineupId) {
      return Response.json(
        { success: false, error: 'Game already has a lineup' },
        { status: 400 }
      );
    }
    
    // Ensure the lineup references the correct game
    lineup.gameId = gameId;
    lineup.teamId = game.teamId;
    
    // Save the lineup
    const saved = await mongoDBService.saveLineup(lineup);
    
    if (!saved) {
      return Response.json(
        { success: false, error: 'Failed to save lineup' },
        { status: 500 }
      );
    }
    
    // Update the game with the lineup ID
    game.lineupId = lineup.id;
    game.updatedAt = Date.now();
    
    const gameUpdated = await mongoDBService.saveGame(game);
    
    if (!gameUpdated) {
      console.warn(`Failed to update game ${gameId} with lineup ID ${lineup.id}`);
    }
    
    return Response.json(
      { success: true, lineup },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating game lineup:', error);
    return Response.json(
      { success: false, error: 'Failed to create game lineup' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a lineup for a specific game
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    
    // Get the game ID from route params
    const gameId = Array.isArray(params.id) ? params.id[0] : params.id;
    console.log(`Updating lineup for game: ${gameId}`);
    
    // Get the current user from cookies
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'User is not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the lineup data from the request body
    const body = await request.json();
    const lineup = body.lineup;
    
    if (!lineup) {
      return Response.json(
        { success: false, error: 'No lineup data provided' },
        { status: 400 }
      );
    }
    
    // Get the game first to verify it belongs to a team the user has access to
    const game = await mongoDBService.getGame(gameId);
    
    if (!game) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the team
    if (!user.teams.includes(game.teamId)) {
      return Response.json(
        { success: false, error: 'User does not have access to this team' },
        { status: 403 }
      );
    }
    
    // Check if game has a lineup
    if (!game.lineupId) {
      return Response.json(
        { success: false, error: 'Game does not have a lineup' },
        { status: 400 }
      );
    }
    
    // Ensure the lineup references the correct game and lineup ID
    lineup.gameId = gameId;
    lineup.teamId = game.teamId;
    lineup.id = game.lineupId;
    
    // Save the lineup
    const saved = await mongoDBService.saveLineup(lineup);
    
    if (!saved) {
      return Response.json(
        { success: false, error: 'Failed to update lineup' },
        { status: 500 }
      );
    }
    
    return Response.json(
      { success: true, lineup },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating game lineup:', error);
    return Response.json(
      { success: false, error: 'Failed to update game lineup' },
      { status: 500 }
    );
  }
}