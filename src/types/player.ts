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
  
  export type Position = 
    | 'P'  // Pitcher
    | 'C'  // Catcher
    | '1B' // First Base
    | '2B' // Second Base
    | '3B' // Third Base
    | 'SS' // Shortstop
    | 'LF' // Left Field
    | 'CF' // Center Field
    | 'RF' // Right Field
    | 'DH' // Designated Hitter
    | 'BN'; // Bench