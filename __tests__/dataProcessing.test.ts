/**
 * Data Processing Tests
 * 
 * Tests the data processing utilities and helper functions that handle
 * pollen data transformation, forecast processing, date handling, and data validation.
 * These tests ensure data flows correctly between API responses and UI components.
 */

import { describe, it, expect } from 'vitest'
import { calculatePersonalizedRisk } from '../src/utils/calculateRisk'
import { DailyPollenInfo, PollenTypeInfo } from '../src/types/pollen'
import { SensitivityProfile } from '../src/types/user'

describe('Data Processing - Pollen Data Transformation', () => {
  // Test data fixtures
  const mockSensitivity: SensitivityProfile = {
    tree: 7,    // High sensitivity
    grass: 3,   // Low sensitivity  
    weed: 5     // Moderate sensitivity
  }

  const createMockPollenTypeInfo = (
    code: 'TREE' | 'GRASS' | 'WEED',
    indexValue: number,
    inSeason: boolean = true,
    recommendations: string[] = []
  ): PollenTypeInfo => ({
    code,
    displayName: `${code.toLowerCase()} pollen`,
    inSeason,
    indexInfo: {
      code: `${code}_UPI`,
      displayName: `${code} UPI`,
      value: indexValue,
      category: indexValue > 3 ? 'HIGH' : indexValue > 1 ? 'MODERATE' : 'LOW',
      color: { red: 255, green: 165, blue: 0 }
    },
    healthRecommendations: recommendations
  })

  const createMockDailyPollenData = (
    date: Date,
    treeIndex: number = 3,
    grassIndex: number = 2,
    weedIndex: number = 1,
    treeInSeason: boolean = true,
    grassInSeason: boolean = true,
    weedInSeason: boolean = false
  ): DailyPollenInfo => ({
    date,
    pollenTypeInfo: [
      createMockPollenTypeInfo('TREE', treeIndex, treeInSeason, [
        'Stay indoors during peak times',
        'Keep windows closed'
      ]),
      createMockPollenTypeInfo('GRASS', grassIndex, grassInSeason, [
        'Avoid outdoor activities in morning',
        'Take antihistamine medication'
      ]),
      createMockPollenTypeInfo('WEED', weedIndex, weedInSeason, [
        'Check pollen forecast daily'
      ])
    ]
  })

  describe('Date Processing and Handling', () => {
    it('should handle current date correctly', () => {
      const currentDate = new Date('2025-08-08T10:00:00Z')
      const dailyData = createMockDailyPollenData(currentDate)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity, 'Test Location')

      expect(result.date).toEqual(currentDate)
      expect(result.date.getFullYear()).toBe(2025)
      expect(result.date.getMonth()).toBe(7) // 0-indexed, August = 7
      expect(result.date.getDate()).toBe(8)
    })

    it('should handle different date formats', () => {
      const testDates = [
        new Date('2025-01-01'),     // New Year
        new Date('2025-06-15'),     // Mid-year
        new Date('2025-12-31'),     // End of year
        new Date('2024-02-29'),     // Leap year
      ]

      testDates.forEach((date) => {
        const dailyData = createMockDailyPollenData(date)
        const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

        expect(result.date).toEqual(date)
        expect(result.date.toISOString().split('T')[0]).toBe(date.toISOString().split('T')[0])
      })
    })

    it('should preserve time zones correctly', () => {
      const utcDate = new Date('2025-08-08T14:30:00Z')
      const dailyData = createMockDailyPollenData(utcDate)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      expect(result.date.getUTCHours()).toBe(14)
      expect(result.date.getUTCMinutes()).toBe(30)
      expect(result.lastUpdated).toBeInstanceOf(Date)
    })

    it('should handle edge case dates', () => {
      // Test very early date
      const earlyDate = new Date('1970-01-01')
      const dailyData = createMockDailyPollenData(earlyDate)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)
      expect(result.date).toEqual(earlyDate)

      // Test far future date
      const futureDate = new Date('2030-12-25')
      const futureDailyData = createMockDailyPollenData(futureDate)

      const futureResult = calculatePersonalizedRisk(futureDailyData, mockSensitivity)
      expect(futureResult.date).toEqual(futureDate)
    })
  })

  describe('Pollen Data Transformation', () => {
    it('should transform raw pollen indices to personalized scores', () => {
      const dailyData = createMockDailyPollenData(
        new Date('2025-08-08'),
        4, // Tree index
        2, // Grass index  
        3  // Weed index
      )

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Verify individual transformations: (index × sensitivity) / 10
      expect(result.pollenTypes.tree.index).toBe(4)
      expect(result.pollenTypes.tree.score).toBe(2.8) // (4 × 7) / 10
      
      expect(result.pollenTypes.grass.index).toBe(2) 
      expect(result.pollenTypes.grass.score).toBe(0.6) // (2 × 3) / 10
      
      expect(result.pollenTypes.weed.index).toBe(3)
      expect(result.pollenTypes.weed.score).toBe(1.5) // (3 × 5) / 10
    })

    it('should preserve original pollen indices alongside calculated scores', () => {
      const dailyData = createMockDailyPollenData(new Date(), 5, 1, 0)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Original indices should be preserved
      expect(result.pollenTypes.tree.index).toBe(5)
      expect(result.pollenTypes.grass.index).toBe(1)
      expect(result.pollenTypes.weed.index).toBe(0)

      // Calculated scores should be different
      expect(result.pollenTypes.tree.score).toBe(3.5) // (5 × 7) / 10
      expect(result.pollenTypes.grass.score).toBe(0.3) // (1 × 3) / 10
      expect(result.pollenTypes.weed.score).toBe(0)    // (0 × 5) / 10
    })

    it('should handle zero pollen indices', () => {
      const dailyData = createMockDailyPollenData(new Date(), 0, 0, 0)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      expect(result.pollenTypes.tree.score).toBe(0)
      expect(result.pollenTypes.grass.score).toBe(0)
      expect(result.pollenTypes.weed.score).toBe(0)
      expect(result.overallScore).toBe(0)
      expect(result.overallRisk).toBe('low')
    })

    it('should handle maximum pollen indices', () => {
      const highSensitivity = { tree: 10, grass: 10, weed: 10 }
      const dailyData = createMockDailyPollenData(new Date(), 5, 5, 5)

      const result = calculatePersonalizedRisk(dailyData, highSensitivity)

      expect(result.pollenTypes.tree.score).toBe(5.0)
      expect(result.pollenTypes.grass.score).toBe(5.0)
      expect(result.pollenTypes.weed.score).toBe(5.0)
      expect(result.overallScore).toBe(5.0)
    })
  })

  describe('Seasonal Data Processing', () => {
    it('should preserve seasonal status for each pollen type', () => {
      const dailyData = createMockDailyPollenData(
        new Date(),
        3, 2, 1,        // Indices
        true, false, true // Seasonal status
      )

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      expect(result.pollenTypes.tree.inSeason).toBe(true)
      expect(result.pollenTypes.grass.inSeason).toBe(false)
      expect(result.pollenTypes.weed.inSeason).toBe(true)
    })

    it('should handle out-of-season pollen correctly', () => {
      const dailyData = createMockDailyPollenData(
        new Date(),
        2, 3, 4,           // Moderate indices
        false, false, false // All out of season
      )

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Scores should still be calculated even if out of season
      expect(result.pollenTypes.tree.score).toBe(1.4) // (2 × 7) / 10
      expect(result.pollenTypes.grass.score).toBe(0.9) // (3 × 3) / 10
      expect(result.pollenTypes.weed.score).toBe(2.0) // (4 × 5) / 10

      // But seasonal status should be preserved
      expect(result.pollenTypes.tree.inSeason).toBe(false)
      expect(result.pollenTypes.grass.inSeason).toBe(false)
      expect(result.pollenTypes.weed.inSeason).toBe(false)
    })

    it('should handle mixed seasonal status', () => {
      const dailyData = createMockDailyPollenData(
        new Date(),
        4, 2, 3,          // Different indices
        true, false, true // Mixed seasonal status
      )

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      expect(result.pollenTypes.tree.inSeason).toBe(true)
      expect(result.pollenTypes.grass.inSeason).toBe(false)
      expect(result.pollenTypes.weed.inSeason).toBe(true)

      // Overall risk should consider all pollen types regardless of season
      expect(result.overallScore).toBeGreaterThan(0)
    })
  })

  describe('Health Recommendations Processing', () => {
    it('should consolidate recommendations from in-season pollen types', () => {
      const dailyData = createMockDailyPollenData(
        new Date(),
        3, 2, 1,          // Indices
        true, true, false // Tree and grass in season, weed out of season
      )

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Should include recommendations from in-season pollen (tree and grass)
      expect(result.recommendations).toContain('Stay indoors during peak times')
      expect(result.recommendations).toContain('Keep windows closed')
      expect(result.recommendations).toContain('Avoid outdoor activities in morning')
      expect(result.recommendations).toContain('Take antihistamine medication')

      // Should NOT include recommendations from out-of-season pollen (weed)
      expect(result.recommendations).not.toContain('Check pollen forecast daily')
    })

    it('should handle duplicate recommendations', () => {
      // Create pollen data with overlapping recommendations
      const pollenWithDuplicates: DailyPollenInfo = {
        date: new Date(),
        pollenTypeInfo: [
          createMockPollenTypeInfo('TREE', 3, true, [
            'Stay indoors during peak times',
            'Keep windows closed',
            'Use air purifier' // Common recommendation
          ]),
          createMockPollenTypeInfo('GRASS', 2, true, [
            'Use air purifier', // Duplicate
            'Take antihistamine',
            'Avoid morning jogs'
          ]),
          createMockPollenTypeInfo('WEED', 1, true, [
            'Use air purifier', // Another duplicate
            'Check daily forecast'
          ])
        ]
      }

      const result = calculatePersonalizedRisk(pollenWithDuplicates, mockSensitivity)

      // Should deduplicate recommendations
      const airPurifierCount = result.recommendations.filter(rec => rec === 'Use air purifier').length
      expect(airPurifierCount).toBe(1)

      // Should include unique recommendations (but limited to 5)
      expect(result.recommendations).toContain('Stay indoors during peak times')
      expect(result.recommendations).toContain('Take antihistamine')
      
      // Some recommendations might be excluded due to the 5-item limit
      const allExpectedRecs = ['Stay indoors during peak times', 'Keep windows closed', 'Use air purifier', 'Take antihistamine', 'Avoid morning jogs', 'Check daily forecast']
      const includedRecs = allExpectedRecs.filter(rec => result.recommendations.includes(rec))
      expect(includedRecs.length).toBeGreaterThanOrEqual(3) // At least some should be included
    })

    it('should limit recommendations to maximum count for mobile display', () => {
      // Create pollen data with many recommendations
      const pollenWithManyRecs: DailyPollenInfo = {
        date: new Date(),
        pollenTypeInfo: [
          createMockPollenTypeInfo('TREE', 4, true, [
            'Recommendation 1',
            'Recommendation 2',
            'Recommendation 3',
          ]),
          createMockPollenTypeInfo('GRASS', 3, true, [
            'Recommendation 4',
            'Recommendation 5',
            'Recommendation 6',
          ]),
          createMockPollenTypeInfo('WEED', 2, true, [
            'Recommendation 7',
            'Recommendation 8',
            'Recommendation 9',
            'Recommendation 10'
          ])
        ]
      }

      const result = calculatePersonalizedRisk(pollenWithManyRecs, mockSensitivity)

      // Should limit to 5 recommendations for mobile display
      expect(result.recommendations).toHaveLength(5)
    })

    it('should handle empty recommendations gracefully', () => {
      const pollenWithNoRecs: DailyPollenInfo = {
        date: new Date(),
        pollenTypeInfo: [
          createMockPollenTypeInfo('TREE', 2, true, []),
          createMockPollenTypeInfo('GRASS', 1, true, []),
          createMockPollenTypeInfo('WEED', 0, false, [])
        ]
      }

      const result = calculatePersonalizedRisk(pollenWithNoRecs, mockSensitivity)

      expect(result.recommendations).toEqual([])
      expect(result.recommendations).toHaveLength(0)
    })
  })

  describe('Overall Risk Calculation', () => {
    it('should calculate overall risk as weighted average', () => {
      const dailyData = createMockDailyPollenData(new Date(), 4, 2, 3)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Individual scores: Tree: 2.8, Grass: 0.6, Weed: 1.5
      // Overall = (2.8 + 0.6 + 1.5) / 3 = 4.9 / 3 = 1.63 -> rounded to 1.6
      const expectedOverall = (2.8 + 0.6 + 1.5) / 3
      expect(result.overallScore).toBe(Math.round(expectedOverall * 10) / 10)
    })

    it('should use equal weights for all pollen types in MVP', () => {
      const dailyData = createMockDailyPollenData(new Date(), 5, 1, 2)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Individual scores: Tree: 3.5, Grass: 0.3, Weed: 1.0
      // Equal weights: (3.5 + 0.3 + 1.0) / 3 = 4.8 / 3 = 1.6
      expect(result.overallScore).toBe(1.6)
    })

    it('should handle extreme score differences', () => {
      const extremeSensitivity = { tree: 10, grass: 1, weed: 1 }
      const dailyData = createMockDailyPollenData(new Date(), 5, 5, 5)

      const result = calculatePersonalizedRisk(dailyData, extremeSensitivity)

      // Individual scores: Tree: 5.0, Grass: 0.5, Weed: 0.5
      // Average: (5.0 + 0.5 + 0.5) / 3 = 2.0
      expect(result.overallScore).toBe(2.0)
      expect(result.overallRisk).toBe('moderate')
    })
  })

  describe('Risk Level Classification', () => {
    it('should classify risk levels correctly based on overall score', () => {
      // Test risk classification by creating scenarios that produce specific scores
      
      // Test low risk (< 2)
      const lowRiskData = createMockDailyPollenData(new Date(), 1, 1, 1) // All indices = 1
      const lowSensitivity = { tree: 1, grass: 1, weed: 1 } // All sensitivity = 1
      const lowResult = calculatePersonalizedRisk(lowRiskData, lowSensitivity)
      // (1×1 + 1×1 + 1×1) / 3 / 10 = 0.1
      expect(lowResult.overallRisk).toBe('low')

      // Test moderate risk (2-5) - using higher values to reach moderate threshold
      
      const moderateRiskData2 = createMockDailyPollenData(new Date(), 4, 4, 4) // All indices = 4
      const moderateSensitivity2 = { tree: 6, grass: 6, weed: 6 } // All sensitivity = 6
      const moderateResult2 = calculatePersonalizedRisk(moderateRiskData2, moderateSensitivity2)
      // (4×6 + 4×6 + 4×6) / 3 / 10 = 2.4 - moderate
      expect(moderateResult2.overallRisk).toBe('moderate')

      // Test high risk (5-8)
      const highRiskData = createMockDailyPollenData(new Date(), 5, 5, 5) // All indices = 5
      const highSensitivity = { tree: 10, grass: 10, weed: 10 } // All sensitivity = 10
      const highResult = calculatePersonalizedRisk(highRiskData, highSensitivity)
      // (5×10 + 5×10 + 5×10) / 3 / 10 = 5.0 - exactly high boundary
      expect(highResult.overallRisk).toBe('high')
    })

    it('should classify individual pollen type risks correctly', () => {
      const dailyData = createMockDailyPollenData(new Date(), 3, 1, 5)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      // Tree: (3 × 7) / 10 = 2.1 -> moderate
      expect(result.pollenTypes.tree.risk).toBe('moderate')

      // Grass: (1 × 3) / 10 = 0.3 -> low
      expect(result.pollenTypes.grass.risk).toBe('low')

      // Weed: (5 × 5) / 10 = 2.5 -> moderate
      expect(result.pollenTypes.weed.risk).toBe('moderate')
    })
  })

  describe('Location and Metadata Processing', () => {
    it('should handle location name correctly', () => {
      const dailyData = createMockDailyPollenData(new Date())

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity, 'San Francisco, CA')

      expect(result.location).toBe('San Francisco, CA')
    })

    it('should use default location when none provided', () => {
      const dailyData = createMockDailyPollenData(new Date())

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      expect(result.location).toBe('Current Location')
    })

    it('should set lastUpdated timestamp', () => {
      const dailyData = createMockDailyPollenData(new Date())
      const beforeTime = new Date()

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)
      const afterTime = new Date()

      expect(result.lastUpdated).toBeInstanceOf(Date)
      expect(result.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(result.lastUpdated.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should preserve input date separate from lastUpdated', () => {
      const inputDate = new Date('2025-08-08T10:00:00Z')
      const dailyData = createMockDailyPollenData(inputDate)

      const result = calculatePersonalizedRisk(dailyData, mockSensitivity)

      expect(result.date).toEqual(inputDate)
      expect(result.lastUpdated).not.toEqual(inputDate)
      expect(result.lastUpdated.getTime()).toBeGreaterThan(inputDate.getTime())
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing pollen type data gracefully', () => {
      const incompleteData: DailyPollenInfo = {
        date: new Date(),
        pollenTypeInfo: [
          createMockPollenTypeInfo('TREE', 3, true),
          // Missing GRASS and WEED data
        ]
      }

      const result = calculatePersonalizedRisk(incompleteData, mockSensitivity)

      expect(result.pollenTypes.tree.score).toBe(2.1) // (3 × 7) / 10
      expect(result.pollenTypes.grass.score).toBe(0)   // Missing -> 0
      expect(result.pollenTypes.weed.score).toBe(0)    // Missing -> 0

      // Should not crash and should calculate overall score
      expect(result.overallScore).toBe(0.7) // (2.1 + 0 + 0) / 3 = 0.7
    })

    it('should handle empty pollen type array', () => {
      const emptyData: DailyPollenInfo = {
        date: new Date(),
        pollenTypeInfo: []
      }

      const result = calculatePersonalizedRisk(emptyData, mockSensitivity)

      expect(result.pollenTypes.tree.score).toBe(0)
      expect(result.pollenTypes.grass.score).toBe(0)
      expect(result.pollenTypes.weed.score).toBe(0)
      expect(result.overallScore).toBe(0)
      expect(result.overallRisk).toBe('low')
      expect(result.recommendations).toEqual([])
    })

    it('should handle malformed sensitivity values', () => {
      const malformedSensitivity = { tree: 15, grass: -2, weed: 0 } // Outside valid range

      const dailyData = createMockDailyPollenData(new Date(), 3, 2, 1)

      const result = calculatePersonalizedRisk(dailyData, malformedSensitivity as SensitivityProfile)

      // Function should still execute (validation happens elsewhere)
      expect(result).toBeDefined()
      expect(result.overallScore).toBeTypeOf('number')
      expect(result.overallRisk).toMatch(/^(low|moderate|high|very-high)$/)
    })

    it('should handle very large pollen indices', () => {
      const extremeData = createMockDailyPollenData(new Date(), 100, 50, 75) // Way above normal range

      const result = calculatePersonalizedRisk(extremeData, mockSensitivity)

      // Original indices should be preserved (for debugging/display purposes)
      expect(result.pollenTypes.tree.index).toBe(100)
      expect(result.pollenTypes.grass.index).toBe(50)
      expect(result.pollenTypes.weed.index).toBe(75)

      // But risk calculation should use clamped values (0-5 range)
      // The implementation clamps extreme indices to valid range before calculation
      expect(result.pollenTypes.tree.score).toBe(3.5)  // Clamped to 5, so (5 × 7) / 10 = 3.5
      expect(result.pollenTypes.grass.score).toBe(1.5) // Clamped to 5, so (5 × 3) / 10 = 1.5
      expect(result.pollenTypes.weed.score).toBe(2.5)  // Clamped to 5, so (5 × 5) / 10 = 2.5

      // Overall should be moderate risk due to clamping
      expect(result.overallRisk).toBe('moderate') // (3.5 + 1.5 + 2.5) / 3 = 2.5 = moderate
    })
  })

  describe('Multiple Day Forecast Processing', () => {
    it('should process each day independently', () => {
      // This test focuses on the data processing for individual days
      // Multiple day logic would be handled at a higher level
      
      const day1 = createMockDailyPollenData(new Date('2025-08-08'), 4, 2, 1)
      const day2 = createMockDailyPollenData(new Date('2025-08-09'), 2, 3, 2)

      const result1 = calculatePersonalizedRisk(day1, mockSensitivity)
      const result2 = calculatePersonalizedRisk(day2, mockSensitivity)

      // Each day should be processed independently
      expect(result1.date.getDate()).toBe(8)
      expect(result2.date.getDate()).toBe(9)

      // Different pollen levels should produce different results
      expect(result1.pollenTypes.tree.score).toBe(2.8) // (4 × 7) / 10
      expect(result2.pollenTypes.tree.score).toBe(1.4) // (2 × 7) / 10

      expect(result1.overallScore).not.toBe(result2.overallScore)
    })
  })
})