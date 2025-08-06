/**
 * Google Pollen API service
 * Handles all interactions with the Google Pollen API v1
 * 
 * Business Context:
 * - No caching in MVP - all requests go directly to API as per requirements
 * - Uses UPI (Universal Pollen Index) scale 0-5 from Google
 * - Supports 1-5 day forecasts with current day included
 * - Returns structured data ready for personalized risk calculation
 */

import { 
  PollenRequest, 
  PollenResponse, 
  PollenError, 
  PollenErrorType,
  DailyPollenInfo 
} from '../types/pollen';
import { Location } from '../types/user';

/**
 * Configuration for Google Pollen API
 */
const POLLEN_API_CONFIG = {
  baseUrl: import.meta.env.DEV 
    ? '/api/pollen' // Use dev proxy to bypass CORS
    : import.meta.env.VITE_POLLEN_API_BASE || 'https://pollen.googleapis.com/v1',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  defaultDays: 3, // MVP shows current + 2 forecast days
  timeout: 10000, // 10 second timeout for mobile networks
  retryAttempts: 2, // Retry failed requests twice
  retryDelay: 1000, // 1 second between retries
} as const;

/**
 * Validates that the API key is configured
 * @throws {PollenError} If API key is missing
 */
function validateApiKey(): void {
  if (!POLLEN_API_CONFIG.apiKey) {
    const error: PollenError = {
      type: PollenErrorType.API_KEY_INVALID,
      message: 'Google Pollen API key is not configured. Please set VITE_GOOGLE_API_KEY environment variable.',
    };
    throw error;
  }
}

/**
 * Creates standardized error responses for different failure scenarios
 * @param error - The original error or error type
 * @param context - Additional context about where the error occurred
 * @returns Structured PollenError with user-friendly message
 */
function createPollenError(error: unknown, context: string = ''): PollenError {
  // Handle fetch network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: PollenErrorType.NETWORK_ERROR,
      message: 'Unable to connect to pollen service. Please check your internet connection.',
      originalError: error,
    };
  }

  // Handle HTTP response errors
  if (error instanceof Response) {
    const status = error.status;
    
    if (status === 401 || status === 403) {
      return {
        type: PollenErrorType.API_KEY_INVALID,
        message: 'Invalid API key. Please check your Google Pollen API configuration.',
      };
    }
    
    if (status === 429) {
      return {
        type: PollenErrorType.API_RATE_LIMIT,
        message: 'Too many requests. Please try again in a few minutes.',
      };
    }
    
    if (status === 404) {
      return {
        type: PollenErrorType.NO_DATA_AVAILABLE,
        message: 'Pollen data is not available for this location.',
      };
    }
  }

  // Handle structured PollenError
  if (error && typeof error === 'object' && 'type' in error) {
    return error as PollenError;
  }

  // Default unknown error
  return {
    type: PollenErrorType.UNKNOWN_ERROR,
    message: `An unexpected error occurred${context ? ` ${context}` : ''}. Please try again.`,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Implements exponential backoff retry logic for failed API requests
 * @param fn - The function to retry
 * @param maxAttempts - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise that resolves with the function result or rejects with final error
 */
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxAttempts: number = POLLEN_API_CONFIG.retryAttempts,
  baseDelay: number = POLLEN_API_CONFIG.retryDelay
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth errors or rate limits
      if (error instanceof Response && (error.status === 401 || error.status === 403 || error.status === 429)) {
        break;
      }
      
      // Don't retry on final attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff: delay increases with each attempt
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Builds the complete URL for pollen forecast API requests
 * Google Pollen API uses GET method with query parameters
 * @param request - The pollen request parameters
 * @returns Complete API URL with query parameters
 */
function buildPollenUrl(request: PollenRequest): string {
  const params = new URLSearchParams({
    key: POLLEN_API_CONFIG.apiKey!,
    // Location coordinates as query parameters for GET requests
    'location.latitude': request.location.latitude.toString(),
    'location.longitude': request.location.longitude.toString(),
    days: request.days.toString(),
  });
  
  if (request.plantsDescription) {
    params.append('plantsDescription', 'true');
  }
  
  if (request.pageSize) {
    params.append('pageSize', request.pageSize.toString());
  }
  
  if (request.languageCode) {
    params.append('languageCode', request.languageCode);
  }
  
  return `${POLLEN_API_CONFIG.baseUrl}/forecast:lookup?${params.toString()}`;
}

/**
 * Transforms raw API date strings to Date objects
 * Google API returns dates in YYYY-MM-DD format
 * @param dailyInfo - Raw daily info from API
 * @returns Daily info with proper Date objects
 */
function transformApiResponse(dailyInfo: Record<string, unknown>[]): DailyPollenInfo[] {
  return dailyInfo.map(day => ({
    ...day,
    date: new Date(day.date as string),
  })) as DailyPollenInfo[];
}

/**
 * Fetches pollen forecast data from Google Pollen API
 * 
 * Implementation Details:
 * - Makes GET request as required by Google Pollen API
 * - Includes automatic retry logic with exponential backoff
 * - No caching as per MVP requirements
 * - Returns structured data ready for risk calculation
 * 
 * @param location - Geographic coordinates for forecast
 * @param days - Number of days to forecast (default: 3, max: 5)
 * @param options - Additional request options
 * @returns Promise resolving to pollen forecast data
 * @throws {PollenError} If request fails or data is unavailable
 */
export async function fetchPollenForecast(
  location: Location,
  days: number = POLLEN_API_CONFIG.defaultDays,
  options: {
    includePlantDetails?: boolean;
    languageCode?: string;
    signal?: AbortSignal;
  } = {}
): Promise<PollenResponse> {
  try {
    // Validate prerequisites
    validateApiKey();
    
    // Clamp days to API limits (1-5 days)
    const clampedDays = Math.max(1, Math.min(5, days));
    
    const request: PollenRequest = {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      days: clampedDays,
      plantsDescription: options.includePlantDetails || false,
      languageCode: options.languageCode || 'en-US',
    };
    
    const url = buildPollenUrl(request);
    
    // Implement request with timeout and retry logic
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), POLLEN_API_CONFIG.timeout);
      
      // Allow external abort signal to take precedence
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Handle HTTP errors
        if (!response.ok) {
          throw response;
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
    
    const data = await response.json();
    
    // Transform and validate response
    if (!data.dailyInfo || !Array.isArray(data.dailyInfo)) {
      const error: PollenError = {
        type: PollenErrorType.NO_DATA_AVAILABLE,
        message: 'Invalid response from pollen service. Please try again later.',
      };
      throw error;
    }
    
    return {
      regionCode: data.regionCode || 'Unknown',
      dailyInfo: transformApiResponse(data.dailyInfo),
    };
    
  } catch (error) {
    throw createPollenError(error, 'while fetching pollen forecast');
  }
}

/**
 * Fetches current day pollen data only
 * Convenience method for quick current conditions lookup
 * 
 * @param location - Geographic coordinates
 * @param options - Additional request options
 * @returns Promise resolving to current day pollen data
 * @throws {PollenError} If request fails
 */
export async function fetchCurrentPollenData(
  location: Location,
  options: {
    includePlantDetails?: boolean;
    languageCode?: string;
    signal?: AbortSignal;
  } = {}
): Promise<DailyPollenInfo> {
  const response = await fetchPollenForecast(location, 1, options);
  
  if (!response.dailyInfo.length) {
    const error: PollenError = {
      type: PollenErrorType.NO_DATA_AVAILABLE,
      message: 'No current pollen data available for this location.',
    };
    throw error;
  }
  
  return response.dailyInfo[0];
}

/**
 * Health check function to verify API connectivity and authentication
 * Useful for testing configuration and debugging
 * 
 * @returns Promise resolving to true if API is accessible
 * @throws {PollenError} If API is not accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    validateApiKey();
    
    // Test with a known location (San Francisco)
    const testLocation: Location = {
      latitude: 37.7749,
      longitude: -122.4194,
    };
    
    await fetchCurrentPollenData(testLocation, {
      languageCode: 'en-US',
    });
    
    return true;
  } catch (error) {
    // Re-throw structured errors for debugging
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    
    throw createPollenError(error, 'during API health check');
  }
}

/**
 * Export error types and utilities for use in components
 */
export { PollenErrorType, createPollenError };
export type { PollenError };