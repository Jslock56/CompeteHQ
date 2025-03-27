/**
 * Authentication service for handling user auth operations
 */
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser, PERMISSION_SETS, Permission } from '../../models/user';
import { Team, ITeam } from '../../models/team';
import { TeamMembership, ITeamMembership } from '../../models/team-membership';
import { Invitation, IInvitation } from '../../models/invitation';

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-jwt-secret-key-that-should-be-in-env';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d'; // 7 days
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in ms
const RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour in ms
const INVITATION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// Interface for auth responses
export interface AuthResult {
  success: boolean;
  message: string;
  user?: IUser;
  token?: string;
}

// Function to hash a password
async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

// Function to generate a secure random token
function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Auth service class
class AuthService {
  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    invitationToken?: string
  ): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash the password
      const passwordHash = await hashPassword(password);
      
      // Generate verification token
      const verificationToken = generateToken();

      // Create the user
      const user = new User({
        email,
        passwordHash,
        name,
        createdAt: Date.now(),
        teams: [],
        isEmailVerified: false,
        verificationToken
      });

      // Process invitation if provided
      if (invitationToken) {
        const invitation = await Invitation.findOne({ token: invitationToken, used: false });
        
        if (invitation && !invitation.isExpired()) {
          // Mark invitation as used
          invitation.used = true;
          await invitation.save();
          
          // Add user to team
          await this.addUserToTeam(
            user,
            invitation.teamId,
            invitation.role,
            invitation.permissions,
            invitation.invitedBy
          );
          
          // Set email as verified if invited
          user.isEmailVerified = true;
          user.verificationToken = undefined;
        }
      }

      // Save the user
      await user.save();

      // Generate JWT token
      const token = sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return {
        success: true,
        message: 'User registered successfully',
        user,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Log in a user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find the user
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check password
      const isPasswordValid = await compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Generate JWT token
      const token = sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return {
        success: true,
        message: 'Login successful',
        user,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Verify a user's email with verification token
   */
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return {
          success: false,
          message: 'Invalid verification token'
        };
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully',
        user
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed'
      };
    }
  }

  /**
   * Request a password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal that the email doesn't exist
        return {
          success: true,
          message: 'If your email is registered, you will receive a password reset link'
        };
      }

      // Generate reset token
      const resetPasswordToken = generateToken();
      const resetPasswordExpires = Date.now() + RESET_TOKEN_EXPIRY;

      // Update user
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      return {
        success: true,
        message: 'Password reset link sent',
        user
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset request failed'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired password reset token'
        };
      }

      // Update password
      user.passwordHash = await hashPassword(newPassword);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return {
        success: true,
        message: 'Password reset successfully',
        user
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  /**
   * Create a team and add user as head coach
   */
  async createTeam(
    userId: string,
    teamName: string,
    ageGroup: string,
    season: string,
    description?: string
  ): Promise<{ success: boolean; message: string; team?: ITeam }> {
    try {
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Create unique team ID
      const teamId = crypto.randomUUID();
      
      // Create team
      const team = new Team({
        id: teamId,
        name: teamName,
        ageGroup,
        season,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        joinRequiresApproval: true,
        isPublic: true
      });

      await team.save();

      // Add head coach membership
      const membership = new TeamMembership({
        userId,
        teamId: team.id,
        role: 'headCoach',
        permissions: PERMISSION_SETS.HEAD_COACH,
        status: 'active',
        joinedAt: Date.now()
      });

      await membership.save();

      // Update user's teams
      user.addTeam(team.id);
      await user.save();

      return {
        success: true,
        message: 'Team created successfully',
        team
      };
    } catch (error) {
      console.error('Team creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Team creation failed'
      };
    }
  }

  /**
   * Create an invitation for a user to join a team
   */
  async createInvitation(
    inviterUserId: string,
    teamId: string,
    email: string,
    role: 'headCoach' | 'assistant' | 'fan',
    customPermissions?: Permission[]
  ): Promise<{ success: boolean; message: string; invitation?: IInvitation }> {
    try {
      // Verify team exists
      const team = await Team.findOne({ id: teamId });
      if (!team) {
        return {
          success: false,
          message: 'Team not found'
        };
      }

      // Verify inviter has permission
      const inviterMembership = await TeamMembership.findOne({
        userId: inviterUserId,
        teamId,
        status: 'active'
      });

      if (!inviterMembership || !inviterMembership.hasPermission(Permission.MANAGE_USERS)) {
        return {
          success: false,
          message: 'You do not have permission to invite users to this team'
        };
      }

      // Check for existing invitations
      const existingInvitation = await Invitation.findOne({
        email,
        teamId,
        used: false,
        expiresAt: { $gt: Date.now() }
      });

      if (existingInvitation) {
        return {
          success: false,
          message: 'An invitation has already been sent to this email'
        };
      }

      // Get inviter details
      const inviter = await User.findById(inviterUserId);
      
      // Determine permissions based on role or custom permissions
      let permissions: Permission[];
      if (customPermissions && customPermissions.length > 0) {
        permissions = customPermissions;
      } else {
        // Use default permissions for the role
        switch (role) {
          case 'headCoach':
            permissions = PERMISSION_SETS.HEAD_COACH;
            break;
          case 'assistant':
            permissions = PERMISSION_SETS.ASSISTANT_COACH;
            break;
          case 'fan':
            permissions = PERMISSION_SETS.FAN;
            break;
          default:
            permissions = PERMISSION_SETS.FAN;
        }
      }

      // Generate invitation token
      const token = generateToken();
      const expiresAt = Date.now() + INVITATION_EXPIRY;

      // Create invitation
      const invitation = new Invitation({
        email,
        teamId,
        role,
        permissions,
        invitedBy: inviterUserId,
        createdAt: Date.now(),
        expiresAt,
        token,
        used: false,
        teamName: team.name,
        inviterName: inviter?.name
      });

      await invitation.save();

      return {
        success: true,
        message: 'Invitation created successfully',
        invitation
      };
    } catch (error) {
      console.error('Invitation creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Invitation creation failed'
      };
    }
  }

  /**
   * Add a user to a team
   */
  private async addUserToTeam(
    user: IUser,
    teamId: string,
    role: 'headCoach' | 'assistant' | 'fan',
    permissions: Permission[],
    invitedBy?: string
  ): Promise<boolean> {
    try {
      // Check if user is already a member
      const existingMembership = await TeamMembership.findOne({
        userId: user.id,
        teamId
      });

      if (existingMembership) {
        // Update existing membership if needed
        if (
          existingMembership.role !== role ||
          !existingMembership.permissions.every(p => permissions.includes(p as Permission))
        ) {
          existingMembership.role = role;
          existingMembership.permissions = permissions;
          await existingMembership.save();
        }
      } else {
        // Create new membership
        const membership = new TeamMembership({
          userId: user.id,
          teamId,
          role,
          permissions,
          status: 'active',
          invitedBy,
          joinedAt: Date.now()
        });

        await membership.save();
      }

      // Update user's teams if needed
      if (!user.teams.includes(teamId)) {
        user.addTeam(teamId);
        await user.save();
      }

      return true;
    } catch (error) {
      console.error('Error adding user to team:', error);
      return false;
    }
  }

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = verify(token, JWT_SECRET) as { userId: string; email: string };
      return {
        valid: true,
        userId: decoded.userId
      };
    } catch (error) {
      return {
        valid: false
      };
    }
  }

  /**
   * Find user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;