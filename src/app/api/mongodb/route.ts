/**
 * API routes for MongoDB operations
 * This isolates MongoDB operations to the server side
 */
import { NextRequest, NextResponse } from 'next/server';
import { storageAdapter } from '../../../services/database/storage-adapter';
import { syncService } from '../../../services/database/sync-service';

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