export interface Game {
    id: string;
    teamId: string;
    opponent: string;
    date: number; // timestamp
    location: string;
    innings: number;
    status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
    lineupId?: string;
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
  }