/**
 * API authentication utilities
 */
import { authService } from './auth-service';
import { NextRequest } from 'next/server';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { IUser } from '../../models/user';

/**
 * Gets the current user from an API request
 * Returns null if not authenticated
 */
export async function getCurrentUser(request: NextRequest, cookieStore: ReadonlyRequestCookies): Promise<IUser | null> {
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
    
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      console.log('API Auth: No auth token found in cookies');
      return null;
    }
    
    const tokenVerification = await authService.verifyToken(authToken);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      console.log('API Auth: Invalid or expired token');
      return null;
    }
    
    // Get user data
    const user = await authService.getUserById(tokenVerification.userId);
    
    if (!user) {
      console.log('API Auth: User not found for token');
      return null;
    }
    
    console.log(`API Auth: Authenticated as user ${user.email}`);
    return user;
  } catch (error) {
    console.error('API Auth: Error getting current user:', error);
    
    // For development, temporarily allow unauthenticated access
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Auth: Creating mock user for development due to error');
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
    
    return null;
  }
}