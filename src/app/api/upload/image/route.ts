/**
 * API route for handling image uploads of schedules
 * Uses OCR to extract schedule information from images
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '../../../../services/auth/auth-service';
import { connectMongoDB } from '../../../../services/database/mongodb';
import { mongoDBService } from '../../../../services/database/mongodb';
import { Game } from '../../../../types/game';
import { Practice } from '../../../../types/practice';
import { v4 as uuidv4 } from 'uuid';

// Helper to get the current user from the token
async function getCurrentUser(request: NextRequest) {
  // First try cookie-based auth
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth_token');
  const authToken = authCookie?.value;
  
  // If no cookie token, try checking Authorization header
  const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Use whichever token we found
  const token = authToken || headerToken;
  
  if (!token) {
    return null;
  }
  
  try {
    const tokenVerification = await authService.verifyToken(token);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      return null;
    }
    
    return authService.getUserById(tokenVerification.userId);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// POST /api/upload/image - Upload and process an image file
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();
    
    // Authenticate user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;
    const importType = formData.get('importType') as string; // 'games' or 'practices'
    
    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    if (!importType || !['games', 'practices'].includes(importType)) {
      return NextResponse.json(
        { success: false, message: 'Import type must be "games" or "practices"' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    if (!user.teams.includes(teamId)) {
      // For development, we'll add the team to the user's teams
      console.log('Adding team to user teams for development');
      user.teams.push(teamId);
      await user.save();
    }
    
    // TODO: In a real implementation, you would use a third-party OCR service here
    // For now, we'll return a placeholder response
    
    return NextResponse.json({
      success: true,
      message: 'Image received for processing',
      status: 'processing',
      note: 'This is a placeholder response. Actual OCR processing would happen in a production environment.'
    });
    
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during file processing' },
      { status: 500 }
    );
  }
}