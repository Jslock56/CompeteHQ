/**
 * Application Settings Interface
 * 
 * These settings are stored in MongoDB for each user
 * and determine the application behavior and preferences.
 */
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
     * Default number of innings for new games
     * Range: 1-9
     */
    defaultInnings: number;
    
    /**
     * Whether to enable email notifications
     */
    emailNotifications: boolean;
    
    /**
     * Last updated timestamp
     */
    updatedAt?: number;
  }