/**
 * API routes for MongoDB operations
 * This isolates MongoDB operations to the server side
 */
import { NextRequest, NextResponse } from 'next/server';
import { storageAdapter } from '../../../services/database/storage-adapter';
import { syncService } from '../../../services/database/sync-service';
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
      case 'isOnline':
        return NextResponse.json({ online: await storageAdapter.isOnline() });
        
      case 'getPendingChangesCount':
        return NextResponse.json({ count: syncService.getPendingChangesCount() });
        
      case 'getSyncState':
        return NextResponse.json(syncService.getSyncState());
        
      case 'testConnection':
        // Test direct MongoDB connection
        console.log('Testing direct MongoDB connection...');
        const startTime = Date.now();
        await mongoDBService.connect();
        const connectionTime = Date.now() - startTime;
        const isConnected = mongoDBService.isConnectedToDatabase();
        const error = mongoDBService.getConnectionError();
        
        return NextResponse.json({ 
          online: isConnected, 
          connectionTime,
          error: error?.message,
          mongodb: true
        });
        
      case 'debugGetNonGameLineups':
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
    const { operation, data } = body;
    
    if (!operation) {
      return NextResponse.json({ error: 'Operation parameter is required' }, { status: 400 });
    }
    
    // Handle various operations
    switch (operation) {
      case 'goOnline':
        return NextResponse.json({ success: await storageAdapter.goOnline() });
        
      case 'goOffline':
        storageAdapter.goOffline();
        return NextResponse.json({ success: true });
        
      case 'syncChanges':
        return NextResponse.json({ success: await syncService.syncPendingChanges() });
        
      case 'fullSync':
        return NextResponse.json({ success: await syncService.fullSync() });
        
      case 'downloadAllData':
        return NextResponse.json({ success: await syncService.downloadAllData() });
        
      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in MongoDB API route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}