import { NextRequest, NextResponse } from 'next/server';
import mongoDBService from '../../../services/database/mongodb';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/debug
 * Debug API endpoint to test MongoDB functionality and diagnose issues
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation') || 'status';
  
  const results: any = {
    timestamp: new Date().toISOString(),
    operation
  };

  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    results.connected = mongoDBService.isConnectedToDatabase();
    results.connectionError = mongoDBService.getConnectionError()?.message;

    // Test different operations based on the operation parameter
    switch (operation) {
      case 'testConnection':
        // Just test the connection
        results.online = results.connected;
        break;
      
      case 'testWrite':
        // Test writing a record to MongoDB
        if (results.connected) {
          const testId = uuidv4();
          const testObject = {
            id: testId,
            name: 'Test Lineup',
            teamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
            type: 'test',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            innings: [{ inning: 1, positions: [] }]
          };
          
          try {
            results.writeTest = await mongoDBService.saveNonGameLineup(testObject);
            results.testId = testId;
          } catch (writeError) {
            results.writeError = String(writeError);
          }
        }
        break;
      
      case 'inspectCollections':
        // Check if collections exist
        if (results.connected) {
          const db = mongoDBService.getClient()?.db();
          if (db) {
            const collections = await db.listCollections().toArray();
            results.collections = collections.map(c => c.name);
            
            // Count documents in each collection
            const counts: any = {};
            for (const collection of collections) {
              counts[collection.name] = await db.collection(collection.name).countDocuments();
            }
            results.documentCounts = counts;
          } else {
            results.error = 'Could not access database';
          }
        }
        break;
        
      case 'fixPermissions':
        // Check if permissions are correct and try to fix if needed
        if (results.connected) {
          const db = mongoDBService.getClient()?.db();
          if (db) {
            try {
              // Test write permission by creating a temporary collection
              await db.createCollection('_test_permissions');
              await db.collection('_test_permissions').insertOne({ test: true });
              await db.collection('_test_permissions').drop();
              results.writePermission = true;
            } catch (permError) {
              results.writePermission = false;
              results.permissionError = String(permError);
            }
          }
        }
        break;
        
      case 'cleanupDatabase':
        // Remove test data
        if (results.connected) {
          const db = mongoDBService.getClient()?.db();
          if (db) {
            const deleted = await db.collection('lineups').deleteMany({ type: 'test' });
            results.cleanupResult = {
              acknowledged: deleted.acknowledged,
              deletedCount: deleted.deletedCount
            };
          }
        }
        break;
        
      case 'getLineups':
        // Get all lineups
        if (results.connected) {
          const teamId = searchParams.get('teamId') || '773a9421-07e8-45e8-8f77-4a6943c7d1d8';
          try {
            const lineups = await mongoDBService.getNonGameLineupsByTeam(teamId);
            results.lineups = lineups.map(l => ({
              id: l.id,
              name: l.name,
              teamId: l.teamId,
              type: l.type,
              createdAt: l.createdAt,
              updatedAt: l.updatedAt
            }));
            results.count = lineups.length;
          } catch (error) {
            results.error = String(error);
          }
        }
        break;
        
      case 'createSampleLineup':
        // Create a sample lineup
        if (results.connected) {
          const teamId = searchParams.get('teamId') || '773a9421-07e8-45e8-8f77-4a6943c7d1d8';
          const lineupId = uuidv4();
          
          const sampleLineup = {
            id: lineupId,
            name: `Sample Lineup ${new Date().toISOString()}`,
            teamId,
            type: 'competitive',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            innings: [
              {
                inning: 1,
                positions: [
                  { position: 'P', playerId: 'sample-player-1' },
                  { position: 'C', playerId: 'sample-player-2' },
                  { position: '1B', playerId: 'sample-player-3' },
                  { position: '2B', playerId: 'sample-player-4' },
                  { position: '3B', playerId: 'sample-player-5' },
                  { position: 'SS', playerId: 'sample-player-6' },
                  { position: 'LF', playerId: 'sample-player-7' },
                  { position: 'CF', playerId: 'sample-player-8' },
                  { position: 'RF', playerId: 'sample-player-9' }
                ]
              }
            ]
          };
          
          try {
            results.createSuccess = await mongoDBService.saveNonGameLineup(sampleLineup);
            results.sampleLineupId = lineupId;
          } catch (createError) {
            results.createError = String(createError);
          }
        }
        break;

      default:
        results.status = 'MongoDB Service Status Check';
    }
  } catch (error) {
    results.error = String(error);
  }

  return NextResponse.json(results);
}

/**
 * POST /api/debug
 * Special API endpoint that will directly try to save a lineup
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const lineup = body.lineup;
    
    if (!lineup) {
      return NextResponse.json({ success: false, message: 'No lineup provided' }, { status: 400 });
    }
    
    // Ensure lineup has an ID
    if (!lineup.id) {
      lineup.id = uuidv4();
    }
    
    // Connect to MongoDB (forcing it to try even if already connected)
    try {
      mongoDBService.disconnect(); // Force disconnect first
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit
      await mongoDBService.connect();
    } catch (connError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to MongoDB',
        error: String(connError),
        connectionStatus: mongoDBService.isConnectedToDatabase()
      }, { status: 500 });
    }
    
    if (!mongoDBService.isConnectedToDatabase()) {
      const error = mongoDBService.getConnectionError();
      return NextResponse.json({
        success: false,
        message: 'Not connected to MongoDB',
        error: error?.message
      }, { status: 500 });
    }
    
    // Try to directly write the lineup using saveNonGameLineup method
    try {
      console.log(`Debug API: Attempting direct write of lineup ${lineup.id}`);
      const success = await mongoDBService.saveNonGameLineup(lineup);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Lineup saved successfully',
          lineup
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to save lineup, operation returned false',
          lineup
        }, { status: 500 });
      }
    } catch (saveError) {
      return NextResponse.json({
        success: false,
        message: 'Exception during save operation',
        error: String(saveError),
        lineup
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Unexpected error in debug API',
      error: String(error)
    }, { status: 500 });
  }
}