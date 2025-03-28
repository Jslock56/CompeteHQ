/**
 * Team model for managing baseball teams
 */
import { Schema, model, models, Model } from 'mongoose';

export interface ITeam {
  id: string; // UUID for compatibility with existing code
  name: string;
  ageGroup: string;
  season: string;
  sport?: string; // For future expansion to other sports
  description?: string;
  logoUrl?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string; // User ID of head coach who created the team
  joinRequiresApproval: boolean; // Whether fans need approval to join
  isPublic: boolean; // Whether team can be found in search
}

const teamSchema = new Schema<ITeam>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  ageGroup: {
    type: String,
    required: true,
    trim: true
  },
  season: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    default: 'baseball',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String
  },
  createdAt: {
    type: Number,
    default: () => Date.now()
  },
  updatedAt: {
    type: Number,
    default: () => Date.now()
  },
  createdBy: {
    type: String,
    required: true
  },
  joinRequiresApproval: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
});

// Indexes
teamSchema.index({ id: 1 }, { unique: true });
teamSchema.index({ name: 1 });
teamSchema.index({ createdBy: 1 });
teamSchema.index({ isPublic: 1 });
teamSchema.index(
  { name: 'text', ageGroup: 'text', season: 'text', description: 'text' },
  { name: 'team_search_index' }
);

// Method to generate search-friendly name
teamSchema.methods.getFullName = function(): string {
  return `${this.name} (${this.ageGroup}, ${this.season})`;
};

// Define the model
// When using this model in the browser, the models object can be undefined
// Check that models exists before trying to access it
export const Team: Model<ITeam> = (typeof models !== 'undefined' && models.Team) 
  ? models.Team 
  : model<ITeam>('Team', teamSchema);

export default Team;