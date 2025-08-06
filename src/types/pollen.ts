/**
 * Google Pollen API types and interfaces
 * Based on Google Pollen API v1 documentation
 */

export type PollenType = 'TREE' | 'GRASS' | 'WEED';

export interface PollenColor {
  red: number;
  green: number;
  blue: number;
}

/**
 * Pollen index categories as defined by Google Pollen API
 * These map to standardized UPI (Universal Pollen Index) values
 */
export type PollenCategory = 'NONE' | 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

/**
 * Index information for a specific pollen type on a given day
 */
export interface PollenIndexInfo {
  code: string;
  displayName: string;
  value: number; // 0-5 scale from Google API
  category: PollenCategory;
  color: PollenColor;
}

/**
 * Information about a specific pollen type (Tree, Grass, or Weed)
 */
export interface PollenTypeInfo {
  code: PollenType;
  displayName: string;
  inSeason: boolean;
  indexInfo: PollenIndexInfo;
  healthRecommendations: string[];
}

/**
 * Information about specific plants contributing to pollen counts
 */
export interface PlantInfo {
  code: string;
  displayName: string;
  inSeason: boolean;
}

/**
 * Daily pollen information for a specific date
 */
export interface DailyPollenInfo {
  date: Date;
  pollenTypeInfo: PollenTypeInfo[];
  plantInfo?: PlantInfo[];
}

/**
 * Complete pollen forecast response from Google API
 */
export interface PollenResponse {
  regionCode: string;
  dailyInfo: DailyPollenInfo[];
}

/**
 * Request parameters for Google Pollen API
 */
export interface PollenRequest {
  location: {
    latitude: number;
    longitude: number;
  };
  days: number; // 1-5 days forecast
  plantsDescription?: boolean;
  pageSize?: number;
  languageCode?: string;
}

/**
 * Error types that can occur when fetching pollen data
 */
export enum PollenErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT', 
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  INVALID_LOCATION = 'INVALID_LOCATION',
  API_KEY_INVALID = 'API_KEY_INVALID',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Structured error response for pollen API failures
 */
export interface PollenError {
  type: PollenErrorType;
  message: string;
  originalError?: Error;
}

/**
 * Risk levels calculated from pollen data and user sensitivity
 * Based on the personalization formula: (Pollen Index × User Sensitivity) / 10
 */
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';

/**
 * Processed pollen data with calculated risk levels
 */
export interface ProcessedPollenData {
  date: Date;
  location: string;
  overallRisk: RiskLevel;
  overallScore: number;
  pollenTypes: {
    tree: {
      index: number;
      risk: RiskLevel;
      score: number;
      inSeason: boolean;
    };
    grass: {
      index: number;
      risk: RiskLevel;
      score: number;
      inSeason: boolean;
    };
    weed: {
      index: number;
      risk: RiskLevel;
      score: number;
      inSeason: boolean;
    };
  };
  recommendations: string[];
  lastUpdated: Date;
}