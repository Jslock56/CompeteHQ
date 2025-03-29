import { NextRequest, NextResponse } from 'next/server';
import mongoDBService from '../../../services/database/mongodb';

/**
 * GET /api/health
 * Health check endpoint that validates database connectivity
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    const isConnected = await mongoDBService.connect();
    
    // Start time for database connectivity check
    const startTime = Date.now();
    
    // Simple database operation to verify connectivity
    let dbOperationTime = 0;
    let dbOperation = false;
    
    if (isConnected) {
      try {
        // Perform a simple MongoDB operation to test actual connectivity
        const result = await mongoDBService.getAllTeams();
        dbOperation = true;
        dbOperationTime = Date.now() - startTime;
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        dbOperation = false;
      }
    }
    
    // Response data
    const healthData = {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          connected: isConnected,
          healthy: dbOperation,
          responseTime: dbOperationTime
        }
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          connected: false,
          healthy: false,
          responseTime: -1
        }
      },
      error: String(error)
    }, { status: 500 });
  }
}