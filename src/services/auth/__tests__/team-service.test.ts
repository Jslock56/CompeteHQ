import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { teamService } from '../team-service';
import { User, Permission } from '../../../models/user';
import { Team } from '../../../models/team';
import { TeamMembership } from '../../../models/team-membership';
import { TeamCode } from '../../../models/team-code';
import { Notification } from '../../../models/notification';

// Mock MongoDB models
vi.mock('../../../models/user', () => {
  class MockUser {
    static findOne = vi.fn();
    static findById = vi.fn();
    static find = vi.fn();
    
    id: string;
    name: string;
    email: string;
    teams: string[];
    
    constructor(data: any) {
      Object.assign(this, data);
      this.teams = data.teams || [];
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
    
    addTeam(teamId: string) {
      if (!this.teams.includes(teamId)) {
        this.teams.push(teamId);
      }
    }
    
    removeTeam(teamId: string) {
      this.teams = this.teams.filter(id => id !== teamId);
    }
  }
  
  return {
    User: MockUser,
    Permission: {
      MANAGE_USERS: 'manage_users',
      MANAGE_PLAYERS: 'manage_players',
      MANAGE_LINEUPS: 'manage_lineups',
      MANAGE_GAMES: 'manage_games',
      VIEW_PLAYERS: 'view_players',
      VIEW_LINEUPS: 'view_lineups',
      VIEW_GAMES: 'view_games',
      APPROVE_FANS: 'approve_fans',
    },
    PERMISSION_SETS: {
      HEAD_COACH: ['manage_users', 'manage_players', 'manage_lineups', 'manage_games', 'approve_fans', 'view_players', 'view_lineups', 'view_games'],
      ASSISTANT_COACH: ['manage_players', 'manage_lineups', 'view_players', 'view_lineups', 'view_games'],
      FAN: ['view_players', 'view_games'],
    }
  };
});

vi.mock('../../../models/team', () => {
  class MockTeam {
    static findOne = vi.fn();
    static find = vi.fn();
    static countDocuments = vi.fn();
    
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
    
    toObject = vi.fn().mockImplementation(function() {
      return { ...this };
    });
  }
  
  return {
    Team: MockTeam
  };
});

vi.mock('../../../models/team-membership', () => {
  class MockTeamMembership {
    static findOne = vi.fn();
    static find = vi.fn();
    static findById = vi.fn();
    static findByIdAndDelete = vi.fn();
    static countDocuments = vi.fn();
    
    _id: string;
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

vi.mock('../../../models/team-code', () => {
  class MockTeamCode {
    static findOne = vi.fn();
    static find = vi.fn();
    
    _id: string;
    teamId: string;
    code: string;
    createdAt: number;
    expiresAt: number;
    maxUses?: number;
    uses: number;
    isActive: boolean;
    createdBy: string;
    
    constructor(data: any) {
      Object.assign(this, data);
      this.uses = data.uses || 0;
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
    
    incrementUses() {
      this.uses += 1;
      if (this.maxUses && this.uses >= this.maxUses) {
        this.isActive = false;
      }
    }
    
    isValid() {
      return this.isActive && this.expiresAt > Date.now() && 
        (!this.maxUses || this.uses < this.maxUses);
    }
  }
  
  return {
    TeamCode: MockTeamCode
  };
});

vi.mock('../../../models/notification', () => {
  class MockNotification {
    static findOne = vi.fn();
    static find = vi.fn();
    
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
    actionUrl?: string;
    createdAt: number;
    read: boolean;
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockImplementation(function() {
      return Promise.resolve(this);
    });
  }
  
  return {
    Notification: MockNotification
  };
});

// Helper to create mock objects
const createMockTeam = (overrides = {}) => {
  return new Team({
    id: 'team123',
    name: 'Test Team',
    ageGroup: '10U',
    season: 'Summer 2023',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'user123',
    joinRequiresApproval: true,
    isPublic: true,
    ...overrides
  });
};

const createMockUser = (overrides = {}) => {
  return new User({
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    teams: [],
    ...overrides
  });
};

const createMockMembership = (overrides = {}) => {
  return new TeamMembership({
    _id: 'membership123',
    userId: 'user123',
    teamId: 'team123',
    role: 'headCoach',
    permissions: [Permission.MANAGE_USERS, Permission.MANAGE_PLAYERS],
    status: 'active',
    joinedAt: Date.now(),
    ...overrides
  });
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('teamService', () => {
  describe('getUserTeams', () => {
    it('should return teams with roles', async () => {
      // Setup
      const mockMemberships = [
        createMockMembership(),
        createMockMembership({
          _id: 'membership456',
          teamId: 'team456',
          role: 'fan'
        })
      ];
      
      const mockTeams = [
        createMockTeam(),
        createMockTeam({
          id: 'team456',
          name: 'Second Team'
        })
      ];
      
      TeamMembership.find = vi.fn().mockResolvedValue(mockMemberships);
      Team.find = vi.fn().mockResolvedValue(mockTeams);
      
      // Execute
      const result = await teamService.getUserTeams('user123');
      
      // Verify
      expect(TeamMembership.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(Team.find).toHaveBeenCalledWith({ id: { $in: ['team123', 'team456'] } });
      expect(result.teams).toHaveLength(2);
      expect(result.teams[0].role).toBe('headCoach');
      expect(result.teams[1].role).toBe('fan');
    });
    
    it('should handle no teams', async () => {
      // Setup
      TeamMembership.find = vi.fn().mockResolvedValue([]);
      Team.find = vi.fn().mockResolvedValue([]);
      
      // Execute
      const result = await teamService.getUserTeams('user123');
      
      // Verify
      expect(result.teams).toHaveLength(0);
    });
  });
  
  describe('getTeamDetails', () => {
    it('should return team details with user membership', async () => {
      // Setup
      const mockTeam = createMockTeam();
      const mockMembership = createMockMembership();
      
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.countDocuments = vi.fn().mockResolvedValue(5);
      
      // Execute
      const result = await teamService.getTeamDetails('team123', 'user123');
      
      // Verify
      expect(Team.findOne).toHaveBeenCalledWith({ id: 'team123' });
      expect(TeamMembership.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        teamId: 'team123'
      });
      expect(result.team).toBe(mockTeam);
      expect(result.userMembership).toBe(mockMembership);
      expect(result.memberCount).toBe(5);
    });
    
    it('should handle team not found', async () => {
      // Setup
      Team.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await teamService.getTeamDetails('nonexistent');
      
      // Verify
      expect(result.team).toBeNull();
    });
  });
  
  describe('generateTeamCode', () => {
    it('should generate a team code successfully', async () => {
      // Setup
      const mockTeam = createMockTeam();
      const mockMembership = createMockMembership();
      
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockMembership);
      TeamCode.findOne = vi.fn().mockResolvedValue(null); // No collision
      
      // Execute
      const result = await teamService.generateTeamCode('team123', 'user123', 48);
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(TeamCode.prototype.save).toHaveBeenCalled();
    });
    
    it('should reject if user lacks permission', async () => {
      // Setup
      const mockTeam = createMockTeam();
      const mockMembership = createMockMembership({
        permissions: [Permission.VIEW_PLAYERS] // No MANAGE_USERS permission
      });
      
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockMembership);
      
      // Execute
      const result = await teamService.generateTeamCode('team123', 'user123');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to generate team codes');
      expect(TeamCode.prototype.save).not.toHaveBeenCalled();
    });
    
    it('should handle team not found', async () => {
      // Setup
      Team.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await teamService.generateTeamCode('nonexistent', 'user123');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Team not found');
    });
  });
  
  describe('joinTeamWithCode', () => {
    it('should join team successfully with approval not required', async () => {
      // Setup
      const mockTeamCode = new TeamCode({
        _id: 'code123',
        teamId: 'team123',
        code: 'ABC123',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        uses: 0,
        isActive: true,
        createdBy: 'user456'
      });
      
      const mockTeam = createMockTeam({
        joinRequiresApproval: false
      });
      
      const mockUser = createMockUser();
      
      TeamCode.findOne = vi.fn().mockResolvedValue(mockTeamCode);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findOne = vi.fn().mockResolvedValue(null); // No existing membership
      User.findById = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await teamService.joinTeamWithCode('ABC123', 'user123');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.requiresApproval).toBe(false);
      expect(mockTeamCode.incrementUses).toHaveBeenCalled();
      expect(mockTeamCode.save).toHaveBeenCalled();
      expect(TeamMembership.prototype.save).toHaveBeenCalled();
      expect(mockUser.addTeam).toHaveBeenCalledWith('team123');
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should create pending membership if approval required', async () => {
      // Setup
      const mockTeamCode = new TeamCode({
        _id: 'code123',
        teamId: 'team123',
        code: 'ABC123',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        uses: 0,
        isActive: true,
        createdBy: 'user456'
      });
      
      const mockTeam = createMockTeam({
        joinRequiresApproval: true
      });
      
      const mockUser = createMockUser();
      
      const mockHeadCoaches = [
        createMockMembership({
          userId: 'coach1',
          role: 'headCoach'
        }),
        createMockMembership({
          userId: 'coach2',
          role: 'headCoach'
        })
      ];
      
      TeamCode.findOne = vi.fn().mockResolvedValue(mockTeamCode);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findOne = vi.fn().mockResolvedValue(null);
      User.findById = vi.fn().mockResolvedValue(mockUser);
      TeamMembership.find = vi.fn().mockResolvedValue(mockHeadCoaches);
      
      // Execute
      const result = await teamService.joinTeamWithCode('ABC123', 'user123');
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(TeamMembership.prototype.save).toHaveBeenCalled();
      expect(Notification.prototype.save).toHaveBeenCalledTimes(2); // One for each head coach
    });
    
    it('should handle invalid code', async () => {
      // Setup
      TeamCode.findOne = vi.fn().mockResolvedValue(null);
      
      // Execute
      const result = await teamService.joinTeamWithCode('INVALID', 'user123');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired team code');
    });
    
    it('should handle already a member', async () => {
      // Setup
      const mockTeamCode = new TeamCode({
        _id: 'code123',
        teamId: 'team123',
        code: 'ABC123',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        uses: 0,
        isActive: true
      });
      
      const mockTeam = createMockTeam();
      
      const mockMembership = createMockMembership({
        status: 'active'
      });
      
      TeamCode.findOne = vi.fn().mockResolvedValue(mockTeamCode);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockMembership);
      
      // Execute
      const result = await teamService.joinTeamWithCode('ABC123', 'user123');
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('You are already a member of this team');
    });
  });
  
  describe('processJoinRequest', () => {
    it('should approve join request successfully', async () => {
      // Setup
      const mockMembership = createMockMembership({
        status: 'pending',
        joinedAt: undefined
      });
      
      const mockApproverMembership = createMockMembership({
        userId: 'approver',
        permissions: [Permission.APPROVE_FANS]
      });
      
      const mockTeam = createMockTeam();
      const mockUser = createMockUser();
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockApproverMembership);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      User.findById = vi.fn().mockResolvedValue(mockUser);
      
      // Execute
      const result = await teamService.processJoinRequest(
        'requestId', 
        'approver', 
        true
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(mockMembership.status).toBe('active');
      expect(mockMembership.joinedAt).toBeDefined();
      expect(mockMembership.invitedBy).toBe('approver');
      expect(mockMembership.save).toHaveBeenCalled();
      expect(Notification.prototype.save).toHaveBeenCalled();
    });
    
    it('should deny join request successfully', async () => {
      // Setup
      const mockMembership = createMockMembership({
        status: 'pending'
      });
      
      const mockApproverMembership = createMockMembership({
        userId: 'approver',
        permissions: [Permission.APPROVE_FANS]
      });
      
      const mockTeam = createMockTeam();
      const mockUser = createMockUser();
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockApproverMembership);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      User.findById = vi.fn().mockResolvedValue(mockUser);
      TeamMembership.findByIdAndDelete = vi.fn().mockResolvedValue(true);
      
      // Execute
      const result = await teamService.processJoinRequest(
        'requestId', 
        'approver', 
        false
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(TeamMembership.findByIdAndDelete).toHaveBeenCalledWith('requestId');
      expect(mockUser.removeTeam).toHaveBeenCalledWith('team123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(Notification.prototype.save).toHaveBeenCalled();
    });
    
    it('should reject if approver lacks permission', async () => {
      // Setup
      const mockMembership = createMockMembership({
        status: 'pending'
      });
      
      const mockApproverMembership = createMockMembership({
        userId: 'approver',
        permissions: [Permission.VIEW_PLAYERS] // No APPROVE_FANS permission
      });
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockApproverMembership);
      
      // Execute
      const result = await teamService.processJoinRequest(
        'requestId', 
        'approver', 
        true
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to approve join requests');
    });
  });
  
  describe('getTeamMembers', () => {
    it('should return team members with user data', async () => {
      // Setup
      const mockMemberships = [
        createMockMembership(),
        createMockMembership({
          _id: 'membership456',
          userId: 'user456',
          role: 'assistant'
        })
      ];
      
      const mockUsers = [
        createMockUser(),
        createMockUser({
          id: 'user456',
          name: 'Assistant User',
          email: 'assistant@example.com'
        })
      ];
      
      TeamMembership.find = vi.fn().mockResolvedValue(mockMemberships);
      User.find = vi.fn().mockResolvedValue(mockUsers);
      
      // Execute
      const result = await teamService.getTeamMembers('team123');
      
      // Verify
      expect(TeamMembership.find).toHaveBeenCalledWith({ teamId: 'team123', status: 'active' });
      expect(User.find).toHaveBeenCalledWith({ _id: { $in: ['user123', 'user456'] } });
      expect(result.members).toHaveLength(2);
      expect(result.members[0].membership).toBe(mockMemberships[0]);
      expect(result.members[0].user).toBe(mockUsers[0]);
    });
    
    it('should handle filter by status', async () => {
      // Setup
      TeamMembership.find = vi.fn().mockResolvedValue([]);
      User.find = vi.fn().mockResolvedValue([]);
      
      // Execute
      await teamService.getTeamMembers('team123', 'pending');
      
      // Verify
      expect(TeamMembership.find).toHaveBeenCalledWith({ teamId: 'team123', status: 'pending' });
    });
  });
  
  describe('updateMemberPermissions', () => {
    it('should update permissions successfully', async () => {
      // Setup
      const mockMembership = createMockMembership();
      
      const mockUpdaterMembership = createMockMembership({
        userId: 'updater',
        permissions: [Permission.MANAGE_USERS]
      });
      
      const mockTeam = createMockTeam();
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockUpdaterMembership);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      
      // Execute
      const result = await teamService.updateMemberPermissions(
        'membershipId', 
        'updater',
        'assistant', // Change role
        [Permission.VIEW_LINEUPS, Permission.VIEW_PLAYERS] // Custom permissions
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(mockMembership.role).toBe('assistant');
      expect(mockMembership.permissions).toEqual([Permission.VIEW_LINEUPS, Permission.VIEW_PLAYERS]);
      expect(mockMembership.save).toHaveBeenCalled();
      expect(Notification.prototype.save).toHaveBeenCalled();
    });
    
    it('should reject if updater lacks permission', async () => {
      // Setup
      const mockMembership = createMockMembership();
      
      const mockUpdaterMembership = createMockMembership({
        userId: 'updater',
        permissions: [Permission.VIEW_PLAYERS] // No MANAGE_USERS permission
      });
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockUpdaterMembership);
      
      // Execute
      const result = await teamService.updateMemberPermissions(
        'membershipId', 
        'updater',
        'assistant'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to update member permissions');
    });
    
    it('should prevent head coaches from changing other head coaches', async () => {
      // Setup
      const mockMembership = createMockMembership({
        role: 'headCoach',
        userId: 'otherCoach'
      });
      
      const mockUpdaterMembership = createMockMembership({
        userId: 'updater',
        role: 'headCoach',
        permissions: [Permission.MANAGE_USERS]
      });
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockUpdaterMembership);
      
      // Execute
      const result = await teamService.updateMemberPermissions(
        'membershipId', 
        'updater',
        'assistant'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('You cannot change permissions for other head coaches');
    });
  });
  
  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      // Setup
      const mockMembership = createMockMembership({
        userId: 'memberToRemove'
      });
      
      const mockRemoverMembership = createMockMembership({
        userId: 'remover',
        permissions: [Permission.MANAGE_USERS]
      });
      
      const mockUser = createMockUser({
        id: 'memberToRemove'
      });
      
      const mockTeam = createMockTeam();
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockRemoverMembership);
      User.findById = vi.fn().mockResolvedValue(mockUser);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findByIdAndDelete = vi.fn().mockResolvedValue(true);
      
      // Execute
      const result = await teamService.removeMember(
        'membershipId', 
        'remover'
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(TeamMembership.findByIdAndDelete).toHaveBeenCalledWith('membershipId');
      expect(mockUser.removeTeam).toHaveBeenCalledWith('team123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(Notification.prototype.save).toHaveBeenCalled();
    });
    
    it('should allow self-removal without permission check', async () => {
      // Setup
      const mockMembership = createMockMembership({
        userId: 'user123' // Same as remover
      });
      
      const mockUser = createMockUser();
      const mockTeam = createMockTeam();
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(null); // No membership found
      User.findById = vi.fn().mockResolvedValue(mockUser);
      Team.findOne = vi.fn().mockResolvedValue(mockTeam);
      TeamMembership.findByIdAndDelete = vi.fn().mockResolvedValue(true);
      
      // Execute
      const result = await teamService.removeMember(
        'membershipId', 
        'user123' // Same as userId in mockMembership
      );
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('You have left the team');
      expect(TeamMembership.findByIdAndDelete).toHaveBeenCalled();
      expect(Notification.prototype.save).not.toHaveBeenCalled(); // No notification for self-removal
    });
    
    it('should prevent removing last head coach', async () => {
      // Setup
      const mockMembership = createMockMembership({
        role: 'headCoach'
      });
      
      const mockRemoverMembership = createMockMembership({
        userId: 'remover',
        permissions: [Permission.MANAGE_USERS]
      });
      
      TeamMembership.findById = vi.fn().mockResolvedValue(mockMembership);
      TeamMembership.findOne = vi.fn().mockResolvedValue(mockRemoverMembership);
      TeamMembership.countDocuments = vi.fn().mockResolvedValue(1); // Only one head coach
      
      // Execute
      const result = await teamService.removeMember(
        'membershipId', 
        'remover'
      );
      
      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot remove the last head coach from a team');
      expect(TeamMembership.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
  
  describe('searchTeams', () => {
    it('should search teams by text', async () => {
      // Setup
      const mockTeams = [
        createMockTeam(),
        createMockTeam({
          id: 'team456',
          name: 'Another Team'
        })
      ];
      
      Team.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockTeams)
        })
      });
      
      // Execute
      const result = await teamService.searchTeams('test');
      
      // Verify
      expect(Team.find).toHaveBeenCalledWith(
        {
          $text: { $search: 'test' },
          isPublic: true
        },
        { score: { $meta: 'textScore' } }
      );
      expect(result.teams).toEqual(mockTeams);
    });
  });
});