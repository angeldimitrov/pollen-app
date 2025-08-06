/**
 * Pollen data management hook
 * Handles fetching, processing, and caching of pollen forecast data
 * 
 * Business Context:
 * - Integrates Google Pollen API with personalized risk calculation
 * - No caching in MVP - all requests go directly to API
 * - Provides error handling and retry logic for mobile networks
 * - Automatically refreshes when location changes significantly
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PollenResponse, 
  PollenError,
  ProcessedPollenData 
} from '../types/pollen';
import { Location, SensitivityProfile } from '../types/user';
import { 
  fetchPollenForecast,
  PollenErrorType 
} from '../services/pollenApi';
import { 
  calculatePersonalizedRisk,
  calculateRiskTrend,
  getActivityRecommendation as calculateActivityRecommendation
} from '../utils/calculateRisk';
import { formatLocationDisplay, calculateDistance } from '../services/locationService';

/**
 * Hook state interface
 */
interface UsePollenDataState {
  // Current day pollen data
  current: ProcessedPollenData | null;
  
  // Forecast data (current + future days)
  forecast: ProcessedPollenData[];
  
  // Loading and error states
  isLoading: boolean;
  isRefreshing: boolean;
  error: PollenError | null;
  
  // Data metadata
  lastUpdated: Date | null;
  location: Location | null;
  dataAge: number; // Minutes since last update
}

/**
 * Hook actions interface
 */
interface UsePollenDataActions {
  // Data fetching
  fetchData: (location: Location, sensitivity: SensitivityProfile, days?: number) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Error handling
  clearError: () => void;
  retry: () => Promise<void>;
  
  // Utility functions
  getTrend: (dayIndex: number) => ReturnType<typeof calculateRiskTrend> | null;
  getActivityRecommendation: (dayIndex?: number) => ReturnType<typeof calculateActivityRecommendation> | null;
  
  // Data validation
  isDataStale: (maxAgeMinutes?: number) => boolean;
  needsRefresh: (location: Location) => boolean;
}

/**
 * Return type for usePollenData hook
 */
export type UsePollenDataReturn = UsePollenDataState & UsePollenDataActions;

/**
 * Configuration for pollen data management
 */
const POLLEN_DATA_CONFIG = {
  // Data freshness thresholds
  staleThreshold: 60, // 60 minutes
  refreshThreshold: 30, // 30 minutes for automatic refresh
  
  // Location change threshold for refresh (meters)
  locationChangeThreshold: 5000, // 5km
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  
  // Default forecast days
  defaultDays: 3,
} as const;

/**
 * Custom hook for pollen data management
 * Provides comprehensive pollen data fetching and processing
 * 
 * @param options - Configuration options
 * @returns Pollen data state and actions
 */
export function usePollenData(options: {
  onDataUpdate?: (data: ProcessedPollenData[]) => void;
  onError?: (error: PollenError) => void;
  autoRefresh?: boolean;
} = {}): UsePollenDataReturn {
  
  const { 
    onDataUpdate,
    onError,
    autoRefresh = false 
  } = options;
  
  // State management
  const [state, setState] = useState<UsePollenDataState>({
    current: null,
    forecast: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
    location: null,
    dataAge: 0,
  });
  
  // Refs for cleanup and preventing stale closures
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const lastFetchParamsRef = useRef<{
    location: Location;
    sensitivity: SensitivityProfile;
    days: number;
  } | null>(null);
  
  /**
   * Updates hook state immutably
   */
  const updateState = useCallback((updates: Partial<UsePollenDataState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);
  
  /**
   * Sets error state and notifies error callback
   */
  const setError = useCallback((error: PollenError) => {
    updateState({ 
      error, 
      isLoading: false, 
      isRefreshing: false 
    });
    onError?.(error);
  }, [updateState, onError]);
  
  /**
   * Processes raw pollen data with user sensitivity
   */
  const processPollenData = useCallback((
    pollenResponse: PollenResponse,
    sensitivity: SensitivityProfile,
    location: Location
  ): ProcessedPollenData[] => {
    const locationName = formatLocationDisplay(location);
    
    return pollenResponse.dailyInfo.map(dailyData => 
      calculatePersonalizedRisk(dailyData, sensitivity, locationName)
    );
  }, []);
  
  /**
   * Main data fetching function
   */
  const fetchData = useCallback(async (
    location: Location,
    sensitivity: SensitivityProfile,
    days: number = POLLEN_DATA_CONFIG.defaultDays
  ) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Update loading state
    updateState({
      isLoading: !state.current, // Show spinner only if no data
      isRefreshing: !!state.current, // Show refresh indicator if data exists
      error: null,
    });
    
    try {
      // Store fetch parameters for retry functionality
      lastFetchParamsRef.current = { location, sensitivity, days };
      
      // Fetch pollen forecast data
      const pollenResponse = await fetchPollenForecast(
        location,
        days,
        {
          includePlantDetails: false, // Keep payload small in MVP
          languageCode: 'en-US',
          signal: abortControllerRef.current.signal,
        }
      );
      
      // Process data with personalization
      const processedData = processPollenData(pollenResponse, sensitivity, location);
      
      if (processedData.length === 0) {
        const error: PollenError = {
          type: PollenErrorType.NO_DATA_AVAILABLE,
          message: 'No pollen data available for this location.',
        };
        throw error;
      }
      
      // Update state with new data
      updateState({
        current: processedData[0] || null,
        forecast: processedData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: new Date(),
        location,
        dataAge: 0,
      });
      
      // Notify data update callback
      onDataUpdate?.(processedData);
      
    } catch (error) {
      // Handle aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        updateState({ isLoading: false, isRefreshing: false });
        return;
      }
      
      // Handle API errors
      const pollenError = error as PollenError;
      setError(pollenError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateState, processPollenData, setError, onDataUpdate]);
  
  /**
   * Refreshes current data using last fetch parameters
   */
  const refreshData = useCallback(async () => {
    const lastParams = lastFetchParamsRef.current;
    if (!lastParams) {
      console.warn('No previous fetch parameters available for refresh');
      return;
    }
    
    await fetchData(
      lastParams.location,
      lastParams.sensitivity,
      lastParams.days
    );
  }, [fetchData]);
  
  /**
   * Clears current error state
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);
  
  /**
   * Retries the last failed request with exponential backoff
   */
  const retry = useCallback(async () => {
    await refreshData();
  }, [refreshData]);
  
  /**
   * Gets trend information between days
   */
  const getTrend = useCallback((dayIndex: number) => {
    if (dayIndex <= 0 || dayIndex >= state.forecast.length) {
      return null;
    }
    
    const currentDay = state.forecast[dayIndex];
    const previousDay = state.forecast[dayIndex - 1];
    
    if (!currentDay || !previousDay) {
      return null;
    }
    
    return calculateRiskTrend(currentDay, previousDay);
  }, [state.forecast]);
  
  /**
   * Gets activity recommendation for a specific day
   */
  const getActivityRecommendation = useCallback((dayIndex: number = 0) => {
    const dayData = state.forecast[dayIndex];
    if (!dayData) return null;
    
    return calculateActivityRecommendation(dayData);
  }, [state.forecast]);
  
  /**
   * Checks if data is stale based on age
   */
  const isDataStale = useCallback((maxAgeMinutes: number = POLLEN_DATA_CONFIG.staleThreshold) => {
    if (!state.lastUpdated) return true;
    
    const ageMs = Date.now() - state.lastUpdated.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    
    return ageMinutes > maxAgeMinutes;
  }, [state.lastUpdated]);
  
  /**
   * Checks if data needs refresh due to location change
   */
  const needsRefresh = useCallback((location: Location) => {
    if (!state.location || !state.lastUpdated) return true;
    
    // Calculate distance from last fetch location
    const distance = calculateDistance(state.location, location);
    
    return distance > POLLEN_DATA_CONFIG.locationChangeThreshold;
  }, [state.location, state.lastUpdated]);
  
  /**
   * Updates data age periodically
   */
  useEffect(() => {
    const updateAge = () => {
      if (state.lastUpdated) {
        const ageMs = Date.now() - state.lastUpdated.getTime();
        const ageMinutes = Math.floor(ageMs / (1000 * 60));
        updateState({ dataAge: ageMinutes });
      }
    };
    
    // Update immediately
    updateAge();
    
    // Update every minute
    const interval = setInterval(updateAge, 60000);
    
    return () => clearInterval(interval);
  }, [state.lastUpdated, updateState]);
  
  /**
   * Auto-refresh data if enabled
   */
  useEffect(() => {
    if (!autoRefresh || !state.lastUpdated) return;
    
    const scheduleRefresh = () => {
      const nextRefreshMs = POLLEN_DATA_CONFIG.refreshThreshold * 60 * 1000;
      
      refreshTimerRef.current = window.setTimeout(() => {
        if (lastFetchParamsRef.current) {
          refreshData();
        }
      }, nextRefreshMs);
    };
    
    scheduleRefresh();
    
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, state.lastUpdated, refreshData]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);
  
  return {
    // State
    ...state,
    
    // Actions
    fetchData,
    refreshData,
    clearError,
    retry,
    getTrend,
    getActivityRecommendation,
    isDataStale,
    needsRefresh,
  };
}