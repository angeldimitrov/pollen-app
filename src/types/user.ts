/**
 * User-related types and interfaces for the Pollen Tracker app
 * Handles sensitivity profiles, location preferences, and app settings
 */

import { PollenType } from './pollen';

/**
 * User sensitivity settings for different pollen types
 * Scale: 1-10 where 1 = not sensitive, 10 = extremely sensitive
 */
export interface SensitivityProfile {
  tree: number; // 1-10 sensitivity to tree pollen
  grass: number; // 1-10 sensitivity to grass pollen  
  weed: number; // 1-10 sensitivity to weed pollen
}

/**
 * Geographic location information
 */
export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  displayName?: string; // Formatted location name for UI
  formattedAddress?: string; // Full formatted address from Google Maps
  source?: 'auto' | 'manual'; // How the location was obtained
  timestamp?: Date; // When the location was determined
  accuracy?: number | null; // Accuracy in meters (null for manual locations)
}

/**
 * User location preferences and detection settings
 */
export interface LocationSettings {
  current?: Location;
  useAutoDetection: boolean;
  savedLocations: Location[];
  lastDetectionTime?: Date;
}

/**
 * User application preferences
 */
export interface AppSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  language: string; // ISO language code (e.g., 'en-US')
  enableNotifications: boolean; // Future feature
  dataRefreshInterval: number; // Minutes between auto-refresh (future feature)
}

/**
 * Complete user profile combining all preferences
 * Stored in localStorage for MVP (no user accounts)
 */
export interface UserProfile {
  id: string; // UUID for localStorage tracking
  sensitivity: SensitivityProfile;
  location: LocationSettings;
  settings: AppSettings;
  createdAt: Date;
  lastModified: Date;
  version: string; // App version when profile was created/updated
}

/**
 * Default sensitivity levels for new users
 * Moderate sensitivity (5/10) provides balanced risk assessments
 */
export const DEFAULT_SENSITIVITY: SensitivityProfile = {
  tree: 5,
  grass: 5,
  weed: 5,
};

/**
 * Default app settings for new installations
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  temperatureUnit: 'celsius',
  language: 'en-US',
  enableNotifications: false, // Disabled in MVP
  dataRefreshInterval: 60, // 1 hour
};

/**
 * Location permission states for browser geolocation API
 */
export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

/**
 * Location detection errors
 */
export enum LocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE', 
  TIMEOUT = 'TIMEOUT',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Structured location error
 */
export interface LocationError {
  type: LocationErrorType;
  message: string;
  originalError?: GeolocationPositionError;
}

/**
 * Helper type for pollen type keys
 */
export type PollenTypeKey = Lowercase<PollenType>;