/**
 * API route to get and update user settings in MongoDB
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectMongoDB } from '../../../services/database/mongodb';
import { getCurrentUser } from '../../../services/auth/api-auth';
import mongoose from 'mongoose';

// Get user settings
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Get current user
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Define the UserSettings model
    const UserSettings = mongoose.models.UserSettings || mongoose.model(
      'UserSettings',
      new mongoose.Schema({
        userId: { type: String, required: true, unique: true },
        defaultInnings: { type: Number, default: 7 },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
        emailNotifications: { type: Boolean, default: true },
        updatedAt: { type: Number, default: Date.now }
      })
    );
    
    // If no real user in production, return default settings
    if (!user) {
      return NextResponse.json({
        success: true,
        settings: {
          defaultInnings: 7,
          theme: 'light',
          emailNotifications: true
        }
      });
    }
    
    // Get user settings from database
    let settings = await UserSettings.findOne({ userId: user.id });
    
    // If no settings found, create default settings
    if (!settings) {
      settings = {
        defaultInnings: 7,
        theme: 'light',
        emailNotifications: true
      };
    }
    
    return NextResponse.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error getting user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user settings' },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Get current user
    const cookieStore = cookies();
    const user = await getCurrentUser(request, cookieStore);
    
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Define the UserSettings model
    const UserSettings = mongoose.models.UserSettings || mongoose.model(
      'UserSettings',
      new mongoose.Schema({
        userId: { type: String, required: true, unique: true },
        defaultInnings: { type: Number, default: 7 },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
        emailNotifications: { type: Boolean, default: true },
        updatedAt: { type: Number, default: Date.now }
      })
    );
    
    // Get settings from request
    const body = await request.json();
    const { settings } = body;
    
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'No settings provided' },
        { status: 400 }
      );
    }
    
    // If no real user in development, just return success
    if (!user && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        settings
      });
    }
    
    // Update settings with current timestamp
    const updatedSettings = {
      ...settings,
      userId: user.id,
      updatedAt: Date.now()
    };
    
    // Validate innings value if provided
    if (settings.defaultInnings !== undefined) {
      if (
        typeof settings.defaultInnings !== 'number' ||
        settings.defaultInnings < 1 ||
        settings.defaultInnings > 9 ||
        !Number.isInteger(settings.defaultInnings)
      ) {
        return NextResponse.json(
          { success: false, error: 'Invalid innings value' },
          { status: 400 }
        );
      }
    }
    
    // Save to database with upsert
    const result = await UserSettings.updateOne(
      { userId: user.id },
      updatedSettings,
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      settings: updatedSettings
    });
    
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}