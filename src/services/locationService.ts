/**
 * Location detection and management service
 * Handles browser geolocation API, manual location input, and location persistence
 * 
 * Business Context:
 * - MVP stores locations in localStorage (no user accounts)
 * - Provides graceful fallback when geolocation is denied
 * - Optimized for mobile browsers with location accuracy requirements
 * - Handles location permission states across different browsers
 */

import { 
  Location, 
  LocationError, 
  LocationErrorType, 
  LocationPermission,
  LocationSettings
} from '../types/user';

/**
 * Configuration for location detection and geocoding
 */
const LOCATION_CONFIG = {
  // Geolocation API options optimized for mobile
  geolocationOptions: {
    enableHighAccuracy: true, // Use GPS when available
    timeout: 15000, // 15 seconds timeout for mobile networks
    maximumAge: 300000, // 5 minutes cache for battery optimization
  },
  
  // Minimum accuracy for location detection (meters)
  minimumAccuracy: 1000, // 1km accuracy acceptable for pollen data
  
  // Location validation bounds (reasonable global limits)
  bounds: {
    latitude: { min: -90, max: 90 },
    longitude: { min: -180, max: 180 },
  },
} as const;

/**
 * Creates standardized location errors with user-friendly messages
 * @param error - Browser geolocation error or error type
 * @param context - Additional context for debugging
 * @returns Structured LocationError
 */
function createLocationError(error: unknown, context: string = ''): LocationError {
  // Handle GeolocationPositionError from browser
  if (error instanceof GeolocationPositionError || (error && typeof error === 'object' && 'code' in error)) {
    const geoError = error as GeolocationPositionError;
    
    switch (geoError.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        return {
          type: LocationErrorType.PERMISSION_DENIED,
          message: 'Location access denied. Please enable location services and refresh the page.',
          originalError: geoError,
        };
        
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        return {
          type: LocationErrorType.POSITION_UNAVAILABLE,
          message: 'Location unavailable. Please check your device settings or try manual location entry.',
          originalError: geoError,
        };
        
      case GeolocationPositionError.TIMEOUT:
        return {
          type: LocationErrorType.TIMEOUT,
          message: 'Location request timed out. Please try again or enter location manually.',
          originalError: geoError,
        };
    }
  }
  
  // Handle case where geolocation is not supported
  if (typeof error === 'string' && error.includes('not supported')) {
    return {
      type: LocationErrorType.NOT_SUPPORTED,
      message: 'Location services are not supported by your browser. Please enter your location manually.',
    };
  }
  
  // Default unknown error
  return {
    type: LocationErrorType.UNKNOWN_ERROR,
    message: `Unable to detect location${context ? ` ${context}` : ''}. Please try manual entry.`,
    originalError: error instanceof GeolocationPositionError ? error : undefined,
  };
}

/**
 * Validates geographic coordinates
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns true if coordinates are valid
 */
function validateCoordinates(latitude: number, longitude: number): boolean {
  const { bounds } = LOCATION_CONFIG;
  
  return (
    !isNaN(latitude) && 
    !isNaN(longitude) &&
    latitude >= bounds.latitude.min && 
    latitude <= bounds.latitude.max &&
    longitude >= bounds.longitude.min && 
    longitude <= bounds.longitude.max
  );
}

/**
 * Checks if the browser supports geolocation
 * @returns true if geolocation is supported
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator && 'getCurrentPosition' in navigator.geolocation;
}

/**
 * Gets the current geolocation permission state
 * Uses Permissions API when available, fallback to trying geolocation
 * @returns Promise resolving to permission state
 */
export async function getLocationPermission(): Promise<LocationPermission> {
  // Try modern Permissions API first
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as LocationPermission;
    } catch {
      // Permissions API failed, fallback to detection
    }
  }
  
  // Fallback: attempt to get position with quick timeout
  if (!isGeolocationSupported()) {
    return 'unknown';
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => {
        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          resolve('denied');
        } else {
          resolve('prompt');
        }
      },
      { timeout: 1000, maximumAge: Infinity }
    );
  });
}

/**
 * Detects current location using browser geolocation API
 * Optimized for mobile devices with accuracy filtering
 * 
 * @param options - Optional configuration overrides
 * @returns Promise resolving to detected location
 * @throws {LocationError} If location detection fails
 */
export async function detectCurrentLocation(
  options: {
    timeout?: number;
    highAccuracy?: boolean;
    maxAge?: number;
  } = {}
): Promise<Location> {
  if (!isGeolocationSupported()) {
    throw createLocationError('Geolocation not supported');
  }
  
  const geolocationOptions = {
    ...LOCATION_CONFIG.geolocationOptions,
    timeout: options.timeout || LOCATION_CONFIG.geolocationOptions.timeout,
    enableHighAccuracy: options.highAccuracy ?? LOCATION_CONFIG.geolocationOptions.enableHighAccuracy,
    maximumAge: options.maxAge ?? LOCATION_CONFIG.geolocationOptions.maximumAge,
  };
  
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Validate coordinates
        if (!validateCoordinates(latitude, longitude)) {
          reject(createLocationError('Invalid coordinates received from browser'));
          return;
        }
        
        // Check accuracy if high accuracy was requested
        if (geolocationOptions.enableHighAccuracy && 
            accuracy > LOCATION_CONFIG.minimumAccuracy) {
          console.warn(`Location accuracy (${accuracy}m) exceeds minimum requirement (${LOCATION_CONFIG.minimumAccuracy}m)`);
        }
        
        const location: Location = {
          latitude,
          longitude,
          // Additional metadata can be added by reverse geocoding service (future)
        };
        
        resolve(location);
      },
      (error) => {
        reject(createLocationError(error, 'during geolocation request'));
      },
      geolocationOptions
    );
  });
}

/**
 * Validates and normalizes manual location input
 * Supports various coordinate formats and validates bounds
 * 
 * @param input - Location coordinates or formatted string
 * @returns Validated Location object
 * @throws {LocationError} If location is invalid
 */
export function parseManualLocation(input: {
  latitude: number | string;
  longitude: number | string;
  displayName?: string;
}): Location {
  let lat: number;
  let lng: number;
  
  try {
    // Parse coordinates from various formats
    lat = typeof input.latitude === 'string' ? parseFloat(input.latitude.trim()) : input.latitude;
    lng = typeof input.longitude === 'string' ? parseFloat(input.longitude.trim()) : input.longitude;
  } catch {
    throw createLocationError('Invalid coordinate format. Please enter valid numbers.');
  }
  
  // Validate parsed coordinates
  if (!validateCoordinates(lat, lng)) {
    throw createLocationError('Coordinates out of valid range. Latitude: -90 to 90, Longitude: -180 to 180.');
  }
  
  return {
    latitude: lat,
    longitude: lng,
    displayName: input.displayName?.trim(),
  };
}

/**
 * Calculates distance between two locations using Haversine formula
 * Useful for detecting significant location changes
 * 
 * @param location1 - First location
 * @param location2 - Second location  
 * @returns Distance in kilometers
 */
export function calculateDistance(location1: Location, location2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = (location1.latitude * Math.PI) / 180;
  const lat2Rad = (location2.latitude * Math.PI) / 180;
  const deltaLat = ((location2.latitude - location1.latitude) * Math.PI) / 180;
  const deltaLng = ((location2.longitude - location1.longitude) * Math.PI) / 180;
  
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Creates a formatted display name for a location
 * Used when reverse geocoding is not available
 * 
 * @param location - Location coordinates
 * @returns Human-readable location string
 */
export function formatLocationDisplay(location: Location): string {
  if (location.displayName) {
    return location.displayName;
  }
  
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  
  if (location.city) {
    return location.city;
  }
  
  // Fallback to coordinates with reasonable precision
  const lat = location.latitude.toFixed(4);
  const lng = location.longitude.toFixed(4);
  return `${lat}, ${lng}`;
}

/**
 * Storage key for location settings in localStorage
 */
const LOCATION_STORAGE_KEY = 'pollenTracker.locationSettings';

/**
 * Saves location settings to localStorage
 * Handles serialization and error recovery
 * 
 * @param settings - Location settings to save
 */
export function saveLocationSettings(settings: LocationSettings): void {
  try {
    const serialized = JSON.stringify({
      ...settings,
      lastDetectionTime: settings.lastDetectionTime?.toISOString(),
    });
    
    localStorage.setItem(LOCATION_STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('Failed to save location settings:', error);
    // Non-critical error - app continues without persistence
  }
}

/**
 * Loads location settings from localStorage
 * Handles deserialization and migration of old data formats
 * 
 * @returns Saved location settings or defaults
 */
export function loadLocationSettings(): LocationSettings {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!saved) {
      return {
        useAutoDetection: true,
        savedLocations: [],
      };
    }
    
    const parsed = JSON.parse(saved);
    
    return {
      current: parsed.current,
      useAutoDetection: parsed.useAutoDetection ?? true,
      savedLocations: Array.isArray(parsed.savedLocations) ? parsed.savedLocations : [],
      lastDetectionTime: parsed.lastDetectionTime ? new Date(parsed.lastDetectionTime) : undefined,
    };
  } catch (error) {
    console.warn('Failed to load location settings, using defaults:', error);
    return {
      useAutoDetection: true,
      savedLocations: [],
    };
  }
}

/**
 * Export error types for use in components
 */
export { LocationErrorType, createLocationError };
export type { LocationError };