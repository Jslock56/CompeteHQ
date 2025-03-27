/**
 * TeamMembership model for defining user relationships to teams
 */
import { Schema, model, models, Model } from 'mongoose';
import { Permission } from './user';

export type MembershipRole = 'headCoach' | 'assistant' | 'fan';
export type MembershipStatus = 'active' | 'pending' | 'invited';

export interface ITeamMembership {
  userId: string;
  teamId: string;
  role: MembershipRole;
  permissions: Permission[];
  status: MembershipStatus;
  invitedBy?: string; // User ID who invited them
  joinedAt?: number;
  lastActive?: number;
}

const teamMembershipSchema = new Schema<ITeamMembership>({
  userId: { 
    type: String, 
    required: true 
  },
  teamId: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true,
    enum: ['headCoach', 'assistant', 'fan'],
    default: 'fan' 
  },
  permissions: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'invited'],
    default: 'pending'
  },
  invitedBy: {
    type: String
  },
  joinedAt: {
    type: Number
  },
  lastActive: {
    type: Number
  }
});

// Compound index to ensure unique user per team
teamMembershipSchema.index({ userId: 1, teamId: 1 }, { unique: true });

// Indexes for common queries
teamMembershipSchema.index({ teamId: 1, role: 1 });
teamMembershipSchema.index({ teamId: 1, status: 1 });
teamMembershipSchema.index({ userId: 1, status: 1 });

// Helper methods
teamMembershipSchema.methods.hasPermission = function(permission: Permission): boolean {
  return this.permissions.includes(permission);
};

teamMembershipSchema.methods.hasAnyPermission = function(permissions: Permission[]): boolean {
  return permissions.some((permission) => this.permissions.includes(permission));
};

teamMembershipSchema.methods.hasAllPermissions = function(permissions: Permission[]): boolean {
  return permissions.every((permission) => this.permissions.includes(permission));
};

// Define the model
export const TeamMembership: Model<ITeamMembership> = models.TeamMembership || 
  model<ITeamMembership>('TeamMembership', teamMembershipSchema);

export default TeamMembership;