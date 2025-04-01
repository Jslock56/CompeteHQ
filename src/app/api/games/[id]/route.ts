import { NextRequest } from 'next/server';
import { mongoDBService } from '../../../../services/database/mongodb';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../../../../services/auth/api-auth';

/**
 * GET handler to fetch a game by ID
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
    console.log(`Getting game with ID: ${gameId}`);
    
    // Get the current user from cookies
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return Response.json(
        { success: false, error: 'User is not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the game from MongoDB
    const game = await mongoDBService.getGame(gameId);
    
    if (!game) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // In production, verify user has access to the team
    if (process.env.NODE_ENV === 'production' && user) {
      if (!user.teams.includes(game.teamId)) {
        return Response.json(
          { success: false, error: 'User does not have access to this team' },
          { status: 403 }
        );
      }
    }
    
    return Response.json(
      { success: true, game },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting game:', error);
    return Response.json(
      { success: false, error: 'Failed to get game' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a game
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
    console.log(`Updating game with ID: ${gameId}`);
    
    // Get the current user from cookies
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return Response.json(
        { success: false, error: 'User is not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the game data from the request body
    const body = await request.json();
    const game = body.game;
    
    if (!game) {
      return Response.json(
        { success: false, error: 'No game data provided' },
        { status: 400 }
      );
    }
    
    // Verify the game ID matches the route param
    if (game.id !== gameId) {
      return Response.json(
        { success: false, error: 'Game ID in body does not match URL parameter' },
        { status: 400 }
      );
    }
    
    // Get the existing game to check access
    const existingGame = await mongoDBService.getGame(gameId);
    
    if (!existingGame) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // In production, verify user has access to the team
    if (process.env.NODE_ENV === 'production' && user) {
      if (!user.teams.includes(existingGame.teamId)) {
        return Response.json(
          { success: false, error: 'User does not have access to this team' },
          { status: 403 }
        );
      }
    }
    
    // Ensure we preserve the team ID and don't allow it to be changed
    game.teamId = existingGame.teamId;
    
    // Save the updated game
    const success = await mongoDBService.saveGame(game);
    
    if (!success) {
      return Response.json(
        { success: false, error: 'Failed to update game' },
        { status: 500 }
      );
    }
    
    return Response.json(
      { success: true, game },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating game:', error);
    return Response.json(
      { success: false, error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to delete a game
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    
    // Get the game ID from route params
    const gameId = Array.isArray(params.id) ? params.id[0] : params.id;
    console.log(`Deleting game with ID: ${gameId}`);
    
    // Get the current user from cookies
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return Response.json(
        { success: false, error: 'User is not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the existing game to check access
    const existingGame = await mongoDBService.getGame(gameId);
    
    if (!existingGame) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // In production, verify user has access to the team
    if (process.env.NODE_ENV === 'production' && user) {
      if (!user.teams.includes(existingGame.teamId)) {
        return Response.json(
          { success: false, error: 'User does not have access to this team' },
          { status: 403 }
        );
      }
    }
    
    // Delete the game
    const success = await mongoDBService.deleteGame(gameId);
    
    if (!success) {
      return Response.json(
        { success: false, error: 'Failed to delete game' },
        { status: 500 }
      );
    }
    
    return Response.json(
      { success: true, message: 'Game deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting game:', error);
    return Response.json(
      { success: false, error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}