/**
 * Application constants and configuration values
 * Centralized location for app-wide constants, API URLs, and configuration
 */

/**
 * App metadata and version information
 */
export const APP_INFO = {
  name: 'Pollen Tracker',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description: 'Personalized pollen forecasts for allergy sufferers',
  author: 'Pollen Tracker Team',
} as const;

/**
 * API configuration constants
 */
export const API_CONFIG = {
  pollen: {
    baseUrl: import.meta.env.VITE_POLLEN_API_BASE || 'https://pollen.googleapis.com/v1',
    version: 'v1',
    timeout: 10000, // 10 seconds
    retryAttempts: 2,
    retryDelay: 1000, // 1 second
  },
  rateLimit: {
    requestsPerMinute: 60, // Conservative estimate
    requestsPerDay: 1000, // Based on free tier limits
  },
} as const;

/**
 * UI configuration constants
 */
export const UI_CONFIG = {
  // Mobile-first breakpoints (matches Tailwind defaults)
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
  },
  
  // Touch target sizes for mobile accessibility
  touchTargets: {
    minimum: 44, // 44x44px minimum touch target
    comfortable: 48, // Comfortable touch target size
    large: 56, // Large touch targets for primary actions
  },
  
  // Animation durations for consistent UX
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Z-index layers
  zIndex: {
    base: 1,
    dropdown: 10,
    modal: 20,
    toast: 30,
    tooltip: 40,
  },
} as const;

/**
 * Pollen-specific constants
 */
export const POLLEN_CONFIG = {
  // Pollen types tracked by the app
  types: ['TREE', 'GRASS', 'WEED'] as const,
  
  // Display names for pollen types
  typeDisplayNames: {
    TREE: 'Tree',
    GRASS: 'Grass', 
    WEED: 'Weed',
  },
  
  // Icons or emoji for pollen types (for future use)
  typeIcons: {
    TREE: '🌳',
    GRASS: '🌿',
    WEED: '🌾',
  },
  
  // Index ranges from Google API
  indexRange: {
    min: 0,
    max: 5,
  },
  
  // Sensitivity ranges for user settings
  sensitivityRange: {
    min: 1,
    max: 10,
    default: 5,
  },
  
  // Forecast configuration
  forecast: {
    maxDays: 5, // Maximum days supported by Google API
    defaultDays: 3, // Default forecast length for MVP
  },
} as const;

/**
 * Risk level configuration
 */
export const RISK_CONFIG = {
  levels: ['low', 'moderate', 'high', 'very-high'] as const,
  
  // Risk level thresholds
  thresholds: {
    low: 2,
    moderate: 5,
    high: 8,
  },
  
  // Color mappings for risk levels
  colors: {
    low: '#22c55e',       // Green
    moderate: '#eab308',  // Yellow
    high: '#f97316',      // Orange
    'very-high': '#ef4444', // Red
  },
  
  // CSS class mappings
  cssClasses: {
    low: 'risk-low',
    moderate: 'risk-moderate',
    high: 'risk-high',
    'very-high': 'risk-very-high',
  },
  
  // Display text for risk levels
  displayText: {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    'very-high': 'Very High',
  },
} as const;

/**
 * Location configuration
 */
export const LOCATION_CONFIG = {
  // Geolocation API configuration
  geolocation: {
    timeout: 15000, // 15 seconds
    maximumAge: 300000, // 5 minutes
    enableHighAccuracy: true,
  },
  
  // Coordinate validation bounds
  bounds: {
    latitude: { min: -90, max: 90 },
    longitude: { min: -180, max: 180 },
  },
  
  // Default locations for testing/fallback
  defaults: {
    // San Francisco coordinates
    latitude: 37.7749,
    longitude: -122.4194,
    displayName: 'San Francisco, CA',
  },
  
  // Distance thresholds
  distance: {
    significantChange: 1000, // 1km - when to refresh data
    nearby: 100, // 100m - considered same location
  },
} as const;

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  // localStorage keys
  keys: {
    userProfile: 'pollenTracker.userProfile',
    locationSettings: 'pollenTracker.locationSettings',
    appVersion: 'pollenTracker.appVersion',
    lastMigration: 'pollenTracker.lastMigration',
  },
  
  // Storage limits and quotas
  limits: {
    maxSize: 5 * 1024 * 1024, // 5MB localStorage limit
    maxLocations: 10, // Maximum saved locations
  },
  
  // Data retention
  retention: {
    pollenData: 24 * 60 * 60 * 1000, // 24 hours (not used in MVP - no caching)
    locationHistory: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
} as const;

/**
 * Performance targets and thresholds
 */
export const PERFORMANCE_CONFIG = {
  // Core Web Vitals targets
  targets: {
    fcp: 1500, // First Contentful Paint (ms)
    lcp: 2500, // Largest Contentful Paint (ms)  
    fid: 100,  // First Input Delay (ms)
    cls: 0.1,  // Cumulative Layout Shift
  },
  
  // Bundle size targets
  bundle: {
    maxSize: 250 * 1024, // 250KB gzipped
    chunkSize: 100 * 1024, // 100KB per chunk
  },
  
  // Network timeouts
  timeouts: {
    apiRequest: 10000, // 10 seconds
    imageLoad: 5000,   // 5 seconds
    scriptLoad: 3000,  // 3 seconds
  },
} as const;

/**
 * Error handling configuration
 */
export const ERROR_CONFIG = {
  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  },
  
  // Error reporting (for future integration)
  reporting: {
    enabled: false, // Disabled in MVP
    sampleRate: 0.1, // 10% of errors reported
  },
  
  // User-friendly error messages
  messages: {
    network: 'Please check your internet connection and try again.',
    location: 'Unable to determine your location. Please enable location services.',
    api: 'Service temporarily unavailable. Please try again later.',
    storage: 'Unable to save your settings. Please check available storage.',
    generic: 'Something went wrong. Please try again.',
  },
} as const;

/**
 * Feature flags for MVP scope
 */
export const FEATURES = {
  // MVP features (enabled)
  geolocation: true,
  pollenForecast: true,
  sensitivityProfile: true,
  localStorage: true,
  pwa: true,
  
  // Future features (disabled in MVP)
  userAccounts: false,
  pushNotifications: false,
  symptomTracking: false,
  socialSharing: false,
  dataExport: false,
  multipleUsers: false,
  historicalData: false,
  weatherIntegration: false,
  premiumFeatures: false,
} as const;

/**
 * Development configuration
 */
export const DEV_CONFIG = {
  // Debug flags
  debug: {
    enabled: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'warn',
    showPerformance: false,
  },
  
  // Mock data for development
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  
  // Test locations
  testLocations: [
    { latitude: 37.7749, longitude: -122.4194, displayName: 'San Francisco, CA' },
    { latitude: 40.7128, longitude: -74.0060, displayName: 'New York, NY' },
    { latitude: 34.0522, longitude: -118.2437, displayName: 'Los Angeles, CA' },
  ],
} as const;

/**
 * Type exports for constants
 */
export type PollenType = typeof POLLEN_CONFIG.types[number];
export type RiskLevel = typeof RISK_CONFIG.levels[number];

/**
 * Utility functions for working with constants
 */
export const isPollenType = (value: string): value is PollenType => {
  return POLLEN_CONFIG.types.includes(value as PollenType);
};

export const isRiskLevel = (value: string): value is RiskLevel => {
  return RISK_CONFIG.levels.includes(value as RiskLevel);
};

export const getPollenTypeIcon = (type: PollenType): string => {
  return POLLEN_CONFIG.typeIcons[type];
};

export const getRiskColor = (level: RiskLevel): string => {
  return RISK_CONFIG.colors[level];
};

export const getRiskCssClass = (level: RiskLevel): string => {
  return RISK_CONFIG.cssClasses[level];
};