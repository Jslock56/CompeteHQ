'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// User interface - will be expanded when implementing MongoDB
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: number;
}

// Auth context state interface
interface AuthContextState {
  // Authentication state
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Authentication methods
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the context with a default empty state
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Local storage key for user data
const USER_STORAGE_KEY = 'competeHQ_user';

/**
 * Auth provider component
 * This is a placeholder implementation that will be replaced with MongoDB
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Load user from local storage on initial mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle login - this is a placeholder
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // This is a placeholder for actual authentication
      // Will be replaced with MongoDB authentication
      const mockUser: User = {
        id: Date.now().toString(),
        firstName: 'Demo',
        lastName: 'User',
        email,
        createdAt: Date.now(),
      };

      // Store in localStorage (temporary solution)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      
      // Update state
      setUser(mockUser);
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup - this is a placeholder
  const signup = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // This is a placeholder for actual user creation
      // Will be replaced with MongoDB user creation
      const mockUser: User = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        createdAt: Date.now(),
      };

      // Store in localStorage (temporary solution)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      
      // Update state
      setUser(mockUser);
      
      // Redirect to team creation
      router.push('/teams/new');
    } catch (err) {
      setError('Signup failed. Please try again.');
      throw new Error('Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const logout = (): void => {
    // Clear from localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    
    // Update state
    setUser(null);
    
    // Redirect to login page
    router.push('/login');
  };

  // Context value
  const contextValue: AuthContextState = {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * HOC to protect routes that require authentication
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuthComponent(props: P & React.JSX.IntrinsicAttributes) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Check authentication on mount and pathname change
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }, [isAuthenticated, isLoading, router, pathname]);

    // If still loading or not authenticated, show nothing
    if (isLoading || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // If authenticated, render the component
    return <Component {...props} />;
  };
}

export default AuthContext;