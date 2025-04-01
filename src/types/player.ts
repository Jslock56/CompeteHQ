import { Position } from './shared-types';

export interface Player {
    id: string;
    teamId: string;
    name?: string;       // Full name (for MongoDB compatibility)
    firstName: string;
    lastName: string;
    jerseyNumber: number;
    primaryPositions: Position[];
    secondaryPositions: Position[];
    active: boolean;
    notes?: string;
    battingOrder?: number; // Optional batting order
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
  }