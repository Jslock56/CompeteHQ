import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// This is a completely standalone MongoDB connection test
// It doesn't use any of the existing services/code to eliminate potential issues

export async function GET(request: NextRequest) {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    return NextResponse.json({
      success: false,
      message: 'MONGODB_URI environment variable is not defined'
    }, { status: 500 });
  }
  
  const result = {
    timestamp: new Date().toISOString(),
    mongoUri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
    operations: []
  };
  
  let client = null;
  
  try {
    // Connect directly to MongoDB
    result.operations.push({ name: 'connect', status: 'started' });
    
    client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    
    await client.connect();
    result.operations.push({ name: 'connect', status: 'success' });
    
    // Check database
    const db = client.db();
    const dbInfo = await db.command({ dbStats: 1 });
    result.operations.push({ 
      name: 'dbStats', 
      status: 'success',
      collections: dbInfo.collections,
      documents: dbInfo.objects
    });
    
    // Check if lineups collection exists
    result.operations.push({ name: 'checkCollection', status: 'started' });
    const collections = await db.listCollections().toArray();
    const lineupsCollection = collections.find(c => c.name === 'lineups');
    
    if (!lineupsCollection) {
      // Create lineups collection
      result.operations.push({ 
        name: 'checkCollection', 
        status: 'info',
        message: 'Lineups collection does not exist, creating it'
      });
      
      await db.createCollection('lineups');
      result.operations.push({ name: 'createCollection', status: 'success' });
    } else {
      result.operations.push({ 
        name: 'checkCollection', 
        status: 'success',
        message: 'Lineups collection exists'
      });
    }
    
    // Try to insert a test document
    result.operations.push({ name: 'insertDocument', status: 'started' });
    
    const testId = uuidv4();
    const testDoc = {
      id: testId,
      _id: testId, // Force _id to match id
      name: 'Direct MongoDB Test',
      teamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
      type: 'test',
      test: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      innings: [{ inning: 1, positions: [] }]
    };
    
    const insertResult = await db.collection('lineups').insertOne(testDoc);
    
    result.operations.push({ 
      name: 'insertDocument', 
      status: 'success',
      acknowledged: insertResult.acknowledged,
      insertedId: insertResult.insertedId,
      testId
    });
    
    // Try to read the document back
    result.operations.push({ name: 'readDocument', status: 'started' });
    
    const readDoc = await db.collection('lineups').findOne({ id: testId });
    
    result.operations.push({ 
      name: 'readDocument', 
      status: 'success',
      found: !!readDoc,
      document: {
        id: readDoc?.id,
        name: readDoc?.name,
        teamId: readDoc?.teamId
      }
    });
    
    // Overall success
    result.success = true;
    
  } catch (error) {
    console.error('Direct MongoDB Test Error:', error);
    
    result.success = false;
    result.error = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    
    // Add failure to operations list
    const lastOp = result.operations[result.operations.length - 1];
    if (lastOp) {
      result.operations.push({
        name: lastOp.name,
        status: 'error',
        message: error.message
      });
    }
  } finally {
    if (client) {
      try {
        await client.close();
        result.operations.push({ name: 'disconnect', status: 'success' });
      } catch (closeError) {
        result.operations.push({ 
          name: 'disconnect', 
          status: 'error',
          message: closeError.message
        });
      }
    }
  }

  return NextResponse.json(result);
}