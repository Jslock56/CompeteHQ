/**
 * API route for handling asset uploads
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '../../../../services/auth/auth-service';
import { connectMongoDB } from '../../../../services/database/mongodb';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Helper to get the current user from token
async function getCurrentUser(request: NextRequest) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth_token');
  const authToken = authCookie?.value;
  
  if (!authToken) return null;
  
  try {
    const tokenVerification = await authService.verifyToken(authToken);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      return null;
    }
    
    return authService.getUserById(tokenVerification.userId);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

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
    const assetType = formData.get('assetType') as string; // 'teamLogo' or 'image'
    const teamId = formData.get('teamId') as string; // For team logo uploads
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Only image files are allowed' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }
    
    // For team logo uploads, validate the team ID
    if (assetType === 'teamLogo' && !teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required for team logo uploads' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || 'png';
    let fileName;
    let filePath;
    
    if (assetType === 'teamLogo') {
      // For team logos, use a pattern that includes the team ID
      // This allows different teams to have their own logos
      fileName = `team-${teamId}.${fileExtension}`;
      filePath = path.join(process.cwd(), 'public', 'assets', 'images', 'teams', fileName);
      
      // Ensure the teams directory exists
      await mkdir(path.join(process.cwd(), 'public', 'assets', 'images', 'teams'), { recursive: true });
      
      // If this is a team logo, we also need to update the team document in MongoDB
      try {
        const { Team } = await import('../../../../models/team');
        await Team.findOneAndUpdate(
          { id: teamId },
          { logoUrl: `/assets/images/teams/${fileName}`, updatedAt: Date.now() }
        );
      } catch (error) {
        console.error('Error updating team with logo URL:', error);
        // Continue with the upload even if DB update fails
        // The file will still be saved, but the team record might not be updated
      }
    } else {
      // For other images, use a unique filename
      fileName = `${uuidv4()}.${fileExtension}`;
      filePath = path.join(process.cwd(), 'public', 'assets', 'images', fileName);
    }
    
    // Ensure the directory exists
    await mkdir(path.join(process.cwd(), 'public', 'assets', 'images'), { recursive: true });
    
    // Convert file to ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save the file
    await writeFile(filePath, buffer);
    
    // Return the file information
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/assets/images/${fileName}`
      }
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during file upload' },
      { status: 500 }
    );
  }
}