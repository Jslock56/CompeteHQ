export interface Game {
    id: string;
    teamId: string;
    opponent: string;
    date: number; // timestamp
    location: string;
    innings: number;
    isHome?: boolean; // Whether this is a home game
    status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
    homeScore?: number;
    awayScore?: number;
    result?: 'win' | 'loss' | 'tie' | null;
    lineupId?: string;
    notes?: string;
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
  }