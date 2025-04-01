import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '../../../../services/database/mongodb';

/**
 * GET /api/games/test
 * Test endpoint for checking games in MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    console.log('Connected to MongoDB in test endpoint');
    
    // Define the Game schema if it doesn't exist
    if (!mongoose.models.Game) {
      const GameSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        teamId: { type: String, required: true, index: true },
        opponent: { type: String, required: true },
        date: { type: Number, required: true },
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

    // List all games
    const Game = mongoose.model('Game');
    const games = await Game.find({}).lean();
    
    return NextResponse.json({
      success: true,
      count: games.length,
      games
    });
  } catch (error) {
    console.error('Error in games test endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}

/**
 * POST /api/games/test
 * Test endpoint for creating a game directly in MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    console.log('Connected to MongoDB in test endpoint');
    
    // Define the Game schema if it doesn't exist
    if (!mongoose.models.Game) {
      const GameSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        teamId: { type: String, required: true, index: true },
        opponent: { type: String, required: true },
        date: { type: Number, required: true },
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

    // Get test data from the request body
    const body = await request.json();
    
    if (!body.game) {
      return NextResponse.json({ 
        success: false, 
        message: 'No game data provided' 
      }, { status: 400 });
    }
    
    // Create a game
    const Game = mongoose.model('Game');
    
    // Create a unique ID if not provided
    if (!body.game.id) {
      const { v4: uuidv4 } = await import('uuid');
      body.game.id = uuidv4();
    }
    
    // Add timestamps if not present
    const now = Date.now();
    if (!body.game.createdAt) {
      body.game.createdAt = now;
    }
    body.game.updatedAt = now;
    
    // Check if game exists
    const existingGame = await Game.findOne({ id: body.game.id });
    
    if (existingGame) {
      // Update existing game
      await Game.updateOne({ id: body.game.id }, body.game);
      console.log('Updated existing game:', body.game.id);
    } else {
      // Create new game
      await Game.create(body.game);
      console.log('Created new game:', body.game.id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Game saved to MongoDB',
      game: body.game
    });
  } catch (error) {
    console.error('Error in games test endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}