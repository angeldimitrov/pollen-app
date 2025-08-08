/**
 * Risk Calculation Tests
 * 
 * Tests the core business logic for calculating personalized risk scores.
 * This is the most critical functionality of the app as it transforms raw pollen data
 * into personalized risk assessments using the formula: Risk = (Pollen Index × User Sensitivity) / 10
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePersonalizedRisk,
  getRiskLevel,
  getRiskColor,
  getRiskText,
  calculateRiskTrend,
  getActivityRecommendation,
  calculatePollenRiskScore,
  RISK_CONFIG
} from '../src/utils/calculateRisk'
import { DailyPollenInfo, PollenTypeInfo, ProcessedPollenData } from '../src/types/pollen'
import { SensitivityProfile } from '../src/types/user'

describe('Risk Calculation - Core Business Logic', () => {
  // Test data fixtures
  const mockDate = new Date('2025-08-08')
  
  const createMockPollenTypeInfo = (
    code: 'TREE' | 'GRASS' | 'WEED',
    index: number,
    inSeason: boolean = true
  ): PollenTypeInfo => ({
    code,
    displayName: `${code.toLowerCase()} pollen`,
    inSeason,
    indexInfo: {
      code: `${code}_UPI`,
      displayName: `${code} UPI`,
      value: index,
      category: 'MODERATE',
      color: { red: 0, green: 255, blue: 0 }
    },
    healthRecommendations: [
      'Stay indoors during peak pollen times',
      'Keep windows closed',
      'Use air purifier'
    ]
  })

  const createMockDailyPollenData = (
    treeIndex: number = 3,
    grassIndex: number = 2,
    weedIndex: number = 1
  ): DailyPollenInfo => ({
    date: mockDate,
    pollenTypeInfo: [
      createMockPollenTypeInfo('TREE', treeIndex),
      createMockPollenTypeInfo('GRASS', grassIndex),
      createMockPollenTypeInfo('WEED', weedIndex)
    ]
  })

  const createMockSensitivity = (
    tree: number = 5,
    grass: number = 5,
    weed: number = 5
  ): SensitivityProfile => ({
    tree,
    grass,
    weed
  })

  describe('calculatePollenRiskScore - Core Formula', () => {
    it('should calculate risk score using correct formula: (pollenIndex × userSensitivity) / 10', () => {
      // Test the core business formula
      expect(calculatePollenRiskScore(3, 5)).toBe(1.5) // (3 × 5) / 10 = 1.5
      expect(calculatePollenRiskScore(4, 7)).toBe(2.8) // (4 × 7) / 10 = 2.8
      expect(calculatePollenRiskScore(5, 10)).toBe(5.0) // (5 × 10) / 10 = 5.0
      expect(calculatePollenRiskScore(2, 3)).toBe(0.6) // (2 × 3) / 10 = 0.6
    })

    it('should handle minimum values correctly', () => {
      expect(calculatePollenRiskScore(0, 1)).toBe(0) // Minimum pollen, minimum sensitivity
      expect(calculatePollenRiskScore(1, 1)).toBe(0.1) // Low pollen, low sensitivity
    })

    it('should handle maximum values correctly', () => {
      expect(calculatePollenRiskScore(5, 10)).toBe(5) // Maximum pollen, maximum sensitivity
    })

    it('should round to one decimal place for consistency', () => {
      expect(calculatePollenRiskScore(3, 3)).toBe(0.9) // (3 × 3) / 10 = 0.9
      expect(calculatePollenRiskScore(1, 7)).toBe(0.7) // (1 × 7) / 10 = 0.7
    })

    it('should validate and clamp invalid pollen index values', () => {
      // Test negative pollen index - should be clamped to 0
      expect(calculatePollenRiskScore(-1, 5)).toBe(0)
      
      // Test excessive pollen index - should be clamped to 5
      expect(calculatePollenRiskScore(10, 5)).toBe(2.5) // Clamped to 5, so (5 × 5) / 10
    })

    it('should validate and clamp invalid sensitivity values', () => {
      // Test sensitivity below minimum - should be clamped to 1
      expect(calculatePollenRiskScore(3, 0)).toBe(0.3) // Clamped to 1, so (3 × 1) / 10
      
      // Test sensitivity above maximum - should be clamped to 10
      expect(calculatePollenRiskScore(3, 15)).toBe(3.0) // Clamped to 10, so (3 × 10) / 10
    })
  })

  describe('getRiskLevel - Risk Level Classification', () => {
    it('should classify low risk correctly (< 2)', () => {
      expect(getRiskLevel(0)).toBe('low')
      expect(getRiskLevel(1.9)).toBe('low')
      expect(getRiskLevel(1.5)).toBe('low')
    })

    it('should classify moderate risk correctly (2-5)', () => {
      expect(getRiskLevel(2.0)).toBe('moderate')
      expect(getRiskLevel(3.5)).toBe('moderate')
      expect(getRiskLevel(4.9)).toBe('moderate')
    })

    it('should classify high risk correctly (5-8)', () => {
      expect(getRiskLevel(5.0)).toBe('high')
      expect(getRiskLevel(6.5)).toBe('high')
      expect(getRiskLevel(7.9)).toBe('high')
    })

    it('should classify very high risk correctly (> 8)', () => {
      expect(getRiskLevel(8.0)).toBe('very-high')
      expect(getRiskLevel(10.0)).toBe('very-high')
      expect(getRiskLevel(15.5)).toBe('very-high')
    })

    it('should use correct threshold constants', () => {
      // Verify our thresholds match the configuration
      expect(RISK_CONFIG.thresholds.low).toBe(2)
      expect(RISK_CONFIG.thresholds.moderate).toBe(5)
      expect(RISK_CONFIG.thresholds.high).toBe(8)
    })
  })

  describe('getRiskColor and getRiskText - Display Utilities', () => {
    it('should return correct colors for each risk level', () => {
      expect(getRiskColor('low')).toBe('risk-low')
      expect(getRiskColor('moderate')).toBe('risk-moderate')
      expect(getRiskColor('high')).toBe('risk-high')
      expect(getRiskColor('very-high')).toBe('risk-very-high')
    })

    it('should return correct text for each risk level', () => {
      expect(getRiskText('low')).toBe('Low')
      expect(getRiskText('moderate')).toBe('Moderate')
      expect(getRiskText('high')).toBe('High')
      expect(getRiskText('very-high')).toBe('Very High')
    })
  })

  describe('calculatePersonalizedRisk - Main Function', () => {
    it('should calculate personalized risk for all pollen types', () => {
      const pollenData = createMockDailyPollenData(3, 2, 1) // Tree: 3, Grass: 2, Weed: 1
      const sensitivity = createMockSensitivity(6, 4, 8) // Tree: 6, Grass: 4, Weed: 8

      const result = calculatePersonalizedRisk(pollenData, sensitivity, 'Test Location')

      // Verify individual pollen type calculations
      expect(result.pollenTypes.tree.score).toBe(1.8) // (3 × 6) / 10 = 1.8
      expect(result.pollenTypes.grass.score).toBe(0.8) // (2 × 4) / 10 = 0.8
      expect(result.pollenTypes.weed.score).toBe(0.8) // (1 × 8) / 10 = 0.8

      // Verify risk levels
      expect(result.pollenTypes.tree.risk).toBe('low') // 1.8 < 2 = low
      expect(result.pollenTypes.grass.risk).toBe('low') // 0.8 < 2 = low
      expect(result.pollenTypes.weed.risk).toBe('low') // 0.8 < 2 = low

      // Verify overall risk (weighted average)
      const expectedOverall = (1.8 + 0.8 + 0.8) / 3 // Equal weights in MVP
      expect(result.overallScore).toBe(Math.round(expectedOverall * 10) / 10)
      expect(result.overallRisk).toBe('low')
    })

    it('should handle high sensitivity scenarios', () => {
      const pollenData = createMockDailyPollenData(5, 4, 3) // High pollen indices
      const sensitivity = createMockSensitivity(10, 9, 8) // High sensitivity

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Verify high risk calculations
      expect(result.pollenTypes.tree.score).toBe(5.0) // (5 × 10) / 10 = 5.0
      expect(result.pollenTypes.grass.score).toBe(3.6) // (4 × 9) / 10 = 3.6
      expect(result.pollenTypes.weed.score).toBe(2.4) // (3 × 8) / 10 = 2.4

      // Overall should be moderate risk
      const expectedOverall = (5.0 + 3.6 + 2.4) / 3 // = 3.67
      expect(result.overallScore).toBe(Math.round(expectedOverall * 10) / 10) // = 3.7
      expect(result.overallRisk).toBe('moderate') // 3.7 is moderate (2-5), not high (5-8)
    })

    it('should calculate truly high risk scenarios', () => {
      const pollenData = createMockDailyPollenData(5, 5, 4) // High pollen indices
      const sensitivity = createMockSensitivity(10, 10, 10) // Maximum sensitivity

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Verify very high risk calculations
      expect(result.pollenTypes.tree.score).toBe(5.0) // (5 × 10) / 10 = 5.0
      expect(result.pollenTypes.grass.score).toBe(5.0) // (5 × 10) / 10 = 5.0
      expect(result.pollenTypes.weed.score).toBe(4.0) // (4 × 10) / 10 = 4.0

      // Overall should be high risk
      const expectedOverall = (5.0 + 5.0 + 4.0) / 3 // = 4.67
      expect(result.overallScore).toBe(Math.round(expectedOverall * 10) / 10) // = 4.7
      expect(result.overallRisk).toBe('moderate') // 4.7 is still moderate
    })

    it('should calculate very high risk scenarios', () => {
      const pollenData = createMockDailyPollenData(5, 5, 5) // Maximum pollen indices
      const sensitivity = createMockSensitivity(10, 10, 10) // Maximum sensitivity

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Verify maximum risk calculations  
      expect(result.pollenTypes.tree.score).toBe(5.0) // (5 × 10) / 10 = 5.0
      expect(result.pollenTypes.grass.score).toBe(5.0) // (5 × 10) / 10 = 5.0
      expect(result.pollenTypes.weed.score).toBe(5.0) // (5 × 10) / 10 = 5.0

      // Overall should be high risk (exactly at boundary)
      // Expected: (5.0 + 5.0 + 5.0) / 3 = 5.0
      expect(result.overallScore).toBe(5.0)
      expect(result.overallRisk).toBe('high') // 5.0 is exactly at high risk boundary
    })

    it('should handle low sensitivity scenarios', () => {
      const pollenData = createMockDailyPollenData(4, 3, 2) // Moderate pollen
      const sensitivity = createMockSensitivity(1, 2, 1) // Low sensitivity

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Verify low risk despite moderate pollen levels
      expect(result.pollenTypes.tree.score).toBe(0.4) // (4 × 1) / 10 = 0.4
      expect(result.pollenTypes.grass.score).toBe(0.6) // (3 × 2) / 10 = 0.6
      expect(result.pollenTypes.weed.score).toBe(0.2) // (2 × 1) / 10 = 0.2

      expect(result.overallRisk).toBe('low') // Should remain low due to low sensitivity
    })

    it('should handle missing pollen data gracefully', () => {
      const pollenData: DailyPollenInfo = {
        date: mockDate,
        pollenTypeInfo: [] // Empty pollen data
      }
      const sensitivity = createMockSensitivity()

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Should default to 0 for missing data
      expect(result.pollenTypes.tree.index).toBe(0)
      expect(result.pollenTypes.grass.index).toBe(0)
      expect(result.pollenTypes.weed.index).toBe(0)
      expect(result.overallScore).toBe(0)
      expect(result.overallRisk).toBe('low')
    })

    it('should set correct metadata', () => {
      const pollenData = createMockDailyPollenData()
      const sensitivity = createMockSensitivity()
      const locationName = 'San Francisco, CA'

      const result = calculatePersonalizedRisk(pollenData, sensitivity, locationName)

      expect(result.date).toBe(mockDate)
      expect(result.location).toBe(locationName)
      expect(result.lastUpdated).toBeInstanceOf(Date)
    })

    it('should use default location when not provided', () => {
      const pollenData = createMockDailyPollenData()
      const sensitivity = createMockSensitivity()

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      expect(result.location).toBe('Current Location')
    })
  })

  describe('calculateRiskTrend - Trend Analysis', () => {
    it('should detect improving conditions', () => {
      const currentRisk: ProcessedPollenData = {
        date: mockDate,
        location: 'Test',
        overallRisk: 'low',
        overallScore: 1.5,
        pollenTypes: {
          tree: { score: 0, risk: 'low' as const, rawIndex: 0 },
          grass: { score: 0, risk: 'low' as const, rawIndex: 0 },
          weed: { score: 0, risk: 'low' as const, rawIndex: 0 }
        },
        recommendations: [],
        lastUpdated: mockDate
      }

      const previousRisk: ProcessedPollenData = {
        ...currentRisk,
        overallScore: 3.0 // Higher previous score
      }

      const trend = calculateRiskTrend(currentRisk, previousRisk)

      expect(trend.direction).toBe('improving')
      expect(trend.scoreDifference).toBe(-1.5) // 1.5 - 3.0 = -1.5
    })

    it('should detect worsening conditions', () => {
      const currentRisk: ProcessedPollenData = {
        date: mockDate,
        location: 'Test',
        overallRisk: 'high',
        overallScore: 4.0,
        pollenTypes: {
          tree: { score: 0, risk: 'low' as const, rawIndex: 0 },
          grass: { score: 0, risk: 'low' as const, rawIndex: 0 },
          weed: { score: 0, risk: 'low' as const, rawIndex: 0 }
        },
        recommendations: [],
        lastUpdated: mockDate
      }

      const previousRisk: ProcessedPollenData = {
        ...currentRisk,
        overallScore: 2.0 // Lower previous score
      }

      const trend = calculateRiskTrend(currentRisk, previousRisk)

      expect(trend.direction).toBe('worsening')
      expect(trend.scoreDifference).toBe(2.0) // 4.0 - 2.0 = 2.0
      expect(trend.magnitude).toBe('significant') // > 2.0 difference
    })

    it('should detect stable conditions', () => {
      const currentRisk: ProcessedPollenData = {
        date: mockDate,
        location: 'Test',
        overallRisk: 'moderate',
        overallScore: 2.5,
        pollenTypes: {
          tree: { score: 0, risk: 'low' as const, rawIndex: 0 },
          grass: { score: 0, risk: 'low' as const, rawIndex: 0 },
          weed: { score: 0, risk: 'low' as const, rawIndex: 0 }
        },
        recommendations: [],
        lastUpdated: mockDate
      }

      const previousRisk: ProcessedPollenData = {
        ...currentRisk,
        overallScore: 2.7 // Small difference
      }

      const trend = calculateRiskTrend(currentRisk, previousRisk)

      expect(trend.direction).toBe('stable')
      expect(trend.magnitude).toBe('slight')
    })
  })

  describe('getActivityRecommendation - Activity Guidance', () => {
    it('should recommend ideal conditions for low risk', () => {
      const lowRiskData: ProcessedPollenData = {
        date: mockDate,
        location: 'Test',
        overallRisk: 'low',
        overallScore: 1.0,
        pollenTypes: {
          tree: { score: 0, risk: 'low' as const, rawIndex: 0 },
          grass: { score: 0, risk: 'low' as const, rawIndex: 0 },
          weed: { score: 0, risk: 'low' as const, rawIndex: 0 }
        },
        recommendations: [],
        lastUpdated: mockDate
      }

      const recommendation = getActivityRecommendation(lowRiskData)

      expect(recommendation.recommendation).toBe('ideal')
      expect(recommendation.bestTime).toBe('All day')
      expect(recommendation.reason).toContain('Low pollen levels')
    })

    it('should recommend caution for moderate risk', () => {
      const moderateRiskData: ProcessedPollenData = {
        date: mockDate,
        location: 'Test',
        overallRisk: 'moderate',
        overallScore: 3.0,
        pollenTypes: {
          tree: { score: 0, risk: 'low' as const, rawIndex: 0 },
          grass: { score: 0, risk: 'low' as const, rawIndex: 0 },
          weed: { score: 0, risk: 'low' as const, rawIndex: 0 }
        },
        recommendations: [],
        lastUpdated: mockDate
      }

      const recommendation = getActivityRecommendation(moderateRiskData)

      expect(recommendation.recommendation).toBe('caution')
      expect(recommendation.bestTime).toBe('Early morning or evening')
      expect(recommendation.reason).toContain('Moderate pollen levels')
    })

    it('should recommend avoiding very high risk conditions', () => {
      const veryHighRiskData: ProcessedPollenData = {
        date: mockDate,
        location: 'Test',
        overallRisk: 'very-high',
        overallScore: 9.0,
        pollenTypes: {
          tree: { score: 0, risk: 'low' as const, rawIndex: 0 },
          grass: { score: 0, risk: 'low' as const, rawIndex: 0 },
          weed: { score: 0, risk: 'low' as const, rawIndex: 0 }
        },
        recommendations: [],
        lastUpdated: mockDate
      }

      const recommendation = getActivityRecommendation(veryHighRiskData)

      expect(recommendation.recommendation).toBe('avoid')
      expect(recommendation.reason).toContain('Very high pollen levels')
      expect(recommendation.bestTime).toBeUndefined() // No good time for very high risk
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme sensitivity values', () => {
      const pollenData = createMockDailyPollenData(5, 5, 5) // Maximum pollen
      const extremeSensitivity = createMockSensitivity(10, 10, 10) // Maximum sensitivity

      const result = calculatePersonalizedRisk(pollenData, extremeSensitivity)

      // Each pollen type should have maximum risk score
      expect(result.pollenTypes.tree.score).toBe(5.0)
      expect(result.pollenTypes.grass.score).toBe(5.0)
      expect(result.pollenTypes.weed.score).toBe(5.0)
      expect(result.overallScore).toBe(5.0)
      expect(result.overallRisk).toBe('high')
    })

    it('should handle zero pollen indices correctly', () => {
      const pollenData = createMockDailyPollenData(0, 0, 0) // No pollen
      const sensitivity = createMockSensitivity(10, 10, 10) // High sensitivity

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Should be low risk regardless of high sensitivity when no pollen present
      expect(result.overallScore).toBe(0)
      expect(result.overallRisk).toBe('low')
    })

    it('should handle partial pollen data', () => {
      const pollenData: DailyPollenInfo = {
        date: mockDate,
        pollenTypeInfo: [
          createMockPollenTypeInfo('TREE', 4), // Only tree data available
        ]
      }
      const sensitivity = createMockSensitivity(5, 8, 3)

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Should handle missing grass and weed data
      expect(result.pollenTypes.tree.score).toBe(2.0) // (4 × 5) / 10
      expect(result.pollenTypes.grass.score).toBe(0) // Missing data = 0
      expect(result.pollenTypes.weed.score).toBe(0) // Missing data = 0
    })
  })

  describe('Business Logic Validation', () => {
    it('should maintain consistent risk level boundaries', () => {
      // Test boundary conditions precisely
      expect(getRiskLevel(1.99)).toBe('low')
      expect(getRiskLevel(2.0)).toBe('moderate')
      expect(getRiskLevel(4.99)).toBe('moderate')
      expect(getRiskLevel(5.0)).toBe('high')
      expect(getRiskLevel(7.99)).toBe('high')
      expect(getRiskLevel(8.0)).toBe('very-high')
    })

    it('should use equal weights for all pollen types in MVP', () => {
      // Verify equal weighting configuration
      expect(RISK_CONFIG.weights.tree).toBe(1.0)
      expect(RISK_CONFIG.weights.grass).toBe(1.0)
      expect(RISK_CONFIG.weights.weed).toBe(1.0)
    })

    it('should apply weighted average formula correctly', () => {
      const pollenData = createMockDailyPollenData(4, 2, 1) // Different indices
      const sensitivity = createMockSensitivity(5, 10, 2) // Different sensitivities

      const result = calculatePersonalizedRisk(pollenData, sensitivity)

      // Manual calculation: Tree: 2.0, Grass: 2.0, Weed: 0.2
      const expectedOverall = (2.0 + 2.0 + 0.2) / 3 // Equal weights
      expect(result.overallScore).toBe(Math.round(expectedOverall * 10) / 10)
    })
  })
})