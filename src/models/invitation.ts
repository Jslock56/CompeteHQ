/**
 * Invitation model for handling team invitations
 */
import { Schema, model, models, Model } from 'mongoose';
import { MembershipRole } from './team-membership';
import { Permission } from './user';

export interface IInvitation {
  email: string;
  teamId: string;
  role: MembershipRole;
  permissions: Permission[];
  invitedBy: string;
  createdAt: number;
  expiresAt: number;
  token: string;
  used: boolean;
  teamName?: string; // For displaying in emails/UI
  inviterName?: string; // For displaying in emails/UI
}

const invitationSchema = new Schema<IInvitation>({
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true 
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
  invitedBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number,
    default: () => Date.now()
  },
  expiresAt: {
    type: Number,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  used: {
    type: Boolean,
    default: false
  },
  teamName: {
    type: String
  },
  inviterName: {
    type: String
  }
});

// Indexes for efficient queries
invitationSchema.index({ token: 1 }, { unique: true });
invitationSchema.index({ email: 1, teamId: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ teamId: 1 });

// Helper method to check if expired
invitationSchema.methods.isExpired = function(): boolean {
  return Date.now() > this.expiresAt;
};

// Helper method to check if valid
invitationSchema.methods.isValid = function(): boolean {
  return !this.used && !this.isExpired();
};

// Define the model
export const Invitation: Model<IInvitation> = models.Invitation || 
  model<IInvitation>('Invitation', invitationSchema);

export default Invitation;