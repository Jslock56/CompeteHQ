import { NextRequest } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { mongoDBService } from '../database/mongodb';
import { IUser } from '../../models/user';

/**
 * Get the current user from a Next.js API route request
 * 
 * @param request The Next.js request object
 * @param cookieStore The cookies from the request (needed to access cookies safely in Next.js 13+ API routes)
 * @returns The user object if authenticated, null otherwise
 */
export async function getCurrentUser(
  request: NextRequest, 
  cookieStore: ReturnType<typeof nextCookies>
): Promise<IUser | null> {
  try {
    console.log('API Auth: Getting current user from API request');
    
    // For development, always return a mock user to simplify testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Auth: Creating mock user for development');
      return {
        _id: '123456789',
        id: '123456789',
        email: 'dev@example.com',
        name: 'Dev User',
        teams: ['773a9421-07e8-45e8-8f77-4a6943c7d1d8'],
        activeTeamId: '773a9421-07e8-45e8-8f77-4a6943c7d1d8',
        isEmailVerified: true,
        createdAt: Date.now(),
        hasTeam: () => true,
        addTeam: () => {},
        removeTeam: () => {}
      } as IUser;
    }
    
    // Connect to MongoDB
    await mongoDBService.connect();
    
    // Get the auth token from cookies
    const authToken = cookieStore.get('auth_token')?.value || '';
    
    if (!authToken) {
      console.log('API Auth: No auth token found in cookies');
      return null;
    }
    
    // Get the user from the database using the token
    const user = await mongoDBService.getUserByAuthToken(authToken);
    
    if (!user) {
      console.log('API Auth: No user found for auth token');
      return null;
    }
    
    console.log(`API Auth: Found user: ${user.email}`);
    return user;
  } catch (error) {
    console.error('Error getting current user from API request:', error);
    return null;
  }
}