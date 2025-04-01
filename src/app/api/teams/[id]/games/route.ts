import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectMongoDB } from '../../../../../services/database/mongodb';
import { getCurrentUser } from '../../../../../services/auth/api-auth';
import { TeamMembership } from '../../../../../models/team-membership';
import { Permission } from '../../../../../models/user';

/**
 * GET /api/teams/:id/games
 * Get all games for a team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    try {
      await connectMongoDB();
    } catch (error) {
      console.error('MongoDB connection failed when getting team games:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: String(error) },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping permission check in development mode');
    }

    // Get team ID from route params
    const teamId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    // Verify user is a member of this team in production mode
    if (process.env.NODE_ENV === 'production' && user) {
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
      
      // Check if user has permission to view the schedule
      if (!userMembership.permissions.includes(Permission.VIEW_SCHEDULE)) {
        return NextResponse.json(
          { success: false, message: 'You do not have permission to view the schedule' },
          { status: 403 }
        );
      }
    }

    // Get games from database
    let games = [];
    try {
      // Import mongoose
      const { default: mongoose } = await import('mongoose');
      
      // Define a schema for games if it doesn't exist
      if (!mongoose.models.Game) {
        const GameSchema = new mongoose.Schema({
          id: { type: String, required: true, unique: true },
          teamId: { type: String, required: true, index: true },
          opponent: { type: String, required: true },
          date: { type: Number, required: true }, // Changed to Number for timestamp
          location: { type: String, required: true },
          isHome: { type: Boolean, required: true, default: true },
          innings: { type: Number, required: true, default: 7 }, // Default to 7 innings
          status: { 
            type: String, 
            enum: ['scheduled', 'in-progress', 'completed', 'canceled'],
            default: 'scheduled'
          },
          homeScore: Number,
          awayScore: Number,
          result: { 
            type: String, 
            enum: ['win', 'loss', 'tie', null],
            default: null
          },
          lineupId: String,
          notes: String,
          createdAt: { type: Number, default: () => Date.now() },
          updatedAt: { type: Number, default: () => Date.now() }
        });
        
        mongoose.model('Game', GameSchema);
      }
      
      const Game = mongoose.model('Game');
      games = await Game.find({ teamId }).lean();
      
      // Sort games by date (newest first) - date is already a timestamp, no need for Date conversion
      console.log(`Found ${games.length} games for team ${teamId}`);
      games.forEach(game => {
        console.log(`Game in DB: ID=${game.id}, Team=${game.teamId}, Opponent=${game.opponent}, Date=${game.date}`);
      });
      games.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.log('Error fetching games:', error);
      // Return empty games array
      games = [];
    }

    return NextResponse.json({
      success: true,
      games
    });
  } catch (error) {
    console.error('Error fetching team games:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team games' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/:id/games
 * Create a new game for a team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    try {
      await connectMongoDB();
    } catch (error) {
      console.error('MongoDB connection failed when creating game:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: String(error) },
        { status: 500 }
      );
    }

    // Get current user from authentication
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping permission check in development mode');
    }

    // Get team ID from route params
    const teamId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    // Verify user is a member of this team in production mode
    if (process.env.NODE_ENV === 'production' && user) {
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
      
      // Check if user has permission to create games
      if (!userMembership.permissions.includes(Permission.CREATE_GAMES)) {
        return NextResponse.json(
          { success: false, message: 'You do not have permission to create games' },
          { status: 403 }
        );
      }
    }

    // Get game data from request body
    const data = await request.json();
    console.log('POST /api/teams/:id/games - Received game data:', data);
    
    if (!data.game) {
      console.error('POST /api/teams/:id/games - No game data provided');
      return NextResponse.json(
        { success: false, message: 'No game data provided' },
        { status: 400 }
      );
    }

    // Import mongoose
    const { default: mongoose } = await import('mongoose');
    
    // Define a schema for games if it doesn't exist
    if (!mongoose.models.Game) {
      const GameSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        teamId: { type: String, required: true, index: true },
        opponent: { type: String, required: true },
        date: { type: Number, required: true }, // Changed to Number for timestamp
        location: { type: String, required: true },
        isHome: { type: Boolean, required: true, default: true },
        innings: { type: Number, required: true, default: 6 },
        status: { 
          type: String, 
          enum: ['scheduled', 'in-progress', 'completed', 'canceled'],
          default: 'scheduled'
        },
        homeScore: Number,
        awayScore: Number,
        result: { 
          type: String, 
          enum: ['win', 'loss', 'tie', null],
          default: null
        },
        lineupId: String,
        notes: String,
        createdAt: { type: Number, default: () => Date.now() },
        updatedAt: { type: Number, default: () => Date.now() }
      });
      
      mongoose.model('Game', GameSchema);
    }
    
    const Game = mongoose.model('Game');
    
    // Ensure the game has the correct teamId from the URL
    data.game.teamId = teamId;
    
    // Create a new game ID if one doesn't exist
    if (!data.game.id) {
      const { v4: uuidv4 } = await import('uuid');
      data.game.id = uuidv4();
    }
    
    // Add timestamps if not present
    const now = Date.now();
    if (!data.game.createdAt) {
      data.game.createdAt = now;
    }
    data.game.updatedAt = now;
    
    // Create the game in MongoDB
    try {
      console.log('Creating game with ID:', data.game.id, 'for team:', teamId);
      
      // Ensure date is stored as a timestamp (number)
      if (data.game.date && typeof data.game.date !== 'number') {
        if (data.game.date instanceof Date) {
          data.game.date = data.game.date.getTime();
        } else {
          // Try to parse it as a date
          data.game.date = new Date(data.game.date).getTime();
        }
        console.log(`Converted date to timestamp: ${data.game.date}`);
      }
      
      // Check if game already exists
      const existingGame = await Game.findOne({ id: data.game.id });
      
      if (existingGame) {
        console.log('Updating existing game:', existingGame);
        // Update existing game
        await Game.updateOne({ id: data.game.id }, data.game);
      } else {
        console.log('Creating new game with data:', data.game);
        // Create new game
        await Game.create(data.game);
      }
      
      return NextResponse.json({
        success: true,
        game: data.game
      });
    } catch (err) {
      console.error('Error saving game to MongoDB:', err);
      return NextResponse.json(
        { success: false, message: 'Failed to save game to database', error: String(err) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create game', error: String(error) },
      { status: 500 }
    );
  }
}