'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Permission } from '../models/user';

// User interface for MongoDB integration
interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  teams: string[];
  activeTeamId?: string;
  createdAt: number;
  isEmailVerified: boolean;
}

// Team membership type
interface TeamMembership {
  teamId: string;
  role: 'headCoach' | 'assistant' | 'fan';
  permissions: Permission[];
  status: 'active' | 'pending' | 'invited';
}

// Auth context state interface
interface AuthContextState {
  // Authentication state
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Current team info
  activeTeam: {
    id: string;
    name: string;
    role: 'headCoach' | 'assistant' | 'fan';
    permissions: Permission[];
  } | null;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, invitationToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Team methods
  setActiveTeam: (teamId: string) => Promise<boolean>;
  
  // Permission helpers
  hasPermission: (permission: Permission) => boolean;
  isHeadCoach: () => boolean;
}

// Create the context with a default empty state
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth provider component
 * Integrated with MongoDB user model
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [teamMemberships, setTeamMemberships] = useState<Record<string, TeamMembership>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Active team information
  const [activeTeam, setActiveTeam] = useState<AuthContextState['activeTeam']>(null);

  // Load user on initial mount and check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.user) {
            console.log('Auth check successful, user data:', data.user);
            setUser(data.user);
            
            // If there's an active team, load team memberships
            if (data.user.activeTeamId) {
              console.log('User has activeTeamId:', data.user.activeTeamId);
              loadTeamMemberships(data.user);
            } else if (data.user.teams && data.user.teams.length > 0) {
              console.log('User has teams but no active team:', data.user.teams);
              // Auto-set the first team if they have teams but no active
              const firstTeam = data.user.teams[0];
              changeActiveTeam(firstTeam);
            }
          } else {
            setUser(null);
            setTeamMemberships({});
          }
        } else {
          setUser(null);
          setTeamMemberships({});
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setTeamMemberships({});
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Load team memberships and set active team when user or activeTeamId changes
  const loadTeamMemberships = async (currentUser: User) => {
    if (!currentUser) {
      setActiveTeam(null);
      return;
    }
    
    try {
      console.log('Loading team memberships for user:', currentUser.id);
      const response = await fetch('/api/teams/memberships');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Team memberships API response:', data);
        
        if (data.success && data.memberships) {
          // Convert array to record for easier lookup
          const membershipsRecord: Record<string, TeamMembership> = {};
          
          data.memberships.forEach((membership: TeamMembership) => {
            membershipsRecord[membership.teamId] = membership;
          });
          
          setTeamMemberships(membershipsRecord);
          
          // Set active team info if the user has an active team
          if (currentUser.activeTeamId && membershipsRecord[currentUser.activeTeamId]) {
            const activeTeamData = data.teams.find((t: any) => t.id === currentUser.activeTeamId);
            
            if (activeTeamData) {
              console.log('Setting active team:', activeTeamData.id);
              setActiveTeam({
                id: activeTeamData.id,
                name: activeTeamData.name,
                role: membershipsRecord[currentUser.activeTeamId].role,
                permissions: membershipsRecord[currentUser.activeTeamId].permissions
              });
            }
          } else if (data.teams && data.teams.length > 0 && !currentUser.activeTeamId) {
            // If user has teams but no active team set, suggest the first team
            console.log('No active team, but user has teams. First team:', data.teams[0].id);
          }
        }
      } else {
        console.error('Error fetching team memberships:', await response.text());
      }
    } catch (error) {
      console.error('Error loading team memberships:', error);
    }
  };

  // Handle login with MongoDB
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    console.log(`Auth context: Login attempt for ${email}`);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log(`Auth context: Login response status: ${response.status}`);
      const data = await response.json();
      console.log(`Auth context: Login response data:`, data);
      
      if (response.ok && data.success) {
        console.log(`Auth context: Login successful for ${email}`);
        // Set user from response
        setUser(data.user);
        
        // Store token in localStorage for API calls
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.token);
        }
        
        // If user has teams, load memberships
        if (data.user.teams?.length > 0) {
          await loadTeamMemberships(data.user);
        }
        
        // Debug: log current state
        console.log("Login success, user data:", data.user);
        console.log("User teams:", data.user.teams);
        console.log("Active team ID:", data.user.activeTeamId);
        
        // Override normal flow - force redirect to teams/new for debugging
        console.log("DEBUG: Forcing redirect to dashboard");
        router.push('/dashboard');
        
        /* Commenting out normal flow for debugging
        // Navigate to dashboard if they have an active team
        if (data.user.activeTeamId) {
          console.log("User has active team, redirecting to dashboard");
          router.push('/dashboard');
        } 
        // If they have teams but no active team, go to team selection or set the first team
        else if (data.user.teams?.length > 0) {
          // If they have at least one team but no active team, set the first team as active
          if (data.user.teams.length === 1) {
            console.log("User has one team, setting as active");
            // Set the first team as active
            await changeActiveTeam(data.user.teams[0]);
            router.push('/dashboard');
          } else {
            console.log("User has multiple teams, redirecting to team selection");
            router.push('/teams/select');
          }
        } 
        // If they have no teams, go to team creation
        else {
          console.log("User has no teams, redirecting to team creation");
          router.push('/teams/new');
        }
        */
        
        return true;
      } else {
        setError(data.message || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration with MongoDB
  const register = async (
    name: string,
    email: string, 
    password: string,
    invitationToken?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name,
          email, 
          password,
          invitationToken
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Registration successful:', data);
        
        // Set user from response
        setUser(data.user);
        
        // Store token in localStorage for API calls
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.token);
        }
        
        // If invited to a team, active team will be set
        if (data.user.activeTeamId) {
          await loadTeamMemberships(data.user);
          router.push('/dashboard');
        } else {
          // New user without a team - redirect to role selection
          console.log('Redirecting to role selection page');
          setTimeout(() => {
            router.push('/select-role');
          }, 500);
        }
        
        return true;
      } else {
        setError(data.message || 'Registration failed');
        return false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout with API
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear state
      setUser(null);
      setTeamMemberships({});
      setActiveTeam(null);
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          loadTeamMemberships(data.user);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };
  
  // Set active team
  const changeActiveTeam = async (teamId: string): Promise<boolean> => {
    if (!user || !user.teams.includes(teamId)) {
      return false;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/set-active-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update user with new active team
        setUser(prev => prev ? { ...prev, activeTeamId: teamId } : null);
        
        // Reload team memberships
        if (user) {
          const updatedUser = { ...user, activeTeamId: teamId };
          loadTeamMemberships(updatedUser);
        }
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Set active team error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if current user has a specific permission for active team
  const hasPermission = (permission: Permission): boolean => {
    if (!user || !activeTeam) return false;
    
    return activeTeam.permissions.includes(permission);
  };
  
  // Check if current user is a head coach
  const isHeadCoach = (): boolean => {
    return activeTeam?.role === 'headCoach';
  };

  // Context value
  const contextValue: AuthContextState = {
    user,
    isLoading,
    error,
    isAuthenticated,
    activeTeam,
    login,
    register,
    logout,
    refreshUser,
    setActiveTeam: changeActiveTeam,
    hasPermission,
    isHeadCoach
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
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }
    }, [isAuthenticated, isLoading, router, pathname]);

    // If still loading or not authenticated, show loading
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

/**
 * HOC to protect routes that require specific permissions
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: Permission
) {
  return function WithPermissionComponent(props: P & React.JSX.IntrinsicAttributes) {
    const { isAuthenticated, isLoading, hasPermission, activeTeam } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Check authentication and permission on mount and pathname change
    useEffect(() => {
      if (!isLoading) {
        // First check if authenticated
        if (!isAuthenticated) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        } 
        // Then check if has active team
        else if (!activeTeam) {
          router.push('/teams/select');
        }
        // Finally check permission
        else if (!hasPermission(requiredPermission)) {
          router.push('/dashboard?error=permission');
        }
      }
    }, [isAuthenticated, isLoading, hasPermission, activeTeam, router, pathname]);

    // If still loading or checks fail, show loading
    if (isLoading || !isAuthenticated || !activeTeam || !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // If all checks pass, render the component
    return <Component {...props} />;
  };
}

/**
 * HOC to protect routes that require head coach role
 */
export function withHeadCoach<P extends object>(Component: React.ComponentType<P>) {
  return function WithHeadCoachComponent(props: P & React.JSX.IntrinsicAttributes) {
    const { isAuthenticated, isLoading, isHeadCoach, activeTeam } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Check authentication and role on mount and pathname change
    useEffect(() => {
      if (!isLoading) {
        // First check if authenticated
        if (!isAuthenticated) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        } 
        // Then check if has active team
        else if (!activeTeam) {
          router.push('/teams/select');
        }
        // Finally check if head coach
        else if (!isHeadCoach()) {
          router.push('/dashboard?error=permission');
        }
      }
    }, [isAuthenticated, isLoading, isHeadCoach, activeTeam, router, pathname]);

    // If still loading or checks fail, show loading
    if (isLoading || !isAuthenticated || !activeTeam || !isHeadCoach()) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // If all checks pass, render the component
    return <Component {...props} />;
  };
}

export default AuthContext;