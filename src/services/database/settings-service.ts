'use client';

import { AppSettings } from '../../types/app-settings';

/**
 * Service for managing application settings
 * This service now relies exclusively on MongoDB via API calls
 * for storing and retrieving user settings
 */
class SettingsService {
  private static instance: SettingsService;
  
  // Default settings - used until API response is received
  private defaultSettings: AppSettings = {
    currentTeamId: undefined,
    theme: 'light',
    defaultInnings: 7,
    emailNotifications: true,
  };
  
  // Cache settings to avoid unnecessary API calls
  private cachedSettings: AppSettings | null = null;
  private lastFetchTime: number = 0;
  private CACHE_TTL = 60000; // 60 seconds cache TTL
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }
  
  /**
   * Check if settings cache is valid
   */
  private isCacheValid(): boolean {
    return (
      this.cachedSettings !== null && 
      Date.now() - this.lastFetchTime < this.CACHE_TTL
    );
  }
  
  /**
   * Get all application settings from MongoDB via API
   */
  public async getSettings(): Promise<AppSettings> {
    try {
      // Return cached settings if valid
      if (this.isCacheValid()) {
        return this.cachedSettings!;
      }
      
      // Skip API call if not in browser context
      if (typeof window === 'undefined') {
        return this.defaultSettings;
      }
      
      // Fetch settings from API
      const response = await fetch('/api/settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch settings from API:', response.status);
        return this.defaultSettings;
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Update cache
        this.cachedSettings = data.settings;
        this.lastFetchTime = Date.now();
        return data.settings;
      }
      
      return this.defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }
  
  /**
   * Save application settings to MongoDB via API
   */
  public async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      // Skip API call if not in browser context
      if (typeof window === 'undefined') {
        return false;
      }
      
      // Get current settings for merging
      const currentSettings = this.isCacheValid() 
        ? this.cachedSettings 
        : await this.getSettings();
      
      const newSettings = { ...currentSettings, ...settings };
      
      // Send settings to API
      const response = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      });
      
      if (!response.ok) {
        console.warn('Failed to save settings to API:', response.status);
        return false;
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Update cache
        this.cachedSettings = data.settings;
        this.lastFetchTime = Date.now();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
  
  /**
   * Set the application theme
   */
  public async setTheme(theme: 'light' | 'dark' | 'system'): Promise<boolean> {
    return await this.saveSettings({ theme });
  }
  
  /**
   * Set the email notifications preference
   */
  public async setEmailNotifications(enabled: boolean): Promise<boolean> {
    return await this.saveSettings({ emailNotifications: enabled });
  }
  
  /**
   * Set the current team ID
   */
  public async setCurrentTeamId(teamId: string | undefined): Promise<boolean> {
    return await this.saveSettings({ currentTeamId: teamId });
  }
  
  /**
   * Set the default number of innings for new games
   * @param innings Number of innings (1-9)
   */
  public async setDefaultInnings(innings: number): Promise<boolean> {
    // Validate innings is within range
    if (innings < 1 || innings > 9 || !Number.isInteger(innings)) {
      console.error('Invalid innings value:', innings);
      return false;
    }
    
    return await this.saveSettings({ defaultInnings: innings });
  }
  
  /**
   * Reset settings cache to force a refresh from API
   */
  public resetCache(): void {
    this.cachedSettings = null;
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
export default settingsService;