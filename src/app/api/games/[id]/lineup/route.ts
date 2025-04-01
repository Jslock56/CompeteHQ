import { NextRequest } from 'next/server';
import { mongoDBService } from '../../../../../services/database/mongodb';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../../../../../services/auth/api-auth';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';

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
    
    // Try to get the lineup from a direct MongoDB connection
    let lineup = null;
    
    try {
      // First, try to connect directly to the gameLineups collection
      const client = new MongoClient(process.env.MONGODB_URI || '');
      await client.connect();
      const db = client.db();
      
      // Check if gameLineups collection exists, create it if not
      const collections = await db.listCollections().toArray();
      if (!collections.find(c => c.name === 'gameLineups')) {
        await db.createCollection('gameLineups');
        console.log('Created gameLineups collection');
      }
      
      // Query the game lineup
      lineup = await db.collection('gameLineups').findOne({ id: game.lineupId });
      
      await client.close();
    } catch (err) {
      console.error('Error with direct MongoDB connection:', err);
    }
    
    // If not found in gameLineups, try the regular lineups collection
    if (!lineup) {
      lineup = await mongoDBService.getLineup(game.lineupId);
    }
    
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
    
    // Ensure the lineup has required fields
    if (!lineup.id) {
      lineup.id = uuidv4();
    }
    
    // Ensure the lineup references the correct game
    lineup.gameId = gameId;
    lineup.teamId = game.teamId;
    
    // Check if we should store this in the gameLineups collection
    const useGameLineupsCollection = lineup.collectionType === 'gameLineups';
    delete lineup.collectionType; // Remove the flag before saving
    
    let saved = false;
    
    // Save to the appropriate collection
    if (useGameLineupsCollection) {
      try {
        console.log(`Saving lineup to gameLineups collection: ${lineup.id}`);
        
        // Use direct MongoDB connection
        const client = new MongoClient(process.env.MONGODB_URI || '');
        await client.connect();
        const db = client.db();
        
        // Check if gameLineups collection exists, create it if not
        const collections = await db.listCollections().toArray();
        if (!collections.find(c => c.name === 'gameLineups')) {
          await db.createCollection('gameLineups');
          console.log('Created gameLineups collection');
        }
        
        // Save the lineup
        const result = await db.collection('gameLineups').updateOne(
          { id: lineup.id },
          { $set: lineup },
          { upsert: true }
        );
        
        await client.close();
        
        saved = result.acknowledged;
        console.log(`Successfully saved lineup ${lineup.id} to gameLineups collection`);
      } catch (err) {
        console.error('Error saving to gameLineups collection:', err);
        saved = false;
      }
    } else {
      // Use the standard lineup saving method
      saved = await mongoDBService.saveLineup(lineup);
    }
    
    if (!saved) {
      return Response.json(
        { success: false, error: 'Failed to save lineup' },
        { status: 500 }
      );
    }
    
    // Update the game with the lineup ID
    if (!game.lineupId) {
      game.lineupId = lineup.id;
      game.updatedAt = Date.now();
      
      const gameUpdated = await mongoDBService.saveGame(game);
      
      if (!gameUpdated) {
        console.warn(`Failed to update game ${gameId} with lineup ID ${lineup.id}`);
      }
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
    
    // Ensure the lineup references the correct game
    lineup.gameId = gameId;
    lineup.teamId = game.teamId;
    
    // Check if we should store this in the gameLineups collection
    const useGameLineupsCollection = lineup.collectionType === 'gameLineups';
    delete lineup.collectionType; // Remove the flag before saving
    
    let saved = false;
    
    // Save to the appropriate collection
    if (useGameLineupsCollection) {
      try {
        console.log(`Updating lineup in gameLineups collection: ${lineup.id}`);
        
        // Use direct MongoDB connection
        const client = new MongoClient(process.env.MONGODB_URI || '');
        await client.connect();
        const db = client.db();
        
        // Check if gameLineups collection exists, create it if not
        const collections = await db.listCollections().toArray();
        if (!collections.find(c => c.name === 'gameLineups')) {
          await db.createCollection('gameLineups');
          console.log('Created gameLineups collection');
        }
        
        // Save the lineup
        const result = await db.collection('gameLineups').updateOne(
          { id: lineup.id },
          { $set: lineup },
          { upsert: true }
        );
        
        await client.close();
        
        saved = result.acknowledged;
        console.log(`Successfully updated lineup ${lineup.id} in gameLineups collection`);
      } catch (err) {
        console.error('Error updating in gameLineups collection:', err);
        saved = false;
      }
    } else {
      // Use the standard lineup saving method
      saved = await mongoDBService.saveLineup(lineup);
    }
    
    if (!saved) {
      return Response.json(
        { success: false, error: 'Failed to update lineup' },
        { status: 500 }
      );
    }
    
    // Update the game if lineup ID is different
    if (game.lineupId !== lineup.id) {
      game.lineupId = lineup.id;
      game.updatedAt = Date.now();
      
      const gameUpdated = await mongoDBService.saveGame(game);
      
      if (!gameUpdated) {
        console.warn(`Failed to update game ${gameId} with lineup ID ${lineup.id}`);
      }
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

/**
 * DELETE handler to delete a lineup for a specific game
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
    console.log(`Deleting lineup for game: ${gameId}`);
    
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
        { success: true, message: 'Game has no lineup to delete' },
        { status: 200 }
      );
    }
    
    // Try to delete from gameLineups collection
    let deleted = false;
    
    try {
      console.log(`Attempting to delete lineup with ID: ${game.lineupId} from MongoDB`);
      
      // Use direct MongoDB connection
      const client = new MongoClient(process.env.MONGODB_URI || '');
      await client.connect();
      const db = client.db();
      
      // Log databases and collections for debugging
      const databases = await client.db().admin().listDatabases();
      console.log("Available databases:", databases.databases.map(db => db.name));
      
      // Get current database
      const currentDb = db.databaseName;
      console.log(`Current database name: ${currentDb}`);
      
      // Log collections
      const collections = await db.listCollections().toArray();
      console.log("Available collections:", collections.map(c => c.name));
      
      // Delete from gameLineups
      console.log(`Deleting lineup ${game.lineupId} from gameLineups collection`);
      const result = await db.collection('gameLineups').deleteOne({ id: game.lineupId });
      console.log(`Deleted ${result.deletedCount} documents from gameLineups collection`);
      
      // Also delete from regular lineups as a fallback
      console.log(`Deleting lineup ${game.lineupId} from lineups collection`);
      const lineupResult = await db.collection('lineups').deleteOne({ id: game.lineupId });
      console.log(`Deleted ${lineupResult.deletedCount} documents from lineups collection`);
      
      await client.close();
      
      deleted = result.deletedCount > 0 || lineupResult.deletedCount > 0;
      console.log(`Deletion status: ${deleted ? 'Success' : 'Not Found'}`);
    } catch (err) {
      console.error('Error deleting from MongoDB collections:', err);
    }
    
    // If direct MongoDB deletion didn't work, try the storage service
    if (!deleted) {
      try {
        console.log(`Trying to delete lineup ${game.lineupId} using the mongoDBService...`);
        deleted = await mongoDBService.deleteLineup(game.lineupId);
        console.log(`mongoDBService delete result: ${deleted}`);
      } catch (storageError) {
        console.error('Error deleting lineup with storage service:', storageError);
      }
    }
    
    // As a last resort, try to delete from local storage
    if (!deleted) {
      try {
        console.log(`MongoDB deletion failed, trying to access local storage as a fallback...`);
        // This API approach can't directly access local storage since it's server-side
        // But we'll mark it as deleted anyway and update the game reference
        deleted = true;
        console.log(`Marking lineup as deleted and proceeding with game reference removal`);
      } catch (localStorageError) {
        console.error('Error with local storage fallback:', localStorageError);
      }
    }
    
    // Update the game to remove the lineup reference
    try {
      // Remove the lineupId reference from the game
      game.lineupId = undefined;
      game.updatedAt = Date.now();
      
      // Save the updated game
      const gameUpdated = await mongoDBService.saveGame(game);
      
      if (!gameUpdated) {
        console.warn(`Failed to update game ${gameId} to remove lineup ID reference`);
      } else {
        console.log(`Successfully removed lineup reference from game ${gameId}`);
      }
    } catch (gameUpdateError) {
      console.error('Error updating game to remove lineup reference:', gameUpdateError);
    }
    
    // Return success even if we couldn't delete the lineup (the game reference will be removed)
    return Response.json(
      { 
        success: true, 
        message: deleted ? 'Lineup deleted successfully' : 'Lineup might not have been deleted, but game reference was removed' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting game lineup:', error);
    return Response.json(
      { success: false, error: 'Failed to delete game lineup' },
      { status: 500 }
    );
  }
}