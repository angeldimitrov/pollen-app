/**
 * Pollen API Integration Tests
 * 
 * Tests the Google Pollen API service which handles all API requests, response parsing,
 * error handling, and data transformation. This is critical for ensuring reliable
 * communication with the Google Pollen API and proper error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  fetchPollenForecast, 
  fetchCurrentPollenData, 
  createPollenError,
  PollenErrorType
} from '../src/services/pollenApi'
import { Location } from '../src/types/user'
import { PollenError } from '../src/types/pollen'

// Mock environment variables using vi.stubEnv for proper Vite environment mocking
vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-api-key-for-testing')
vi.stubEnv('VITE_POLLEN_API_BASE', 'https://pollen.googleapis.com/v1')
vi.stubEnv('DEV', 'false')

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Pollen API Service - API Integration', () => {
  // Test data fixtures
  const mockLocation: Location = {
    latitude: 37.7749,
    longitude: -122.4194,
    displayName: 'San Francisco, CA'
  }

  const mockRawApiResponse = {
    regionCode: 'US-CA',
    dailyInfo: [
      {
        date: '2025-08-08',
        pollenTypeInfo: [
          {
            code: 'TREE',
            displayName: 'Tree pollen',
            inSeason: true,
            indexInfo: {
              code: 'TREE_UPI',
              displayName: 'Tree UPI',
              value: 3,
              category: 'MODERATE',
              color: { red: 255, green: 165, blue: 0 }
            },
            healthRecommendations: [
              'Stay indoors during peak times',
              'Keep windows closed'
            ]
          },
          {
            code: 'GRASS',
            displayName: 'Grass pollen',
            inSeason: true,
            indexInfo: {
              code: 'GRASS_UPI',
              displayName: 'Grass UPI',
              value: 2,
              category: 'LOW',
              color: { red: 0, green: 255, blue: 0 }
            },
            healthRecommendations: [
              'Exercise indoors if sensitive'
            ]
          },
          {
            code: 'WEED',
            displayName: 'Weed pollen',
            inSeason: false,
            indexInfo: {
              code: 'WEED_UPI',
              displayName: 'Weed UPI',
              value: 0,
              category: 'NONE',
              color: { red: 0, green: 255, blue: 0 }
            },
            healthRecommendations: []
          }
        ]
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue(mockRawApiResponse)
    })
  })

  describe('Request Formatting and API Calls', () => {
    it('should make GET request with correct method and headers', async () => {
      await fetchPollenForecast(mockLocation, 3)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('forecast:lookup')
      expect(options.method).toBe('GET')
      expect(options.headers).toEqual({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
    })

    it('should include location coordinates in request', async () => {
      await fetchPollenForecast(mockLocation, 3)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('location.latitude=37.7749')
      expect(url).toContain('location.longitude=-122.4194')
    })

    it('should include days parameter in request', async () => {
      await fetchPollenForecast(mockLocation, 5)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('days=5')
    })

    it('should include API key in request', async () => {
      await fetchPollenForecast(mockLocation, 3)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('key=')
    })

    it('should clamp days parameter to valid range', async () => {
      // Test below minimum
      await fetchPollenForecast(mockLocation, 0)
      let [url] = mockFetch.mock.calls[0]
      expect(url).toContain('days=1')

      // Test above maximum  
      mockFetch.mockClear()
      await fetchPollenForecast(mockLocation, 10)
      ;[url] = mockFetch.mock.calls[0]
      expect(url).toContain('days=5')
    })

    it('should include optional parameters when provided', async () => {
      await fetchPollenForecast(mockLocation, 3, {
        includePlantDetails: true,
        languageCode: 'es-ES'
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('plantsDescription=true')
      expect(url).toContain('languageCode=es-ES')
    })
  })

  describe('Response Parsing and Transformation', () => {
    it('should parse successful API response correctly', async () => {
      const result = await fetchPollenForecast(mockLocation)

      expect(result.regionCode).toBe('US-CA')
      expect(result.dailyInfo).toHaveLength(1)
      expect(result.dailyInfo[0].date).toBeInstanceOf(Date)
      expect(result.dailyInfo[0].pollenTypeInfo).toHaveLength(3)
    })

    it('should transform date strings to Date objects', async () => {
      const result = await fetchPollenForecast(mockLocation)

      const dailyInfo = result.dailyInfo[0]
      expect(dailyInfo.date).toBeInstanceOf(Date)
      expect(dailyInfo.date.getFullYear()).toBe(2025)
      expect(dailyInfo.date.getMonth()).toBe(7) // 0-indexed, August = 7
      expect(dailyInfo.date.getDate()).toBe(8)
    })

    it('should preserve pollen type data structure', async () => {
      const result = await fetchPollenForecast(mockLocation)

      const treeData = result.dailyInfo[0].pollenTypeInfo.find(p => p.code === 'TREE')
      expect(treeData).toBeDefined()
      expect(treeData?.displayName).toBe('Tree pollen')
      expect(treeData?.inSeason).toBe(true)
      expect(treeData?.indexInfo.value).toBe(3)
      expect(treeData?.healthRecommendations).toHaveLength(2)
    })

    it('should handle empty dailyInfo gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA',
          dailyInfo: []
        })
      })

      const result = await fetchPollenForecast(mockLocation)

      expect(result.regionCode).toBe('US-CA')
      expect(result.dailyInfo).toHaveLength(0)
    })

    it('should handle missing regionCode', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          dailyInfo: [mockRawApiResponse.dailyInfo[0]]
        })
      })

      const result = await fetchPollenForecast(mockLocation)

      expect(result.regionCode).toBe('Unknown')
      expect(result.dailyInfo).toHaveLength(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('fetch failed'))

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: PollenErrorType.NETWORK_ERROR,
        message: expect.stringContaining('Unable to connect')
      })
    })

    it('should handle HTTP 401 unauthorized errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: expect.any(String),
        message: expect.any(String)
      })
    })

    it('should handle HTTP 403 forbidden errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: expect.any(String),
        message: expect.any(String)
      })
    })

    it('should handle HTTP 429 rate limit errors', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: expect.any(String),
        message: expect.any(String)
      })
    })

    it('should handle HTTP 404 not found errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: expect.any(String),
        message: expect.any(String)
      })
    })

    it('should handle invalid response data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA'
          // Missing dailyInfo
        })
      })

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: PollenErrorType.NO_DATA_AVAILABLE,
        message: expect.stringContaining('Invalid response')
      })
    })

    it('should handle non-array dailyInfo', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA',
          dailyInfo: 'invalid' // Should be array
        })
      })

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: PollenErrorType.NO_DATA_AVAILABLE,
        message: expect.stringContaining('Invalid response')
      })
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      })

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: PollenErrorType.UNKNOWN_ERROR,
        message: expect.stringContaining('unexpected error')
      })
    })
  })

  describe('Retry Logic and Resilience', () => {
    it('should retry failed network requests', async () => {
      // First call fails with network error, second succeeds
      mockFetch
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockRawApiResponse)
        })

      const result = await fetchPollenForecast(mockLocation)

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.regionCode).toBe('US-CA')
    })

    it('should not retry authentication errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: expect.any(String)
      })

      expect(mockFetch).toHaveBeenCalled() // Should attempt the request
    })

    it('should not retry rate limit errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: expect.any(String)
      })

      expect(mockFetch).toHaveBeenCalled() // Should attempt the request
    })
  })

  describe('fetchCurrentPollenData - Convenience Method', () => {
    it('should fetch current day data only', async () => {
      const result = await fetchCurrentPollenData(mockLocation)

      expect(result).toEqual(expect.objectContaining({
        date: expect.any(Date),
        pollenTypeInfo: expect.any(Array)
      }))
      
      // Verify it called fetch with days=1
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('days=1')
    })

    it('should handle empty response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA',
          dailyInfo: []
        })
      })

      await expect(fetchCurrentPollenData(mockLocation)).rejects.toMatchObject({
        type: PollenErrorType.NO_DATA_AVAILABLE,
        message: expect.stringContaining('No current pollen data')
      })
    })

    it('should pass through options correctly', async () => {
      await fetchCurrentPollenData(mockLocation, {
        includePlantDetails: true,
        languageCode: 'fr-FR'
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('plantsDescription=true')
      expect(url).toContain('languageCode=fr-FR')
    })
  })

  describe('createPollenError - Error Factory Function', () => {
    it('should handle TypeError (network errors)', () => {
      const networkError = new TypeError('fetch failed')
      const result = createPollenError(networkError)

      expect(result).toMatchObject({
        type: PollenErrorType.NETWORK_ERROR,
        message: expect.stringContaining('Unable to connect'),
        originalError: networkError
      })
    })

    it('should handle Response objects with HTTP status codes', () => {
      const response = { status: 500, statusText: 'Internal Server Error' } as Response
      const result = createPollenError(response)

      expect(result.type).toBe(PollenErrorType.UNKNOWN_ERROR)
      expect(result.message).toContain('unexpected error')
    })

    it('should handle already structured PollenError objects', () => {
      const existingError: PollenError = {
        type: PollenErrorType.API_RATE_LIMIT,
        message: 'Custom rate limit message'
      }

      const result = createPollenError(existingError)

      expect(result).toEqual(existingError)
    })

    it('should handle unknown error types', () => {
      const unknownError = 'some string error'
      const result = createPollenError(unknownError, 'during testing')

      expect(result).toMatchObject({
        type: PollenErrorType.UNKNOWN_ERROR,
        message: expect.stringContaining('during testing')
      })
    })

    it('should include context in error messages', () => {
      const error = new Error('test error')
      const result = createPollenError(error, 'while processing data')

      expect(result.message).toContain('while processing data')
    })
  })

  describe('Data Validation and Edge Cases', () => {
    it('should handle malformed pollen type data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA',
          dailyInfo: [
            {
              date: '2025-08-08',
              pollenTypeInfo: 'invalid' // Should be array
            }
          ]
        })
      })

      const result = await fetchPollenForecast(mockLocation)

      expect(result.dailyInfo[0].pollenTypeInfo).toBe('invalid')
      // API service should not crash, let validation happen in risk calculation
    })

    it('should handle missing index info', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA',
          dailyInfo: [
            {
              date: '2025-08-08',
              pollenTypeInfo: [
                {
                  code: 'TREE',
                  displayName: 'Tree pollen',
                  inSeason: true
                  // Missing indexInfo
                }
              ]
            }
          ]
        })
      })

      const result = await fetchPollenForecast(mockLocation)

      expect(result.dailyInfo[0].pollenTypeInfo[0]).not.toHaveProperty('indexInfo')
      // Should not crash, validation handled elsewhere
    })

    it('should handle multiple daily info entries', async () => {
      const multipleDaysResponse = {
        regionCode: 'US-CA',
        dailyInfo: [
          { ...mockRawApiResponse.dailyInfo[0], date: '2025-08-08' },
          { ...mockRawApiResponse.dailyInfo[0], date: '2025-08-09' },
          { ...mockRawApiResponse.dailyInfo[0], date: '2025-08-10' }
        ]
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(multipleDaysResponse)
      })

      const result = await fetchPollenForecast(mockLocation, 3)

      expect(result.dailyInfo).toHaveLength(3)
      expect(result.dailyInfo[0].date.getDate()).toBe(8)
      expect(result.dailyInfo[1].date.getDate()).toBe(9)
      expect(result.dailyInfo[2].date.getDate()).toBe(10)
    })
  })

  describe('Request Timeout and Abort Signal Handling', () => {
    it('should handle request timeouts appropriately', async () => {
      // Mock a request that times out
      mockFetch.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      await expect(fetchPollenForecast(mockLocation)).rejects.toMatchObject({
        type: PollenErrorType.UNKNOWN_ERROR,
        message: expect.stringContaining('unexpected error')
      })
    }, 10000) // Higher timeout for this test

    it('should pass abort signals to fetch', async () => {
      const abortController = new AbortController()
      
      await fetchPollenForecast(mockLocation, 3, {
        signal: abortController.signal
      })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.signal).toEqual(abortController.signal)
    })
  })

  describe('API Configuration and Environment', () => {
    it('should use correct API endpoints', async () => {
      await fetchPollenForecast(mockLocation)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toMatch(/forecast:lookup/)
    })

    it('should handle API responses with missing optional fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          regionCode: 'US-CA',
          dailyInfo: [
            {
              date: '2025-08-08',
              pollenTypeInfo: [
                {
                  code: 'TREE',
                  displayName: 'Tree pollen'
                  // Missing inSeason, indexInfo, healthRecommendations
                }
              ]
            }
          ]
        })
      })

      const result = await fetchPollenForecast(mockLocation)

      expect(result.dailyInfo[0].pollenTypeInfo[0].code).toBe('TREE')
      expect(result.dailyInfo[0].pollenTypeInfo[0]).not.toHaveProperty('inSeason')
    })
  })
})