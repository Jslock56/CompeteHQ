/**
 * TeamCode model for allowing users to join teams with codes
 */
import { Schema, model, models, Model } from 'mongoose';

export interface ITeamCode {
  teamId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  maxUses?: number; // Optional limit on number of uses
  uses: number; // Number of times used
  createdBy: string; // User ID who created the code
  isActive: boolean;
}

const teamCodeSchema = new Schema<ITeamCode>({
  teamId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Number,
    default: () => Date.now()
  },
  expiresAt: {
    type: Number,
    required: true
  },
  maxUses: {
    type: Number,
    min: 1
  },
  uses: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes
teamCodeSchema.index({ code: 1 }, { unique: true });
teamCodeSchema.index({ teamId: 1 });
teamCodeSchema.index({ expiresAt: 1 });

// Helper methods
teamCodeSchema.methods.isExpired = function(): boolean {
  return Date.now() > this.expiresAt;
};

teamCodeSchema.methods.isValid = function(): boolean {
  if (!this.isActive || this.isExpired()) {
    return false;
  }
  
  // Check if max uses is reached
  if (this.maxUses !== undefined && this.uses >= this.maxUses) {
    return false;
  }
  
  return true;
};

teamCodeSchema.methods.incrementUses = function(): void {
  this.uses += 1;
  
  // Deactivate if max uses reached
  if (this.maxUses !== undefined && this.uses >= this.maxUses) {
    this.isActive = false;
  }
};

// Define the model
// When using this model in the browser, the models object can be undefined
// Check that models exists before trying to access it
export const TeamCode: Model<ITeamCode> = (typeof models !== 'undefined' && models.TeamCode) 
  ? models.TeamCode 
  : model<ITeamCode>('TeamCode', teamCodeSchema);

export default TeamCode;