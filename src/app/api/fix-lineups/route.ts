import { NextRequest, NextResponse } from 'next/server';
import { mongoDBService } from '../../../services/database/mongodb';
import { v4 as uuidv4 } from 'uuid';

/**
 * A special API endpoint to fix lineups directly in the database
 * This bypasses all the normal API routes and error handling to directly write to MongoDB
 */
export async function GET(request: NextRequest) {
  const results: any = {
    action: 'fix-lineups',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    results.connected = mongoDBService.isConnectedToDatabase();
    
    if (!results.connected) {
      results.error = 'Failed to connect to MongoDB';
      results.errorDetails = mongoDBService.getConnectionError()?.message;
      return NextResponse.json(results, { status: 500 });
    }
    
    // Get the raw MongoDB client and database
    const client = mongoDBService.getClient();
    if (!client) {
      results.error = 'MongoDB client is null';
      return NextResponse.json(results, { status: 500 });
    }
    
    const db = client.db();
    if (!db) {
      results.error = 'MongoDB database is null';
      return NextResponse.json(results, { status: 500 });
    }
    
    // Get operation from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || '773a9421-07e8-45e8-8f77-4a6943c7d1d8';
    const operation = searchParams.get('operation') || 'status';
    
    results.operation = operation;
    results.teamId = teamId;
    
    switch (operation) {
      case 'check': 
        // Check collection state
        const collections = await db.listCollections().toArray();
        results.collections = collections.map(c => c.name);
        
        // Check if lineups collection exists
        const lineupsCollection = collections.find(c => c.name === 'lineups');
        if (!lineupsCollection) {
          results.lineupCollectionExists = false;
          results.lineupCount = 0;
        } else {
          results.lineupCollectionExists = true;
          
          // Count documents
          const count = await db.collection('lineups').countDocuments();
          results.lineupCount = count;
          
          // Get sample document
          if (count > 0) {
            const sample = await db.collection('lineups').findOne({});
            results.sampleDocument = sample;
          }
          
          // Count team lineups
          const teamCount = await db.collection('lineups').countDocuments({ teamId });
          results.teamLineupCount = teamCount;
          
          // Get team's lineups
          const teamLineups = await db.collection('lineups')
            .find({ teamId })
            .project({ id: 1, name: 1, teamId: 1, type: 1 })
            .toArray();
          
          results.teamLineups = teamLineups;
        }
        break;
        
      case 'fix':
        // Fix by creating a clean collection
        const exists = await db.listCollections({ name: 'lineups' }).hasNext();
        
        // Create a simple lineup document
        const fixLineupId = uuidv4();
        const fixLineup = {
          _id: fixLineupId,
          id: fixLineupId,
          name: 'Fixed Test Lineup',
          teamId,
          type: 'competitive',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          innings: [
            {
              inning: 1,
              positions: [
                { position: 'P', playerId: 'test-player-1' },
                { position: 'C', playerId: 'test-player-2' }
              ]
            }
          ]
        };
        
        // Try inserting directly into MongoDB
        try {
          if (exists) {
            // Test update to existing collection
            const updateResult = await db.collection('lineups').updateOne(
              { id: fixLineupId },
              { $set: fixLineup },
              { upsert: true }
            );
            
            results.updateResult = {
              acknowledged: updateResult.acknowledged,
              matchedCount: updateResult.matchedCount,
              modifiedCount: updateResult.modifiedCount,
              upsertedCount: updateResult.upsertedCount,
              upsertedId: updateResult.upsertedId
            };
          } else {
            // Create collection and insert
            await db.createCollection('lineups');
            const insertResult = await db.collection('lineups').insertOne(fixLineup);
            
            results.insertResult = {
              acknowledged: insertResult.acknowledged,
              insertedId: insertResult.insertedId
            };
          }
          
          results.success = true;
          results.lineupId = fixLineupId;
        } catch (dbError) {
          results.success = false;
          results.error = String(dbError);
        }
        break;
        
      case 'reset':
        // Drop and recreate the lineups collection
        try {
          const collExists = await db.listCollections({ name: 'lineups' }).hasNext();
          
          if (collExists) {
            await db.collection('lineups').drop();
            results.dropResult = 'Dropped lineups collection';
          }
          
          await db.createCollection('lineups');
          
          // Create indexes
          await db.collection('lineups').createIndex({ id: 1 }, { unique: true });
          await db.collection('lineups').createIndex({ gameId: 1 });
          await db.collection('lineups').createIndex({ teamId: 1 });
          
          results.resetResult = 'Reset lineups collection';
          results.success = true;
        } catch (resetError) {
          results.success = false;
          results.error = String(resetError);
        }
        break;
        
      default:
        results.status = 'No operation specified';
    }
    
  } catch (error) {
    results.success = false;
    results.error = String(error);
  }
  
  return NextResponse.json(results);
}