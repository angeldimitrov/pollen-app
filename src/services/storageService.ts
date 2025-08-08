/**
 * User data storage service using localStorage
 * Handles persistence of user sensitivity profiles, settings, and preferences
 * 
 * Business Context:
 * - MVP uses localStorage only (no user accounts)
 * - Provides data migration for future app version updates
 * - Handles storage quota and error scenarios gracefully
 * - Ensures data consistency and validation on load
 */

import { 
  UserProfile, 
  SensitivityProfile, 
  AppSettings, 
  Location,
  DEFAULT_SENSITIVITY, 
  DEFAULT_APP_SETTINGS 
} from '../types/user';

/**
 * Storage configuration and constants
 */
const STORAGE_CONFIG = {
  keys: {
    userProfile: 'pollenTracker.userProfile',
    appVersion: 'pollenTracker.appVersion',
    lastMigration: 'pollenTracker.lastMigration',
  },
  currentVersion: '1.0.0',
  maxStorageSize: 5 * 1024 * 1024, // 5MB localStorage limit consideration
} as const;

/**
 * Generates a unique identifier for the user profile
 * Uses timestamp + random string for uniqueness without external dependencies
 * @returns Unique user ID string
 */
function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `user_${timestamp}_${random}`;
}

/**
 * Validates sensitivity profile values
 * Ensures all values are within expected 1-10 range
 * @param sensitivity - Sensitivity profile to validate
 * @returns true if valid, false otherwise
 */
function validateSensitivityProfile(sensitivity: unknown): sensitivity is SensitivityProfile {
  if (!sensitivity || typeof sensitivity !== 'object') {
    return false;
  }
  
  const { tree, grass, weed } = sensitivity as Record<string, unknown>;
  
  return (
    typeof tree === 'number' && tree >= 1 && tree <= 10 &&
    typeof grass === 'number' && grass >= 1 && grass <= 10 &&
    typeof weed === 'number' && weed >= 1 && weed <= 10
  );
}

/**
 * Validates app settings structure
 * Ensures all required fields are present with correct types
 * @param settings - App settings to validate
 * @returns true if valid, false otherwise
 */
function validateAppSettings(settings: unknown): settings is AppSettings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  
  const { temperatureUnit, language, enableNotifications, dataRefreshInterval } = settings as Record<string, unknown>;
  
  return (
    (temperatureUnit === 'celsius' || temperatureUnit === 'fahrenheit') &&
    typeof language === 'string' && language.length > 0 &&
    typeof enableNotifications === 'boolean' &&
    typeof dataRefreshInterval === 'number' && dataRefreshInterval > 0
  );
}

/**
 * Migrates old data formats to current version
 * Handles breaking changes between app versions
 * @param data - Raw data from localStorage
 * @param version - Version of the stored data
 * @returns Migrated data in current format
 */
function migrateUserProfile(data: unknown, version?: string): Partial<UserProfile> {
  // Version 1.0.0 is the initial version, no migration needed
  if (version === STORAGE_CONFIG.currentVersion) {
    return data as Partial<UserProfile>;
  }
  
  // Handle pre-versioned data (assume version 0.9.x format)
  if (!version) {
    
    // Extract what we can from old format
    const migrated: Partial<UserProfile> = {};
    
    const dataObj = data as Record<string, unknown>;
    
    if (dataObj.sensitivity && validateSensitivityProfile(dataObj.sensitivity)) {
      migrated.sensitivity = dataObj.sensitivity;
    }
    
    if (dataObj.settings && validateAppSettings(dataObj.settings)) {
      migrated.settings = dataObj.settings;
    }
    
    // Location settings are handled by locationService
    if (dataObj.location) {
      migrated.location = {
        current: dataObj.location as Location,
        useAutoDetection: true,
        savedLocations: [],
      };
    }
    
    return migrated;
  }
  
  return {};
}

/**
 * Creates a default user profile for new users
 * @returns Complete UserProfile with sensible defaults
 */
function createDefaultProfile(): UserProfile {
  return {
    id: generateUserId(),
    sensitivity: { ...DEFAULT_SENSITIVITY },
    location: {
      useAutoDetection: true,
      savedLocations: [],
    },
    settings: { ...DEFAULT_APP_SETTINGS },
    createdAt: new Date(),
    lastModified: new Date(),
    version: STORAGE_CONFIG.currentVersion,
  };
}

/**
 * Checks if localStorage is available and functional
 * @returns true if localStorage can be used
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__pollenTracker_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimates the size of data to be stored
 * Helps avoid quota exceeded errors
 * @param data - Data to estimate
 * @returns Approximate size in bytes
 */
function estimateStorageSize(data: unknown): number {
  try {
    return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
  } catch {
    return 0;
  }
}

/**
 * Loads user profile from localStorage
 * Handles migration, validation, and error recovery
 * 
 * @returns User profile (defaults if not found or invalid)
 */
export function loadUserProfile(): UserProfile {
  if (!isLocalStorageAvailable()) {
    return createDefaultProfile();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_CONFIG.keys.userProfile);
    if (!stored) {
      return createDefaultProfile();
    }
    
    const parsed = JSON.parse(stored);
    const version = parsed.version;
    
    // Migrate if necessary
    const migrated = migrateUserProfile(parsed, version);
    
    // Build profile with validation and fallbacks
    const profile: UserProfile = {
      id: migrated.id || generateUserId(),
      sensitivity: validateSensitivityProfile(migrated.sensitivity) 
        ? migrated.sensitivity 
        : { ...DEFAULT_SENSITIVITY },
      location: migrated.location || {
        useAutoDetection: true,
        savedLocations: [],
      },
      settings: validateAppSettings(migrated.settings) 
        ? migrated.settings 
        : { ...DEFAULT_APP_SETTINGS },
      createdAt: migrated.createdAt ? new Date(migrated.createdAt) : new Date(),
      lastModified: new Date(),
      version: STORAGE_CONFIG.currentVersion,
    };
    
    // Save migrated/validated profile back to storage
    if (version !== STORAGE_CONFIG.currentVersion || !validateSensitivityProfile(parsed.sensitivity)) {
      saveUserProfile(profile);
    }
    
    return profile;
    
  } catch {
    return createDefaultProfile();
  }
}

/**
 * Saves user profile to localStorage
 * Handles serialization, quota management, and error recovery
 * 
 * @param profile - User profile to save
 * @returns true if saved successfully, false otherwise
 */
export function saveUserProfile(profile: UserProfile): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    // Update modification timestamp
    const profileToSave = {
      ...profile,
      lastModified: new Date(),
      version: STORAGE_CONFIG.currentVersion,
    };
    
    const serialized = JSON.stringify(profileToSave, null, 0);
    
    // Check storage size to avoid quota errors
    const estimatedSize = estimateStorageSize(profileToSave);
    if (estimatedSize > STORAGE_CONFIG.maxStorageSize) {
      return false;
    }
    
    localStorage.setItem(STORAGE_CONFIG.keys.userProfile, serialized);
    
    return true;
    
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Could implement quota management here
    }
    
    return false;
  }
}

/**
 * Updates user sensitivity settings
 * Convenience method to update only sensitivity portion of profile
 * 
 * @param sensitivity - New sensitivity settings
 * @returns true if updated successfully
 */
export function updateSensitivityProfile(sensitivity: SensitivityProfile): boolean {
  if (!validateSensitivityProfile(sensitivity)) {
    return false;
  }
  
  const profile = loadUserProfile();
  profile.sensitivity = sensitivity;
  
  return saveUserProfile(profile);
}

/**
 * Updates app settings
 * Convenience method to update only settings portion of profile
 * 
 * @param settings - New app settings
 * @returns true if updated successfully  
 */
export function updateAppSettings(settings: AppSettings): boolean {
  if (!validateAppSettings(settings)) {
    return false;
  }
  
  const profile = loadUserProfile();
  profile.settings = settings;
  
  return saveUserProfile(profile);
}

/**
 * Resets user profile to defaults
 * Useful for troubleshooting or user-initiated reset
 * 
 * @param preserveLocation - Whether to keep saved locations
 * @returns true if reset successfully
 */
export function resetUserProfile(preserveLocation: boolean = true): boolean {
  const currentProfile = preserveLocation ? loadUserProfile() : undefined;
  const newProfile = createDefaultProfile();
  
  if (preserveLocation && currentProfile) {
    newProfile.location = currentProfile.location;
  }
  
  return saveUserProfile(newProfile);
}

/**
 * Clears all stored user data
 * Complete cleanup for uninstall or troubleshooting
 */
export function clearAllUserData(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    // Remove all pollen tracker related keys
    Object.values(STORAGE_CONFIG.keys).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Remove any location settings (handled by locationService)
    localStorage.removeItem('pollenTracker.locationSettings');
    
    
  } catch {
    // Ignore clear data errors
  }
}

/**
 * Gets storage usage information for debugging
 * @returns Storage usage statistics
 */
export function getStorageInfo(): {
  isAvailable: boolean;
  profileExists: boolean;
  estimatedSize: number;
  version?: string;
} {
  if (!isLocalStorageAvailable()) {
    return {
      isAvailable: false,
      profileExists: false,
      estimatedSize: 0,
    };
  }
  
  const stored = localStorage.getItem(STORAGE_CONFIG.keys.userProfile);
  
  return {
    isAvailable: true,
    profileExists: !!stored,
    estimatedSize: stored ? stored.length * 2 : 0,
    version: stored ? JSON.parse(stored).version : undefined,
  };
}

/**
 * Export storage utilities for debugging and testing
 */
export {
  validateSensitivityProfile,
  validateAppSettings,
  isLocalStorageAvailable,
};