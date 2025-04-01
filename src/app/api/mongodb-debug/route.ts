/**
 * Debug API to test MongoDB operations directly
 * This API is for debugging purposes only
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '../../../services/database/mongodb';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    
    if (action === 'status') {
      // Return MongoDB connection status
      return NextResponse.json({
        success: true,
        status: {
          connected: mongoose.connection.readyState === 1,
          db: mongoose.connection.db?.databaseName,
          collections: mongoose.connection.db ? await mongoose.connection.db.listCollections().toArray() : []
        }
      });
    }
    
    else if (action === 'test-innings') {
      // Create a test game to verify innings field
      try {
        // Define the Game model
        const GameSchema = new mongoose.Schema({
          id: { type: String, required: true, unique: true },
          teamId: { type: String, required: true },
          opponent: { type: String, required: true },
          date: { type: Number, required: true },
          location: { type: String, required: true },
          innings: { type: Number, required: true, default: 7 },
          isHome: { type: Boolean, default: true },
          status: { 
            type: String, 
            enum: ['scheduled', 'in-progress', 'completed', 'canceled'],
            default: 'scheduled'
          },
          createdAt: { type: Number, default: Date.now },
          updatedAt: { type: Number, default: Date.now }
        });
        
        // Create the model
        const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
        
        // Create a test game
        const testId = uuidv4();
        const testGame = {
          id: testId,
          teamId: 'test-team',
          opponent: 'Test Opponent',
          date: Date.now(),
          location: 'Test Location',
          innings: 7,
          isHome: true,
          status: 'scheduled',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Save the game to MongoDB
        await Game.create(testGame);
        
        // Retrieve the game to verify
        const savedGame = await Game.findOne({ id: testId });
        
        // Try to update the innings
        const inningsToUpdate = 9;
        await Game.updateOne(
          { id: testId },
          { $set: { innings: inningsToUpdate, updatedAt: Date.now() } }
        );
        
        // Retrieve the game again to verify update
        const updatedGame = await Game.findOne({ id: testId });
        
        return NextResponse.json({
          success: true,
          testId,
          originalGame: testGame,
          savedGame,
          updatedGame,
          inningsUpdated: updatedGame?.innings === inningsToUpdate
        });
      } catch (error) {
        console.error('MongoDB test error:', error);
        return NextResponse.json({
          success: false,
          error: String(error)
        }, { status: 500 });
      }
    }
    
    else {
      return NextResponse.json({
        success: false,
        error: 'Unknown action'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('MongoDB debug API error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}