export interface Practice {
    id: string;
    teamId: string;
    date: number; // timestamp
    duration: number; // minutes
    location: string;
    focus: string[];
    drills: PracticeDrill[];
    status: 'planned' | 'completed' | 'canceled';
    notes?: string;
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
  }
  
  export interface PracticeDrill {
    id: string;
    name: string;
    duration: number; // minutes
    playerCount: number;
    coachCount: number;
    equipment: string[];
    description: string;
    objectives: string[];
  }