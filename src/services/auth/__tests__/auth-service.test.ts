import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from '../auth-service';
import { User } from '../../../models/user';
import { Invitation } from '../../../models/invitation';
import { TeamMembership } from '../../../models/team-membership';
import { Team } from '../../../models/team';
import { compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

// Mock dependencies
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockImplementation((password) => Promise.resolve(`hashed_${password}`)),
  compare: vi.fn().mockImplementation((password, hash) => {
    return Promise.resolve(hash === `hashed_${password}`);
  })
}));

vi.mock('jsonwebtoken', () => ({
  sign: vi.fn().mockImplementation((payload) => `token_for_${payload.userId || payload.email}`),
  verify: vi.fn().mockImplementation((token) => {
    if (token.includes('invalid')) {
      throw new Error('Invalid token');
    }
    const userId = token.split('_for_')[1];
    return { userId, email: `${userId}@example.com` };
  })
}));

// Mock MongoDB models
vi.mock('../../../models/user', () => {
  const mockUserSchema = {
    methods: {
      addTeam: vi.fn(),
      removeTeam: vi.fn(),
      hasTeam: vi.fn(),
    }
  };
  
  class MockUser {
    static findOne = vi.fn();
    static findById = vi.fn();
    static find = vi.fn();
    
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    teams: string[];
    isEmailVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: number;
    lastLogin?: number;
    createdAt: number;
    
    constructor(data: any) {
      Object.assign(this, data);
      this.addTeam = mockUserSchema.methods.addTeam;
      this.removeTeam = mockUserSchema.methods.removeTeam;
      this.hasTeam = mockUserSchema.methods.hasTeam;
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
    
    toObject = vi.fn().mockImplementation(function() {
      return { ...this };
    });
    
    addTeam(teamId: string) {
      if (!this.teams.includes(teamId)) {
        this.teams.push(teamId);
      }
    }
    
    removeTeam(teamId: string) {
      this.teams = this.teams.filter(id => id !== teamId);
    }
    
    hasTeam(teamId: string) {
      return this.teams.includes(teamId);
    }
  }
  
  return {
    User: MockUser,
    PERMISSION_SETS: {
      HEAD_COACH: ['manage_users', 'manage_players', 'manage_lineups', 'manage_games', 'approve_fans', 'view_players', 'view_lineups', 'view_games'],
      ASSISTANT_COACH: ['manage_players', 'manage_lineups', 'view_players', 'view_lineups', 'view_games'],
      FAN: ['view_players', 'view_games'],
    },
    Permission: {
      MANAGE_USERS: 'manage_users',
      MANAGE_PLAYERS: 'manage_players',
      MANAGE_LINEUPS: 'manage_lineups',
      MANAGE_GAMES: 'manage_games',
      VIEW_PLAYERS: 'view_players',
      VIEW_LINEUPS: 'view_lineups',
      VIEW_GAMES: 'view_games',
      APPROVE_FANS: 'approve_fans',
    }
  };
});

vi.mock('../../../models/invitation', () => {
  class MockInvitation {
    static findOne = vi.fn();
    static findById = vi.fn();
    
    _id: string;
    email: string;
    teamId: string;
    role: string;
    permissions: string[];
    token: string;
    used: boolean;
    expiresAt: number;
    teamName: string;
    invitedBy?: string;
    inviterName?: string;
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
    
    isExpired() {
      return Date.now() > this.expiresAt;
    }
  }
  
  return {
    Invitation: MockInvitation
  };
});

vi.mock('../../../models/team-membership', () => {
  class MockTeamMembership {
    static findOne = vi.fn();
    static findById = vi.fn();
    static findByIdAndDelete = vi.fn();
    static countDocuments = vi.fn();
    
    id: string;
    userId: string;
    teamId: string;
    role: string;
    permissions: string[];
    status: string;
    joinedAt?: number;
    invitedBy?: string;
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
    
    hasPermission(permission: string) {
      return this.permissions.includes(permission);
    }
  }
  
  return {
    TeamMembership: MockTeamMembership
  };
});

vi.mock('../../../models/team', () => {
  class MockTeam {
    static findOne = vi.fn();
    static find = vi.fn();
    
    id: string;
    name: string;
    ageGroup: string;
    season: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    joinRequiresApproval: boolean;
    isPublic: boolean;
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
  }
  
  return {
    Team: MockTeam
  };
});

// Helper function to create a mock user
const createMockUser = (overrides = {}) => {
  return new User({
    id: 'user123',
    email: 'test@example.com',
    passwordHash: 'hashed_password123',
    name: 'Test User',
    teams: [],
    isEmailVerified: false,
    verificationToken: 'verification-token',
    createdAt: Date.now(),
    ...overrides
  });
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.register(
        'new@example.com',
        'password123',
        'New User'
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(User.prototype.save).toHaveBeenCalled();
    });
    
    it('should handle existing email', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(createMockUser());
      
      // Execute
      const result = await authService.register(
        'test@example.com',
        'password123',
        'Test User'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('User with this email already exists');
      expect(User.prototype.save).not.toHaveBeenCalled();
    });
    
    it('should process invitation if valid token provided', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(null);
      
      const mockInvitation = new Invitation({
        _id: 'inv123',
        email: 'invited@example.com',
        teamId: 'team123',
        role: 'assistant',
        permissions: ['view_players', 'view_lineups'],
        token: 'valid-invitation',
        used: false,
        expiresAt: Date.now() + 1000000,
        teamName: 'Test Team',
        invitedBy: 'coach123'
      });
      
      Invitation.findOne = vi.fn().mockResolvedValue(mockInvitation);
      
      // Execute
      const result = await authService.register(
        'invited@example.com',
        'password123',
        'Invited User',
        'valid-invitation'
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.user?.isEmailVerified).toBe(true);
      expect(mockInvitation.used).toBe(true);
      expect(mockInvitation.save).toHaveBeenCalled();
    });
  });
  
  describe('login', () => {
    it('should login a user with correct credentials', async () => {
      // Setup
      const mockUser = createMockUser({
        passwordHash: 'hashed_password123'
      });
      
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await authService.login('test@example.com', 'password123');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.user).toBe(mockUser);
      expect(result.token).toBeDefined();
      expect(mockUser.lastLogin).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should reject login with incorrect password', async () => {
      // Setup
      const mockUser = createMockUser({
        passwordHash: 'hashed_password123'
      });
      
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await authService.login('test@example.com', 'wrong_password');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
      expect(mockUser.save).not.toHaveBeenCalled();
    });
    
    it('should reject login for non-existent user', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.login('nonexistent@example.com', 'password123');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });
  });
  
  describe('verifyEmail', () => {
    it('should verify a user email with valid token', async () => {
      // Setup
      const mockUser = createMockUser();
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await authService.verifyEmail('verification-token');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.verificationToken).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should reject verification with invalid token', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.verifyEmail('invalid-token');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid verification token');
    });
  });
  
  describe('requestPasswordReset', () => {
    it('should generate reset token for existing user', async () => {
      // Setup
      const mockUser = createMockUser();
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await authService.requestPasswordReset('test@example.com');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset link sent');
      expect(mockUser.resetPasswordToken).toBeDefined();
      expect(mockUser.resetPasswordExpires).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should not reveal if email does not exist', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.requestPasswordReset('nonexistent@example.com');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('If your email is registered, you will receive a password reset link');
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Setup
      const mockUser = createMockUser({
        resetPasswordToken: 'valid-reset-token',
        resetPasswordExpires: Date.now() + 3600000 // 1 hour in future
      });
      
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await authService.resetPassword('valid-reset-token', 'new-password');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(mockUser.passwordHash).toBe('hashed_new-password');
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should reject reset with expired token', async () => {
      // Setup
      User.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.resetPassword('expired-token', 'new-password');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired password reset token');
    });
  });
  
  describe('createTeam', () => {
    it('should create a team successfully', async () => {
      // Setup
      const mockUser = createMockUser();
      User.findById = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await authService.createTeam(
        'user123',
        'Test Team',
        '10U',
        'Summer 2023',
        'Team description'
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('Team created successfully');
      expect(result.team).toBeDefined();
      expect(Team.prototype.save).toHaveBeenCalled();
      expect(TeamMembership.prototype.save).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should handle non-existent user', async () => {
      // Setup
      User.findById = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.createTeam(
        'nonexistent',
        'Test Team',
        '10U',
        'Summer 2023'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(Team.prototype.save).not.toHaveBeenCalled();
    });
  });
  
  describe('createInvitation', () => {
    beforeEach(() => {
      // Setup common mocks
      Team.findOne = vi.fn().mockResolvedValue(new Team({
        id: 'team123',
        name: 'Test Team',
        ageGroup: '10U',
        season: 'Summer 2023'
      }));
      
      User.findById = vi.fn().mockResolvedValue(createMockUser({
        id: 'coach123',
        name: 'Coach User'
      }));
      
      Invitation.findOne = vi.fn().mockResolvedValue(null);
    });
    
    it('should create an invitation successfully', async () => {
      // Setup
      TeamMembership.findOne = vi.fn().mockResolvedValue(new TeamMembership({
        userId: 'coach123',
        teamId: 'team123',
        role: 'headCoach',
        permissions: ['manage_users', 'approve_fans'],
        status: 'active'
      }));
      
      // Execute
      const result = await authService.createInvitation(
        'coach123',
        'team123',
        'invite@example.com',
        'assistant'
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation created successfully');
      expect(result.invitation).toBeDefined();
      expect(Invitation.prototype.save).toHaveBeenCalled();
    });
    
    it('should reject if inviter lacks permission', async () => {
      // Setup
      TeamMembership.findOne = vi.fn().mockResolvedValue(new TeamMembership({
        userId: 'coach123',
        teamId: 'team123',
        role: 'assistant',
        permissions: ['view_players', 'view_lineups'], // No manage_users permission
        status: 'active'
      }));
      
      // Execute
      const result = await authService.createInvitation(
        'coach123',
        'team123',
        'invite@example.com',
        'fan'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to invite users to this team');
      expect(Invitation.prototype.save).not.toHaveBeenCalled();
    });
    
    it('should reject if team does not exist', async () => {
      // Setup
      Team.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await authService.createInvitation(
        'coach123',
        'nonexistent',
        'invite@example.com',
        'fan'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Team not found');
    });
    
    it('should reject if invitation already exists', async () => {
      // Setup
      TeamMembership.findOne = vi.fn().mockResolvedValue(new TeamMembership({
        userId: 'coach123',
        teamId: 'team123',
        role: 'headCoach',
        permissions: ['manage_users', 'approve_fans'],
        status: 'active'
      }));
      
      Invitation.findOne = vi.fn().mockResolvedValue(new Invitation({
        email: 'invite@example.com',
        teamId: 'team123',
        used: false,
        expiresAt: Date.now() + 1000000
      }));
      
      // Execute
      const result = await authService.createInvitation(
        'coach123',
        'team123',
        'invite@example.com',
        'assistant'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('An invitation has already been sent to this email');
    });
  });
  
  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      // Execute
      const result = await authService.verifyToken('token_for_user123');
      
      // Verify
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user123');
    });
    
    it('should reject an invalid token', async () => {
      // Execute
      const result = await authService.verifyToken('invalid_token');
      
      // Verify
      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });
  });
  
  describe('createTemporaryToken', () => {
    it('should create a temporary token', () => {
      // Execute
      const token = authService.createTemporaryToken('user123');
      
      // Verify
      expect(token).toBe('token_for_user123');
      expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({ 
          userId: 'user123', 
          isSystemToken: true 
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: '1h' })
      );
    });
  });
  
  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      // Setup
      const mockUser = createMockUser();
      User.findById = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const user = await authService.getUserById('user123');
      
      // Verify
      expect(user).toBe(mockUser);
      expect(User.findById).toHaveBeenCalledWith('user123');
    });
    
    it('should return null for non-existent user', async () => {
      // Setup
      User.findById = vi.fn().mockResolvedValue(null);
      
      // Execute
      const user = await authService.getUserById('nonexistent');
      
      // Verify
      expect(user).toBeNull();
    });
  });
});