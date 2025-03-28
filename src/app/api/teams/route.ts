/**
 * API route for team operations
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authService } from '../../../services/auth/auth-service';
import { teamService } from '../../../services/auth/team-service';
import { cookies } from 'next/headers';

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

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectDB();
    
    // Debug info
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth_token')?.value;
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('Team creation auth info:', {
      cookieTokenPresent: !!cookieToken,
      headerTokenPresent: !!headerToken
    });
    
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { name, ageGroup, season, description } = await request.json();
    
    // Validate inputs
    if (!name || !ageGroup || !season) {
      return NextResponse.json(
        { success: false, message: 'Team name, age group, and season are required' },
        { status: 400 }
      );
    }
    
    // Create the team
    const result = await authService.createTeam(
      user.id,
      name,
      ageGroup,
      season,
      description
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: result.team
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the team' },
      { status: 500 }
    );
  }
}

// GET /api/teams - Get all teams for current user
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
    
    const result = await teamService.getUserTeams(user.id);
    
    return NextResponse.json({
      success: true,
      teams: result.teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching teams' },
      { status: 500 }
    );
  }
}