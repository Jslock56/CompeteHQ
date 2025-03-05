export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';

export interface Lineup {
    id: string;
    gameId: string;
    teamId: string;
    innings: LineupInning[];
    status: 'draft' | 'final';
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
  }
  
  export interface LineupInning {
    inning: number;
    positions: PositionAssignment[];
  }
  
  export interface PositionAssignment {
    position: Position;
    playerId: string;
  }