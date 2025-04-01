/**
 * Position History model for storing player position data
 * Uses a reference-based approach that stores game references and pre-computed metrics
 */
import { Schema, model, models, Model } from 'mongoose';
import { Position } from '../types/player';
import { PositionType } from '../utils/position-utils';

// Type definitions for MongoDB schema
export interface ITimeframePositionMetrics {
  // Position counts and percentages
  positionCounts: Record<Position, number>;
  positionPercentages: Record<Position, number>;
  
  // Position type counts and percentages
  positionTypeCounts: Record<PositionType, number>;
  positionTypePercentages: Record<PositionType, number>;
  
  // Fair play metrics
  benchPercentage: number;
  varietyScore: number;
  consecutiveBench: number;
  benchStreak: {
    current: number;
    max: number;
  };
  
  // Position needs
  needsInfield: boolean;
  needsOutfield: boolean;
  
  // Total stats
  totalInnings: number;
  gamesPlayed: number;
  
  // Additional metrics
  playingTimePercentage: number;
  samePositionStreak?: {
    position: Position | null;
    count: number;
  };
}

export interface IPlayerPositionHistory {
  id: string;
  playerId: string;
  teamId: string;
  season: string;
  gamesPlayed: string[]; // Array of gameIds
  metrics: {
    season: ITimeframePositionMetrics;
    last5Games: ITimeframePositionMetrics;
    last3Games: ITimeframePositionMetrics;
    lastGame: ITimeframePositionMetrics;
  };
  updatedAt: number;
}

// Schema for position metrics at a specific timeframe
const timeframeMetricsSchema = new Schema({
  positionCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  positionPercentages: {
    type: Map,
    of: Number,
    default: {}
  },
  positionTypeCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  positionTypePercentages: {
    type: Map,
    of: Number,
    default: {}
  },
  benchPercentage: {
    type: Number,
    default: 0
  },
  varietyScore: {
    type: Number,
    default: 0
  },
  consecutiveBench: {
    type: Number,
    default: 0
  },
  benchStreak: {
    current: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    }
  },
  needsInfield: {
    type: Boolean,
    default: false
  },
  needsOutfield: {
    type: Boolean,
    default: false
  },
  totalInnings: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  playingTimePercentage: {
    type: Number,
    default: 0
  },
  samePositionStreak: {
    position: {
      type: String,
      default: null
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, { _id: false }); // Don't add _id to nested schema

// Main schema for position history
const positionHistorySchema = new Schema<IPlayerPositionHistory>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  playerId: {
    type: String,
    required: true
  },
  teamId: {
    type: String,
    required: true
  },
  season: {
    type: String,
    required: true
  },
  gamesPlayed: [{
    type: String
  }],
  metrics: {
    season: timeframeMetricsSchema,
    last5Games: timeframeMetricsSchema,
    last3Games: timeframeMetricsSchema,
    lastGame: timeframeMetricsSchema
  },
  updatedAt: {
    type: Number,
    default: () => Date.now()
  }
});

// Create indexes for efficient querying
positionHistorySchema.index({ id: 1 }, { unique: true });
positionHistorySchema.index({ playerId: 1, teamId: 1, season: 1 }, { unique: true });
positionHistorySchema.index({ teamId: 1, season: 1 });
positionHistorySchema.index({ playerId: 1 });

// Define the model
export const PositionHistory: Model<IPlayerPositionHistory> = (typeof models !== 'undefined' && models.PositionHistory)
  ? models.PositionHistory
  : model<IPlayerPositionHistory>('PositionHistory', positionHistorySchema);

export default PositionHistory;