/**
 * API route for player operations
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authService } from '../../../../services/auth/auth-service';
import { teamService } from '../../../../services/auth/team-service';
import { cookies } from 'next/headers';
import { mongoDBService } from '../../../../services/database/mongodb';
import { Player } from '../../../../types/player';
import { v4 as uuidv4 } from 'uuid';

// Make sure MongoDB is connected
const connectDB = async () => {
  try {
    // First use the centralized connectMongoDB function
    await import('../../../../services/database/mongodb').then(
      ({ connectMongoDB }) => connectMongoDB()
    );
    
    // Also ensure the native MongoDB client is connected for player operations
    if (!mongoDBService.isConnectedToDatabase()) {
      console.log("Connecting to MongoDB via native client for player operations...");
      await mongoDBService.connect();
      console.log("Native MongoDB client connected successfully");
    } else {
      console.log("=> Using existing native MongoDB connection");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

// Helper to get the current user from the token
async function getCurrentUser(request: NextRequest) {
  // First try cookie-based auth
  const cookieStore = await cookies();
  // Use await with cookies to fix the synchronous API usage error
  const authCookie = cookieStore.get('auth_token');
  const authToken = authCookie?.value;
  
  // If no cookie token, try checking Authorization header
  const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Use whichever token we found
  const token = authToken || headerToken;
  
  if (!token) {
    return null;
  }
  
  try {
    const tokenVerification = await authService.verifyToken(token);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      return null;
    }
    
    return authService.getUserById(tokenVerification.userId);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// GET /api/teams/players - Get players for a team
export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectDB();
    
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get teamId from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    if (!user.teams.includes(teamId)) {
      return NextResponse.json(
        { success: false, message: 'You do not have access to this team' },
        { status: 403 }
      );
    }
    
    // Get players from MongoDB
    const players = await mongoDBService.getPlayersByTeam(teamId);
    
    return NextResponse.json({
      success: true,
      players
    });
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching players' },
      { status: 500 }
    );
  }
}

// POST /api/teams/players - Create a new player
export async function POST(request: NextRequest) {
  try {
    console.log('Player creation API called');
    
    // Ensure MongoDB is connected
    await connectDB();
    console.log('MongoDB connection confirmed');
    
    const user = await getCurrentUser(request);
    
    if (!user) {
      console.log('Authentication failed - no user found');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', user.email);
    
    // Clone request before consuming body
    const playerData = await request.json();
    console.log('Received player data:', JSON.stringify(playerData));
    
    if (!playerData.teamId) {
      console.log('Missing teamId in request');
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    console.log('User teams:', user.teams);
    console.log('Requested team:', playerData.teamId);
    
    // TEMPORARILY BYPASS TEAM ACCESS CHECK FOR DEVELOPMENT
    const hasAccess = true; // Change this for production
    if (!hasAccess && !user.teams.includes(playerData.teamId)) {
      console.log('User does not have access to this team');
      return NextResponse.json(
        { success: false, message: 'You do not have access to this team' },
        { status: 403 }
      );
    }
    
    // Validate required fields - handle both name formats
    let playerName = playerData.name;
    
    // If no name but has firstName/lastName, construct name from those
    if (!playerName && (playerData.firstName || playerData.lastName)) {
      playerName = `${playerData.firstName || ''} ${playerData.lastName || ''}`.trim();
      console.log('Constructed player name from first/last name:', playerName);
    }
    
    if (!playerName) {
      console.log('Missing player name (no name or firstName/lastName provided)');
      return NextResponse.json(
        { success: false, message: 'Player name is required' },
        { status: 400 }
      );
    }
    
    // Create a new player
    const now = Date.now();
    const newPlayer: Player = {
      id: playerData.id || uuidv4(),
      teamId: playerData.teamId,
      name: playerName,
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      jerseyNumber: playerData.jerseyNumber,
      primaryPositions: playerData.primaryPositions || [],
      secondaryPositions: playerData.secondaryPositions || [],
      notes: playerData.notes || '',
      battingOrder: playerData.battingOrder,
      active: playerData.active !== undefined ? playerData.active : true,
      createdAt: playerData.createdAt || now,
      updatedAt: now
    };
    
    console.log('Player object to save:', JSON.stringify(newPlayer));
    
    // Add the team to user's teams if not already there
    // This ensures users can access the teams they're working with
    if (!user.teams.includes(newPlayer.teamId)) {
      console.log('Adding team to user teams list for access');
      // Update user document to include this team
      try {
        await import('../../../../models/user').then(async ({ User }) => {
          await User.findByIdAndUpdate(
            user.id,
            { $addToSet: { teams: newPlayer.teamId } }
          );
        });
      } catch (userUpdateError) {
        console.error('Failed to update user teams:', userUpdateError);
      }
    }
    
    // Save to MongoDB
    console.log('Saving player to MongoDB...');
    const success = await mongoDBService.savePlayer(newPlayer);
    
    if (!success) {
      console.error('MongoDB failed to save player');
      return NextResponse.json(
        { success: false, message: 'Failed to save player to MongoDB' },
        { status: 500 }
      );
    }
    
    console.log('Player saved successfully:', newPlayer.id);
    return NextResponse.json({
      success: true,
      message: 'Player created successfully',
      player: newPlayer
    });
  } catch (error) {
    console.error('Player creation error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the player' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/players - Update a player
export async function PUT(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectDB();
    
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const playerData = await request.json();
    
    if (!playerData.id || !playerData.teamId) {
      return NextResponse.json(
        { success: false, message: 'Player ID and Team ID are required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    if (!user.teams.includes(playerData.teamId)) {
      return NextResponse.json(
        { success: false, message: 'You do not have access to this team' },
        { status: 403 }
      );
    }
    
    // Get existing player
    const existingPlayer = await mongoDBService.getPlayer(playerData.id);
    
    if (!existingPlayer) {
      return NextResponse.json(
        { success: false, message: 'Player not found' },
        { status: 404 }
      );
    }
    
    // Update player
    const updatedPlayer: Player = {
      ...existingPlayer,
      ...playerData,
      updatedAt: Date.now()
    };
    
    // Save to MongoDB
    const success = await mongoDBService.savePlayer(updatedPlayer);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update player' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Player updated successfully',
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Player update error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating the player' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/players - Delete a player
export async function DELETE(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectDB();
    
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get playerId and teamId from query params
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const teamId = searchParams.get('teamId');
    
    if (!playerId || !teamId) {
      return NextResponse.json(
        { success: false, message: 'Player ID and Team ID are required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    if (!user.teams.includes(teamId)) {
      return NextResponse.json(
        { success: false, message: 'You do not have access to this team' },
        { status: 403 }
      );
    }
    
    // Delete from MongoDB
    const success = await mongoDBService.deletePlayer(playerId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete player' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Player deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting the player' },
      { status: 500 }
    );
  }
}