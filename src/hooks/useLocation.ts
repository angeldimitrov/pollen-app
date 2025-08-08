/**
 * Location management hook
 * Handles geolocation detection, manual location input, and location state management
 * 
 * Business Context:
 * - Provides automatic location detection with graceful fallback to manual input
 * - Manages location permissions and error states
 * - Persists location settings in localStorage for user convenience
 * - Optimized for mobile browser location APIs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Location,
  LocationError,
  LocationSettings,
  LocationPermission,
} from '../types/user';
import {
  detectCurrentLocation,
  parseManualLocation,
  getLocationPermission,
  isGeolocationSupported,
  formatLocationDisplay,
  saveLocationSettings,
  loadLocationSettings,
  calculateDistance,
  createLocationError,
} from '../services/locationService';
import { City } from '../services/mapsService';

/**
 * Hook state interface
 */
interface UseLocationState {
  // Current location data
  location: Location | null;
  
  // Loading and error states
  isLoading: boolean;
  error: LocationError | null;
  
  // Permission state
  permission: LocationPermission;
  
  // Location settings
  settings: LocationSettings;
  
  // Detection capabilities
  isSupported: boolean;
}

/**
 * Hook actions interface
 */
interface UseLocationActions {
  // Location detection actions
  detectLocation: () => Promise<void>;
  setManualLocation: (input: { latitude: number | string; longitude: number | string; displayName?: string }) => Promise<void>;
  setCityLocation: (city: City) => Promise<void>;
  
  // Settings management
  toggleAutoDetection: () => void;
  saveLocation: (location: Location, name?: string) => void;
  removeLocation: (index: number) => void;
  selectSavedLocation: (location: Location) => void;
  
  // Error handling
  clearError: () => void;
  
  // Utility functions
  refreshPermission: () => Promise<void>;
  formatLocation: (location?: Location) => string;
}

/**
 * Return type for useLocation hook
 */
export type UseLocationReturn = UseLocationState & UseLocationActions;

/**
 * Configuration for location detection
 */
const LOCATION_HOOK_CONFIG = {
  // Automatic refresh interval (disabled in MVP)
  autoRefreshInterval: 0, // 0 = disabled
  
  // Significant location change threshold (1km)
  significantChangeDistance: 1000,
  
  // Permission check interval
  permissionCheckInterval: 30000, // 30 seconds
} as const;

/**
 * Custom hook for location management
 * Provides comprehensive location detection and management functionality
 * 
 * @param options - Configuration options
 * @returns Location state and actions
 */
export function useLocation(options: {
  autoDetect?: boolean;
  onLocationChange?: (location: Location) => void;
  onError?: (error: LocationError) => void;
} = {}): UseLocationReturn {
  
  const { 
    autoDetect = true, 
    onLocationChange,
    onError 
  } = options;
  
  // State management
  const [state, setState] = useState<UseLocationState>({
    location: null,
    isLoading: false,
    error: null,
    permission: 'unknown',
    settings: {
      useAutoDetection: true,
      savedLocations: [],
    },
    isSupported: isGeolocationSupported(),
  });
  
  // Refs for cleanup and preventing stale closures
  const abortControllerRef = useRef<AbortController | null>(null);
  const permissionTimerRef = useRef<number | null>(null);
  
  /**
   * Updates hook state immutably
   */
  const updateState = useCallback((updates: Partial<UseLocationState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);
  
  /**
   * Sets error state and notifies error callback
   */
  const setError = useCallback((error: LocationError) => {
    updateState({ error, isLoading: false });
    onError?.(error);
  }, [updateState, onError]);
  
  /**
   * Sets location and notifies change callback
   */
  const setLocation = useCallback((location: Location) => {
    updateState({ location, error: null, isLoading: false });
    onLocationChange?.(location);
  }, [updateState, onLocationChange]);
  
  /**
   * Clears current error state
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);
  
  /**
   * Refreshes location permission state
   */
  const refreshPermission = useCallback(async () => {
    try {
      const permission = await getLocationPermission();
      updateState({ permission });
    } catch {
      // Ignore permission check errors
    }
  }, [updateState]);
  
  /**
   * Detects current location using browser geolocation
   */
  const detectLocation = useCallback(async () => {
    if (!state.isSupported) {
      setError(createLocationError('Geolocation not supported by your browser'));
      return;
    }
    
    // Cancel any ongoing detection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    updateState({ isLoading: true, error: null });
    
    try {
      const location = await detectCurrentLocation({
        timeout: 15000,
        highAccuracy: true,
        includeAddress: true, // Enable reverse geocoding to populate city information
      });
      
      // Check if this is a significant location change
      const currentLocation = state.location;
      if (currentLocation) {
        const distance = calculateDistance(currentLocation, location);
        if (distance < LOCATION_HOOK_CONFIG.significantChangeDistance) {
          // Location hasn't changed significantly, just update loading state
          updateState({ isLoading: false });
          return;
        }
      }
      
      setLocation(location);
      
      // Update location settings
      const newSettings = {
        ...state.settings,
        current: location,
        lastDetectionTime: new Date(),
      };
      updateState({ settings: newSettings });
      saveLocationSettings(newSettings);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Detection was cancelled, don't show error
        updateState({ isLoading: false });
        return;
      }
      
      const locationError = error as LocationError;
      setError(locationError);
    }
  }, [state.isSupported, state.location, state.settings, updateState, setError, setLocation]);
  
  /**
   * Sets location manually from user input
   */
  const setManualLocation = useCallback(async (input: {
    latitude: number | string;
    longitude: number | string;
    displayName?: string;
  }) => {
    updateState({ isLoading: true, error: null });
    
    try {
      const location = parseManualLocation(input);
      setLocation(location);
      
      // Update location settings
      const newSettings = {
        ...state.settings,
        current: location,
      };
      updateState({ settings: newSettings });
      saveLocationSettings(newSettings);
      
    } catch (error) {
      const locationError = error as LocationError;
      setError(locationError);
    }
  }, [state.settings, updateState, setError, setLocation]);

  
  /**
   * Toggles automatic location detection
   */
  const toggleAutoDetection = useCallback(() => {
    const newSettings = {
      ...state.settings,
      useAutoDetection: !state.settings.useAutoDetection,
    };
    
    updateState({ settings: newSettings });
    saveLocationSettings(newSettings);
  }, [state.settings, updateState]);
  
  /**
   * Saves a location to the user's saved locations list
   */
  const saveLocation = useCallback((location: Location, name?: string) => {
    const locationWithName = {
      ...location,
      displayName: name || formatLocationDisplay(location),
    };
    
    const savedLocations = [...state.settings.savedLocations];
    
    // Check if location already exists (avoid duplicates)
    const existingIndex = savedLocations.findIndex(saved => 
      calculateDistance(saved, location) < 100 // Within 100m
    );
    
    if (existingIndex >= 0) {
      // Update existing location
      savedLocations[existingIndex] = locationWithName;
    } else {
      // Add new location
      savedLocations.push(locationWithName);
    }
    
    // Limit to reasonable number of saved locations
    const maxSavedLocations = 10;
    if (savedLocations.length > maxSavedLocations) {
      savedLocations.splice(0, savedLocations.length - maxSavedLocations);
    }
    
    const newSettings = {
      ...state.settings,
      savedLocations,
    };
    
    updateState({ settings: newSettings });
    saveLocationSettings(newSettings);
  }, [state.settings, updateState]);

  /**
   * Sets location from Google Maps city selection
   * 
   * Converts City object from Maps API to Location format
   * and updates the current location state.
   */
  const setCityLocation = useCallback(async (city: City) => {
    updateState({ isLoading: true, error: null });
    
    try {
      // Convert City to Location format
      const location: Location = {
        latitude: city.coordinates.lat,
        longitude: city.coordinates.lng,
        displayName: city.name,
        formattedAddress: city.formattedAddress,
        source: 'manual',
        timestamp: new Date(),
        accuracy: null, // Manual selections don't have accuracy
      };
      
      setLocation(location);
      
      // Update location settings with manual selection flag
      const newSettings = {
        ...state.settings,
        current: location,
        useAutoDetection: false, // User manually selected, disable auto-detection
      };
      updateState({ settings: newSettings });
      saveLocationSettings(newSettings);
      
      // Also save this city to user's saved locations for quick access
      saveLocation(location, city.name);
      
    } catch (error) {
      const locationError = createLocationError(
        error instanceof Error ? error.message : 'Failed to set city location'
      );
      setError(locationError);
    }
  }, [state.settings, updateState, setError, setLocation, saveLocation]);
  
  /**
   * Removes a saved location by index
   */
  const removeLocation = useCallback((index: number) => {
    const savedLocations = [...state.settings.savedLocations];
    savedLocations.splice(index, 1);
    
    const newSettings = {
      ...state.settings,
      savedLocations,
    };
    
    updateState({ settings: newSettings });
    saveLocationSettings(newSettings);
  }, [state.settings, updateState]);
  
  /**
   * Selects a saved location as the current location
   */
  const selectSavedLocation = useCallback((location: Location) => {
    setLocation(location);
    
    const newSettings = {
      ...state.settings,
      current: location,
    };
    
    updateState({ settings: newSettings });
    saveLocationSettings(newSettings);
  }, [state.settings, updateState, setLocation]);
  
  /**
   * Formats a location for display
   */
  const formatLocation = useCallback((location?: Location) => {
    return formatLocationDisplay(location || state.location || {
      latitude: 0,
      longitude: 0,
      displayName: 'Unknown Location',
    });
  }, [state.location]);
  
  /**
   * Initialize hook state from localStorage
   */
  useEffect(() => {
    const savedSettings = loadLocationSettings();
    updateState({ 
      settings: savedSettings,
      location: savedSettings.current || null,
    });
  }, [updateState]);
  
  /**
   * Auto-detect location on mount if enabled
   * NOTE: detectLocation not in dependencies to prevent multiple triggers
   * The condition check is sufficient to prevent multiple runs
   */
  useEffect(() => {
    if (autoDetect && state.settings.useAutoDetection && !state.location && state.isSupported) {
      detectLocation();
    }
  }, [autoDetect, state.settings.useAutoDetection, state.location, state.isSupported, detectLocation]);
  
  /**
   * Periodically check permission state
   */
  useEffect(() => {
    if (!state.isSupported) return;
    
    // Initial permission check
    refreshPermission();
    
    // Set up periodic permission checks
    if (LOCATION_HOOK_CONFIG.permissionCheckInterval > 0) {
      permissionTimerRef.current = window.setInterval(
        refreshPermission,
        LOCATION_HOOK_CONFIG.permissionCheckInterval
      );
    }
    
    return () => {
      if (permissionTimerRef.current) {
        clearInterval(permissionTimerRef.current);
        permissionTimerRef.current = null;
      }
    };
  }, [state.isSupported, refreshPermission]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    const abortController = abortControllerRef.current;
    const permissionTimer = permissionTimerRef.current;
    
    return () => {
      if (abortController) {
        abortController.abort();
      }
      if (permissionTimer) {
        clearInterval(permissionTimer);
      }
    };
  }, []);
  
  return {
    // State
    ...state,
    
    // Actions
    detectLocation,
    setManualLocation,
    setCityLocation,
    toggleAutoDetection,
    saveLocation,
    removeLocation,
    selectSavedLocation,
    clearError,
    refreshPermission,
    formatLocation,
  };
}