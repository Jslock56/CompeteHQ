/**
 * API routes for MongoDB operations
 * This provides MongoDB connectivity status and operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { storageAdapter } from '../../../services/database/storage-adapter';
import mongoDBService from '../../../services/database/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters to determine the operation
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    
    if (!operation) {
      return NextResponse.json({ error: 'Operation parameter is required' }, { status: 400 });
    }
    
    // Handle various operations
    switch (operation) {
      case 'isDatabaseConnected':
        // Check if MongoDB is connected
        const isConnected = await storageAdapter.isDatabaseConnected();
        return NextResponse.json({ connected: isConnected });
        
      case 'testConnection':
        // Test direct MongoDB connection
        console.log('Testing direct MongoDB connection...');
        const startTime = Date.now();
        await mongoDBService.connect();
        const connectionTime = Date.now() - startTime;
        const isDbConnected = mongoDBService.isConnectedToDatabase();
        const error = mongoDBService.getConnectionError();
        
        return NextResponse.json({ 
          connected: isDbConnected, 
          connectionTime,
          error: error?.message
        });
        
      case 'getTeamLineups':
        // Get non-game lineups for a team
        const teamId = searchParams.get('teamId');
        if (!teamId) {
          return NextResponse.json({ error: 'Team ID parameter is required' }, { status: 400 });
        }
        
        await mongoDBService.connect();
        if (!mongoDBService.isConnectedToDatabase()) {
          return NextResponse.json({ error: 'MongoDB connection failed' }, { status: 500 });
        }
        
        const lineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
        return NextResponse.json({ 
          success: true,
          count: lineups.length,
          lineups: lineups.map(l => ({ id: l.id, name: l.name, isDefault: l.isDefault }))
        });
      
      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in MongoDB API route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation } = body;
    
    if (!operation) {
      return NextResponse.json({ error: 'Operation parameter is required' }, { status: 400 });
    }
    
    // Handle various operations
    switch (operation) {
      case 'connectToDatabase':
        // Attempt to connect to the database
        const connected = await storageAdapter.connectToDatabase();
        return NextResponse.json({ success: connected });
        
      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in MongoDB API route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}