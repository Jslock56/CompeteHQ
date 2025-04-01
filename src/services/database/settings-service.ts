'use client';

import { AppSettings } from '../../types/app-settings';

/**
 * Service for managing application settings
 */
class SettingsService {
  private static instance: SettingsService;
  
  // Default settings
  private defaultSettings: AppSettings = {
    currentTeamId: undefined,
    theme: 'light',
    preferOffline: true, // Default to offline mode to ensure data access
    defaultInnings: 7, // Default to 7 innings
  };
  
  // Settings storage key
  private SETTINGS_KEY = 'competeHQ_settings';
  
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
   * Get all application settings
   */
  public getSettings(): AppSettings {
    try {
      if (typeof window === 'undefined') {
        return this.defaultSettings;
      }
      
      const settingsJson = localStorage.getItem(this.SETTINGS_KEY);
      if (!settingsJson) {
        return this.defaultSettings;
      }
      
      return { ...this.defaultSettings, ...JSON.parse(settingsJson) };
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }
  
  /**
   * Save application settings
   */
  public saveSettings(settings: Partial<AppSettings>): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
  
  /**
   * Set the application theme
   */
  public setTheme(theme: 'light' | 'dark'): boolean {
    return this.saveSettings({ theme });
  }
  
  /**
   * Set the preferred storage mode (online/offline)
   */
  public setPreferOffline(preferOffline: boolean): boolean {
    return this.saveSettings({ preferOffline });
  }
  
  /**
   * Set the current team ID
   */
  public setCurrentTeamId(teamId: string | undefined): boolean {
    return this.saveSettings({ currentTeamId: teamId });
  }
  
  /**
   * Set the default number of innings for new games
   * @param innings Number of innings (1-9)
   */
  public setDefaultInnings(innings: number): boolean {
    // Validate innings is within range
    if (innings < 1 || innings > 9 || !Number.isInteger(innings)) {
      console.error('Invalid innings value:', innings);
      return false;
    }
    
    return this.saveSettings({ defaultInnings: innings });
  }
  
  /**
   * Reset settings to defaults
   */
  public resetSettings(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      localStorage.removeItem(this.SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
export default settingsService;