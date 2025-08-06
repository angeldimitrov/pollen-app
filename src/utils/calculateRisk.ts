/**
 * Personalized pollen risk calculation utilities
 * Implements the core business logic for transforming raw pollen data into personalized risk assessments
 * 
 * Business Logic:
 * Risk Score = (Pollen Index × User Sensitivity) / 10
 * 
 * Where:
 * - Pollen Index: 0-5 scale from Google Pollen API (UPI - Universal Pollen Index)
 * - User Sensitivity: 1-10 scale from user settings (1 = not sensitive, 10 = extremely sensitive)
 * - Result: Normalized risk score used to determine overall risk level
 * 
 * Risk Level Mapping:
 * - Low: Combined score < 2 (Green)
 * - Moderate: Combined score 2-5 (Yellow)  
 * - High: Combined score 5-8 (Orange)
 * - Very High: Combined score > 8 (Red)
 */

import { 
  DailyPollenInfo, 
  PollenTypeInfo, 
  ProcessedPollenData, 
  RiskLevel,
  PollenType 
} from '../types/pollen';
import { SensitivityProfile } from '../types/user';

/**
 * Risk calculation constants and thresholds
 */
const RISK_CONFIG = {
  // Risk level thresholds based on combined risk score
  thresholds: {
    low: 2,        // < 2 = Low risk (green)
    moderate: 5,   // 2-5 = Moderate risk (yellow)
    high: 8,       // 5-8 = High risk (orange)
                   // > 8 = Very High risk (red)
  },
  
  // Weighting factors for different pollen types (future enhancement)
  weights: {
    tree: 1.0,     // Tree pollen weight
    grass: 1.0,    // Grass pollen weight  
    weed: 1.0,     // Weed pollen weight
  },
  
  // Maximum possible risk score for validation
  maxRiskScore: 50, // (5 max index × 10 max sensitivity)
} as const;

/**
 * Calculates personalized risk score for a single pollen type
 * Core formula: (Pollen Index × User Sensitivity) / 10
 * 
 * @param pollenIndex - Google API pollen index (0-5 scale)
 * @param userSensitivity - User sensitivity setting (1-10 scale)
 * @returns Calculated risk score (0-5 typical range)
 */
function calculatePollenRiskScore(pollenIndex: number, userSensitivity: number): number {
  // Validate inputs
  if (pollenIndex < 0 || pollenIndex > 5) {
    console.warn(`Invalid pollen index: ${pollenIndex}, clamping to 0-5 range`);
    pollenIndex = Math.max(0, Math.min(5, pollenIndex));
  }
  
  if (userSensitivity < 1 || userSensitivity > 10) {
    console.warn(`Invalid user sensitivity: ${userSensitivity}, clamping to 1-10 range`);
    userSensitivity = Math.max(1, Math.min(10, userSensitivity));
  }
  
  // Apply the core business formula
  const riskScore = (pollenIndex * userSensitivity) / 10;
  
  // Round to one decimal place for consistency
  return Math.round(riskScore * 10) / 10;
}

/**
 * Determines risk level category based on calculated risk score
 * Maps numeric risk scores to color-coded risk levels for UI display
 * 
 * @param riskScore - Calculated risk score
 * @returns Risk level category
 */
export function getRiskLevel(riskScore: number): RiskLevel {
  if (riskScore < RISK_CONFIG.thresholds.low) {
    return 'low';
  } else if (riskScore < RISK_CONFIG.thresholds.moderate) {
    return 'moderate';
  } else if (riskScore < RISK_CONFIG.thresholds.high) {
    return 'high';
  } else {
    return 'very-high';
  }
}

/**
 * Gets the display color for a risk level
 * Returns CSS color classes compatible with Tailwind configuration
 * 
 * @param riskLevel - Risk level category
 * @returns CSS color class name
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  const colorMap: Record<RiskLevel, string> = {
    'low': 'risk-low',
    'moderate': 'risk-moderate', 
    'high': 'risk-high',
    'very-high': 'risk-very-high',
  };
  
  return colorMap[riskLevel];
}

/**
 * Gets user-friendly display text for risk levels
 * @param riskLevel - Risk level category
 * @returns Human-readable risk level text
 */
export function getRiskText(riskLevel: RiskLevel): string {
  const textMap: Record<RiskLevel, string> = {
    'low': 'Low',
    'moderate': 'Moderate',
    'high': 'High', 
    'very-high': 'Very High',
  };
  
  return textMap[riskLevel];
}

/**
 * Extracts pollen data for a specific type from API response
 * Handles missing data and provides fallback values
 * 
 * @param pollenTypes - Array of pollen type info from API
 * @param targetType - Pollen type to extract
 * @returns Pollen data for the specified type or default values
 */
function extractPollenTypeData(pollenTypes: PollenTypeInfo[], targetType: PollenType) {
  const pollenData = pollenTypes.find(p => p.code === targetType);
  
  return {
    index: pollenData?.indexInfo?.value ?? 0,
    inSeason: pollenData?.inSeason ?? false,
    displayName: pollenData?.displayName ?? targetType.toLowerCase(),
  };
}

/**
 * Calculates overall risk score by combining all pollen types
 * Uses weighted average approach with equal weights in MVP
 * 
 * @param treeScore - Tree pollen risk score
 * @param grassScore - Grass pollen risk score  
 * @param weedScore - Weed pollen risk score
 * @returns Combined overall risk score
 */
function calculateOverallRisk(treeScore: number, grassScore: number, weedScore: number): number {
  const { weights } = RISK_CONFIG;
  
  // Calculate weighted average (all weights = 1.0 in MVP)
  const totalWeight = weights.tree + weights.grass + weights.weed;
  const weightedSum = (treeScore * weights.tree) + (grassScore * weights.grass) + (weedScore * weights.weed);
  
  const overallScore = weightedSum / totalWeight;
  
  // Round to one decimal place
  return Math.round(overallScore * 10) / 10;
}

/**
 * Combines health recommendations from all active pollen types
 * Removes duplicates and prioritizes by risk level
 * 
 * @param pollenTypes - Array of pollen type info from API
 * @returns Consolidated list of health recommendations
 */
function consolidateHealthRecommendations(pollenTypes: PollenTypeInfo[]): string[] {
  const recommendations = new Set<string>();
  
  // Collect all recommendations from in-season pollen types
  pollenTypes.forEach(pollenType => {
    if (pollenType.inSeason && pollenType.healthRecommendations) {
      pollenType.healthRecommendations.forEach(rec => recommendations.add(rec));
    }
  });
  
  // Convert to array and limit to top 5 recommendations for mobile display
  return Array.from(recommendations).slice(0, 5);
}

/**
 * Main function to calculate personalized pollen risk assessment
 * Transforms raw Google API data into personalized risk scores and levels
 * 
 * @param dailyPollenData - Raw pollen data from Google API
 * @param userSensitivity - User's sensitivity profile
 * @param locationName - Display name for location
 * @returns Complete processed pollen data with personalized risk assessment
 */
export function calculatePersonalizedRisk(
  dailyPollenData: DailyPollenInfo,
  userSensitivity: SensitivityProfile,
  locationName?: string
): ProcessedPollenData {
  // Extract individual pollen type data
  const treeData = extractPollenTypeData(dailyPollenData.pollenTypeInfo, 'TREE');
  const grassData = extractPollenTypeData(dailyPollenData.pollenTypeInfo, 'GRASS');
  const weedData = extractPollenTypeData(dailyPollenData.pollenTypeInfo, 'WEED');
  
  // Calculate personalized risk scores for each pollen type
  const treeScore = calculatePollenRiskScore(treeData.index, userSensitivity.tree);
  const grassScore = calculatePollenRiskScore(grassData.index, userSensitivity.grass);
  const weedScore = calculatePollenRiskScore(weedData.index, userSensitivity.weed);
  
  // Calculate overall risk
  const overallScore = calculateOverallRisk(treeScore, grassScore, weedScore);
  
  // Determine risk levels
  const treeRisk = getRiskLevel(treeScore);
  const grassRisk = getRiskLevel(grassScore);
  const weedRisk = getRiskLevel(weedScore);
  const overallRisk = getRiskLevel(overallScore);
  
  // Consolidate health recommendations
  const recommendations = consolidateHealthRecommendations(dailyPollenData.pollenTypeInfo);
  
  return {
    date: dailyPollenData.date,
    location: locationName || 'Current Location',
    overallRisk,
    overallScore,
    pollenTypes: {
      tree: {
        index: treeData.index,
        risk: treeRisk,
        score: treeScore,
        inSeason: treeData.inSeason,
      },
      grass: {
        index: grassData.index,
        risk: grassRisk,
        score: grassScore,
        inSeason: grassData.inSeason,
      },
      weed: {
        index: weedData.index,
        risk: weedRisk,
        score: weedScore,
        inSeason: weedData.inSeason,
      },
    },
    recommendations,
    lastUpdated: new Date(),
  };
}

/**
 * Calculates risk trend by comparing current day with previous/next day
 * Useful for showing improving/worsening conditions
 * 
 * @param currentRisk - Current day processed data
 * @param comparisonRisk - Previous or next day processed data
 * @returns Trend direction and magnitude
 */
export function calculateRiskTrend(
  currentRisk: ProcessedPollenData,
  comparisonRisk: ProcessedPollenData
): {
  direction: 'improving' | 'worsening' | 'stable';
  magnitude: 'slight' | 'moderate' | 'significant';
  scoreDifference: number;
} {
  const difference = currentRisk.overallScore - comparisonRisk.overallScore;
  const absDifference = Math.abs(difference);
  
  // Determine direction
  let direction: 'improving' | 'worsening' | 'stable';
  if (absDifference < 0.5) {
    direction = 'stable';
  } else if (difference > 0) {
    direction = 'worsening';
  } else {
    direction = 'improving';
  }
  
  // Determine magnitude
  let magnitude: 'slight' | 'moderate' | 'significant';
  if (absDifference < 1.0) {
    magnitude = 'slight';
  } else if (absDifference < 2.0) {
    magnitude = 'moderate';
  } else {
    magnitude = 'significant';
  }
  
  return {
    direction,
    magnitude,
    scoreDifference: Math.round(difference * 10) / 10,
  };
}

/**
 * Determines if conditions are suitable for outdoor activities
 * Based on overall risk level and individual sensitivities
 * 
 * @param processedData - Processed pollen data
 * @returns Activity recommendation with reasoning
 */
export function getActivityRecommendation(processedData: ProcessedPollenData): {
  recommendation: 'ideal' | 'caution' | 'avoid';
  reason: string;
  bestTime?: string;
} {
  const { overallRisk, overallScore } = processedData;
  
  switch (overallRisk) {
    case 'low':
      return {
        recommendation: 'ideal',
        reason: 'Low pollen levels - great time for outdoor activities.',
        bestTime: 'All day',
      };
      
    case 'moderate':
      return {
        recommendation: 'caution',
        reason: 'Moderate pollen levels - consider taking precautions.',
        bestTime: 'Early morning or evening',
      };
      
    case 'high':
      return {
        recommendation: 'caution',
        reason: 'High pollen levels - limit outdoor exposure and take medication.',
        bestTime: 'Early morning before 10 AM',
      };
      
    case 'very-high':
      return {
        recommendation: 'avoid',
        reason: 'Very high pollen levels - stay indoors when possible.',
      };
      
    default:
      return {
        recommendation: 'caution',
        reason: 'Unable to assess conditions - use caution outdoors.',
      };
  }
}

/**
 * Export additional utilities for use in components
 */
export {
  calculatePollenRiskScore,
  RISK_CONFIG,
};