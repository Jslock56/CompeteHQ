/**
 * User model for authentication and basic user information
 */
import { Schema, model, models, Model } from 'mongoose';

export enum Permission {
  MANAGE_USERS = 'manage:users',
  APPROVE_FANS = 'approve:fans',
  CREATE_GAMES = 'create:games',
  EDIT_GAMES = 'edit:games',
  CREATE_LINEUPS = 'create:lineups',
  EDIT_LINEUPS = 'edit:lineups',
  CREATE_PRACTICES = 'create:practices',
  EDIT_PRACTICES = 'edit:practices',
  EDIT_ROSTER = 'edit:roster',
  VIEW_STATS = 'view:stats',
  VIEW_SCHEDULE = 'view:schedule'
}

// Predefined permission sets
export const PERMISSION_SETS = {
  HEAD_COACH: [
    Permission.MANAGE_USERS,
    Permission.APPROVE_FANS,
    Permission.CREATE_GAMES,
    Permission.EDIT_GAMES,
    Permission.CREATE_LINEUPS,
    Permission.EDIT_LINEUPS,
    Permission.CREATE_PRACTICES,
    Permission.EDIT_PRACTICES,
    Permission.EDIT_ROSTER,
    Permission.VIEW_STATS,
    Permission.VIEW_SCHEDULE
  ],
  ASSISTANT_ADMIN: [
    Permission.APPROVE_FANS,
    Permission.CREATE_GAMES,
    Permission.EDIT_GAMES,
    Permission.CREATE_LINEUPS,
    Permission.EDIT_LINEUPS,
    Permission.CREATE_PRACTICES,
    Permission.EDIT_PRACTICES,
    Permission.EDIT_ROSTER,
    Permission.VIEW_STATS,
    Permission.VIEW_SCHEDULE
  ],
  ASSISTANT_COACH: [
    Permission.EDIT_LINEUPS,
    Permission.EDIT_GAMES,
    Permission.CREATE_PRACTICES,
    Permission.EDIT_PRACTICES,
    Permission.VIEW_STATS,
    Permission.VIEW_SCHEDULE
  ],
  FAN: [
    Permission.VIEW_STATS,
    Permission.VIEW_SCHEDULE
  ]
};

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: number;
  lastLogin?: number;
  teams: string[]; // IDs of teams this user belongs to
  activeTeamId?: string; // Currently selected team
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  // Mongoose Document instance methods
  hasTeam: (teamId: string) => boolean;
  addTeam: (teamId: string) => void;
  removeTeam: (teamId: string) => void;
}

const userSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String,
    trim: true 
  },
  lastName: { 
    type: String,
    trim: true 
  },
  phoneNumber: { 
    type: String,
    trim: true 
  },
  createdAt: { 
    type: Number, 
    default: () => Date.now() 
  },
  lastLogin: { 
    type: Number 
  },
  teams: {
    type: [String],
    default: []
  },
  activeTeamId: {
    type: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Number
  }
}, {
  // Enable virtual fields to be included in JSON/object responses
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create virtual field for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name;
});

// Add indexes (when not already defined in schema)
userSchema.index({ teams: 1 });

// Helper methods
userSchema.methods.hasTeam = function(teamId: string): boolean {
  return this.teams.includes(teamId);
};

userSchema.methods.addTeam = function(teamId: string): void {
  if (!this.teams.includes(teamId)) {
    this.teams.push(teamId);
  }
  
  // If this is their first team, make it active
  if (this.teams.length === 1) {
    this.activeTeamId = teamId;
  }
};

userSchema.methods.removeTeam = function(teamId: string): void {
  this.teams = this.teams.filter((id: string) => id !== teamId);
  
  // If active team was removed, set a new active team if possible
  if (this.activeTeamId === teamId && this.teams.length > 0) {
    this.activeTeamId = this.teams[0];
  } else if (this.teams.length === 0) {
    this.activeTeamId = undefined;
  }
};

// Define the model
// When using this model in the browser, the models object can be undefined
// Check that models exists before trying to access it
export const User: Model<IUser> = (typeof models !== 'undefined' && models.User) 
  ? models.User 
  : model<IUser>('User', userSchema);

export default User;