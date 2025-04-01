export interface AppSettings {
    /**
     * The currently selected team ID
     */
    currentTeamId?: string;
    
    /**
     * The user's preferred theme
     */
    theme: 'light' | 'dark' | 'system';
    
    /**
     * Whether to prefer offline mode
     * NOTE: This must be set to false to ensure MongoDB integration
     */
    preferOffline: boolean;
    
    /**
     * Default number of innings for new games
     * Range: 1-9
     */
    defaultInnings: number;
  }