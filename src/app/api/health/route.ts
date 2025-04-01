import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '../../../services/database/mongodb';

/**
 * GET /api/health
 * Health check endpoint for checking service status
 */
export async function GET(request: NextRequest) {
  try {
    // Check MongoDB connection
    let databaseConnected = false;
    let databaseError = null;
    
    try {
      await connectMongoDB();
      databaseConnected = true;
    } catch (error) {
      console.error('Health check - MongoDB connection error:', error);
      databaseError = String(error);
    }
    
    // Return health status for all services
    return NextResponse.json({
      success: true,
      status: 'ok',
      services: {
        api: {
          status: 'ok',
          connected: true
        },
        database: {
          status: databaseConnected ? 'ok' : 'error',
          connected: databaseConnected,
          error: databaseError
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      error: String(error)
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}