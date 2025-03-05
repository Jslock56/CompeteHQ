import { Position } from './position'; // Adjust the import path as needed

export interface PositionHistory {
    playerId: string;
    gameId: string;
    teamId: string;
    positions: InningPosition[];
  }
  
  export interface InningPosition {
    inning: number;
    position: Position;
  }