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
  // Check if already connected
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // Get the MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

// Helper to get the current user from the token
async function getCurrentUser(request: NextRequest) {
  // First try cookie-based auth
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
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
    
    if (!playerData.teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
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
    
    // Validate required fields
    if (!playerData.name) {
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
      name: playerData.name,
      jerseyNumber: playerData.jerseyNumber,
      primaryPositions: playerData.primaryPositions || [],
      secondaryPositions: playerData.secondaryPositions || [],
      notes: playerData.notes || '',
      battingOrder: playerData.battingOrder,
      active: playerData.active !== undefined ? playerData.active : true,
      createdAt: playerData.createdAt || now,
      updatedAt: now
    };
    
    // Save to MongoDB
    const success = await mongoDBService.savePlayer(newPlayer);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to save player' },
        { status: 500 }
      );
    }
    
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