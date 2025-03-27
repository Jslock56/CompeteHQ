/**
 * Team service for handling team operations
 */
import crypto from 'crypto';
import { Team, ITeam } from '../../models/team';
import { TeamMembership, ITeamMembership, MembershipRole } from '../../models/team-membership';
import { User, IUser, Permission, PERMISSION_SETS } from '../../models/user';
import { TeamCode, ITeamCode } from '../../models/team-code';
import { Notification } from '../../models/notification';

class TeamService {
  /**
   * Get all teams a user is a member of
   */
  async getUserTeams(userId: string): Promise<{
    teams: Array<ITeam & { role: MembershipRole; isActive: boolean }>;
  }> {
    // Find all team memberships for this user
    const memberships = await TeamMembership.find({ userId });
    
    // Get team IDs
    const teamIds = memberships.map(membership => membership.teamId);
    
    // Get teams
    const teams = await Team.find({ id: { $in: teamIds } });
    
    // Map teams with roles
    const teamsWithRoles = teams.map(team => {
      const membership = memberships.find(m => m.teamId === team.id);
      return {
        ...team.toObject(),
        role: membership?.role || 'fan',
        isActive: membership?.status === 'active'
      };
    });
    
    return { teams: teamsWithRoles };
  }

  /**
   * Get details of a specific team
   */
  async getTeamDetails(teamId: string, userId?: string): Promise<{
    team: ITeam | null;
    userMembership?: ITeamMembership | null;
    memberCount?: number;
  }> {
    // Get team
    const team = await Team.findOne({ id: teamId });
    
    if (!team) {
      return { team: null };
    }
    
    // If userId provided, get user's membership
    let userMembership = null;
    if (userId) {
      userMembership = await TeamMembership.findOne({
        userId,
        teamId,
      });
      
      // Get member count
      const memberCount = await TeamMembership.countDocuments({
        teamId,
        status: 'active'
      });
      
      return {
        team,
        userMembership,
        memberCount
      };
    }
    
    return { team };
  }

  /**
   * Generate a team join code
   */
  async generateTeamCode(
    teamId: string,
    userId: string,
    expiresInHours: number = 48,
    maxUses?: number
  ): Promise<{
    success: boolean;
    message: string;
    code?: string;
  }> {
    try {
      // Verify team exists
      const team = await Team.findOne({ id: teamId });
      if (!team) {
        return {
          success: false,
          message: 'Team not found'
        };
      }
      
      // Check if user has permission
      const membership = await TeamMembership.findOne({
        userId,
        teamId,
        status: 'active'
      });
      
      if (!membership || !membership.hasPermission(Permission.MANAGE_USERS)) {
        return {
          success: false,
          message: 'You do not have permission to generate team codes'
        };
      }
      
      // Generate a 6-character alphanumeric code
      // This is shorter and easier to share than a full UUID
      const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };
      
      // Make sure code is unique
      let code = generateCode();
      let existingCode = await TeamCode.findOne({ code });
      
      // Try a few times if there's a collision
      for (let i = 0; i < 5 && existingCode; i++) {
        code = generateCode();
        existingCode = await TeamCode.findOne({ code });
      }
      
      if (existingCode) {
        // Very unlikely, but handle it
        return {
          success: false,
          message: 'Failed to generate a unique team code. Please try again.'
        };
      }
      
      // Calculate expiration time
      const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000);
      
      // Create team code
      const teamCode = new TeamCode({
        teamId,
        code,
        createdAt: Date.now(),
        expiresAt,
        maxUses,
        uses: 0,
        createdBy: userId,
        isActive: true
      });
      
      await teamCode.save();
      
      return {
        success: true,
        message: 'Team code generated successfully',
        code
      };
    } catch (error) {
      console.error('Error generating team code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate team code'
      };
    }
  }

  /**
   * Join a team using a code
   */
  async joinTeamWithCode(
    code: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    requiresApproval?: boolean;
    team?: ITeam;
  }> {
    try {
      // Find team code
      const teamCode = await TeamCode.findOne({ code });
      
      if (!teamCode || !teamCode.isValid()) {
        return {
          success: false,
          message: 'Invalid or expired team code'
        };
      }
      
      // Get team
      const team = await Team.findOne({ id: teamCode.teamId });
      if (!team) {
        return {
          success: false,
          message: 'Team not found'
        };
      }
      
      // Check if user is already a member
      const existingMembership = await TeamMembership.findOne({
        userId,
        teamId: team.id
      });
      
      if (existingMembership) {
        if (existingMembership.status === 'active') {
          return {
            success: false,
            message: 'You are already a member of this team',
            team
          };
        } else if (existingMembership.status === 'pending') {
          return {
            success: false,
            message: 'Your request to join this team is pending approval',
            team
          };
        }
      }
      
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Create membership with fan role
      const membership = new TeamMembership({
        userId,
        teamId: team.id,
        role: 'fan',
        permissions: PERMISSION_SETS.FAN,
        status: team.joinRequiresApproval ? 'pending' : 'active',
        joinedAt: team.joinRequiresApproval ? undefined : Date.now()
      });
      
      await membership.save();
      
      // Update team code usage
      teamCode.incrementUses();
      await teamCode.save();
      
      // Add team to user's teams
      user.addTeam(team.id);
      await user.save();
      
      // If approval is required, send notifications to head coaches
      if (team.joinRequiresApproval) {
        const headCoaches = await TeamMembership.find({
          teamId: team.id,
          role: 'headCoach',
          status: 'active'
        });
        
        // Create notifications for head coaches
        for (const coach of headCoaches) {
          const notification = new Notification({
            userId: coach.userId,
            type: 'request',
            title: 'New join request',
            message: `${user.name} has requested to join team ${team.name}`,
            relatedId: membership.id,
            actionUrl: `/teams/${team.id}/members/requests`,
            createdAt: Date.now(),
            read: false
          });
          
          await notification.save();
        }
        
        return {
          success: true,
          message: 'Join request submitted and awaiting approval',
          requiresApproval: true,
          team
        };
      }
      
      return {
        success: true,
        message: 'Successfully joined team',
        requiresApproval: false,
        team
      };
    } catch (error) {
      console.error('Error joining team with code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to join team'
      };
    }
  }

  /**
   * Approve or reject a join request
   */
  async processJoinRequest(
    requestId: string,
    approverUserId: string,
    approved: boolean,
    role?: MembershipRole,
    customPermissions?: Permission[]
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Find the membership request
      const membership = await TeamMembership.findById(requestId);
      
      if (!membership || membership.status !== 'pending') {
        return {
          success: false,
          message: 'Join request not found or already processed'
        };
      }
      
      // Check if approver has permission
      const approverMembership = await TeamMembership.findOne({
        userId: approverUserId,
        teamId: membership.teamId,
        status: 'active'
      });
      
      if (!approverMembership || !approverMembership.hasPermission(Permission.APPROVE_FANS)) {
        return {
          success: false,
          message: 'You do not have permission to approve join requests'
        };
      }
      
      // Get team and requester
      const team = await Team.findOne({ id: membership.teamId });
      const user = await User.findById(membership.userId);
      
      if (!team || !user) {
        return {
          success: false,
          message: 'Team or user not found'
        };
      }
      
      if (approved) {
        // Update membership status
        membership.status = 'active';
        membership.joinedAt = Date.now();
        membership.invitedBy = approverUserId;
        
        // Update role and permissions if provided
        if (role) {
          membership.role = role;
          
          // Set permissions based on role or custom permissions
          if (customPermissions && customPermissions.length > 0) {
            membership.permissions = customPermissions;
          } else {
            // Use default permissions for the role
            switch (role) {
              case 'headCoach':
                membership.permissions = PERMISSION_SETS.HEAD_COACH;
                break;
              case 'assistant':
                membership.permissions = PERMISSION_SETS.ASSISTANT_COACH;
                break;
              case 'fan':
                membership.permissions = PERMISSION_SETS.FAN;
                break;
            }
          }
        }
        
        await membership.save();
        
        // Notify the user
        const notification = new Notification({
          userId: user.id,
          type: 'approval',
          title: 'Join request approved',
          message: `Your request to join ${team.name} has been approved`,
          relatedId: team.id,
          actionUrl: `/teams/${team.id}`,
          createdAt: Date.now(),
          read: false
        });
        
        await notification.save();
        
        return {
          success: true,
          message: 'Join request approved'
        };
      } else {
        // Delete the membership
        await TeamMembership.findByIdAndDelete(requestId);
        
        // Remove team from user's teams
        user.removeTeam(team.id);
        await user.save();
        
        // Notify the user
        const notification = new Notification({
          userId: user.id,
          type: 'denial',
          title: 'Join request denied',
          message: `Your request to join ${team.name} has been denied`,
          createdAt: Date.now(),
          read: false
        });
        
        await notification.save();
        
        return {
          success: true,
          message: 'Join request denied'
        };
      }
    } catch (error) {
      console.error('Error processing join request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process join request'
      };
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(
    teamId: string,
    status: 'active' | 'pending' | 'all' = 'active'
  ): Promise<{
    members: Array<{
      membership: ITeamMembership;
      user: IUser;
    }>;
  }> {
    // Find memberships
    const query: any = { teamId };
    if (status !== 'all') {
      query.status = status;
    }
    
    const memberships = await TeamMembership.find(query);
    
    // Get user IDs
    const userIds = memberships.map(membership => membership.userId);
    
    // Get users
    const users = await User.find({ _id: { $in: userIds } });
    
    // Map members with user data
    const members = memberships.map(membership => {
      const user = users.find(u => u.id === membership.userId);
      return {
        membership,
        user: user!
      };
    });
    
    return { members };
  }

  /**
   * Update user permissions in a team
   */
  async updateMemberPermissions(
    membershipId: string,
    updaterUserId: string,
    role?: MembershipRole,
    customPermissions?: Permission[]
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Find the membership
      const membership = await TeamMembership.findById(membershipId);
      
      if (!membership || membership.status !== 'active') {
        return {
          success: false,
          message: 'Team member not found'
        };
      }
      
      // Check if updater has permission
      const updaterMembership = await TeamMembership.findOne({
        userId: updaterUserId,
        teamId: membership.teamId,
        status: 'active'
      });
      
      if (!updaterMembership || !updaterMembership.hasPermission(Permission.MANAGE_USERS)) {
        return {
          success: false,
          message: 'You do not have permission to update member permissions'
        };
      }
      
      // Prevent head coaches from changing other head coaches
      if (
        membership.role === 'headCoach' && 
        updaterMembership.role === 'headCoach' && 
        membership.userId !== updaterUserId
      ) {
        return {
          success: false,
          message: 'You cannot change permissions for other head coaches'
        };
      }
      
      // Update role if provided
      if (role) {
        membership.role = role;
      }
      
      // Update permissions
      if (customPermissions && customPermissions.length > 0) {
        membership.permissions = customPermissions;
      } else if (role) {
        // Use default permissions for the role
        switch (role) {
          case 'headCoach':
            membership.permissions = PERMISSION_SETS.HEAD_COACH;
            break;
          case 'assistant':
            membership.permissions = PERMISSION_SETS.ASSISTANT_COACH;
            break;
          case 'fan':
            membership.permissions = PERMISSION_SETS.FAN;
            break;
        }
      }
      
      await membership.save();
      
      // Notify the user about permission changes
      const team = await Team.findOne({ id: membership.teamId });
      
      if (team) {
        const notification = new Notification({
          userId: membership.userId,
          type: 'team_update',
          title: 'Permissions updated',
          message: `Your permissions for team ${team.name} have been updated`,
          relatedId: team.id,
          createdAt: Date.now(),
          read: false
        });
        
        await notification.save();
      }
      
      return {
        success: true,
        message: 'Member permissions updated successfully'
      };
    } catch (error) {
      console.error('Error updating member permissions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update member permissions'
      };
    }
  }

  /**
   * Remove a member from a team
   */
  async removeMember(
    membershipId: string,
    removerUserId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Find the membership
      const membership = await TeamMembership.findById(membershipId);
      
      if (!membership) {
        return {
          success: false,
          message: 'Team member not found'
        };
      }
      
      // Check if remover has permission
      const removerMembership = await TeamMembership.findOne({
        userId: removerUserId,
        teamId: membership.teamId,
        status: 'active'
      });
      
      // Users can remove themselves
      const isSelfRemoval = membership.userId === removerUserId;
      
      if (
        !isSelfRemoval && 
        (!removerMembership || !removerMembership.hasPermission(Permission.MANAGE_USERS))
      ) {
        return {
          success: false,
          message: 'You do not have permission to remove team members'
        };
      }
      
      // Prevent removal of head coaches by non-head coaches
      if (
        membership.role === 'headCoach' && 
        (!removerMembership || removerMembership.role !== 'headCoach') &&
        !isSelfRemoval
      ) {
        return {
          success: false,
          message: 'Only head coaches can remove other head coaches'
        };
      }
      
      // Check if last head coach
      if (membership.role === 'headCoach') {
        const headCoachCount = await TeamMembership.countDocuments({
          teamId: membership.teamId,
          role: 'headCoach',
          status: 'active'
        });
        
        if (headCoachCount <= 1) {
          return {
            success: false,
            message: 'Cannot remove the last head coach from a team'
          };
        }
      }
      
      // Get user and team for notifications
      const user = await User.findById(membership.userId);
      const team = await Team.findOne({ id: membership.teamId });
      
      if (!user || !team) {
        return {
          success: false,
          message: 'User or team not found'
        };
      }
      
      // Remove membership
      await TeamMembership.findByIdAndDelete(membershipId);
      
      // Remove team from user's teams
      user.removeTeam(team.id);
      await user.save();
      
      // Notify the user if not self-removal
      if (!isSelfRemoval) {
        const notification = new Notification({
          userId: user.id,
          type: 'team_update',
          title: 'Removed from team',
          message: `You have been removed from team ${team.name}`,
          createdAt: Date.now(),
          read: false
        });
        
        await notification.save();
      }
      
      return {
        success: true,
        message: isSelfRemoval ? 'You have left the team' : 'Member removed successfully'
      };
    } catch (error) {
      console.error('Error removing team member:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove team member'
      };
    }
  }

  /**
   * Search for teams
   */
  async searchTeams(
    searchTerm: string,
    limit: number = 10
  ): Promise<{
    teams: ITeam[];
  }> {
    // Search teams by name, age group, season
    const teams = await Team.find(
      {
        $text: { $search: searchTerm },
        isPublic: true
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
    
    return { teams };
  }
}

// Export singleton instance
export const teamService = new TeamService();
export default teamService;