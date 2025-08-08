/**
 * Location Services Tests
 * 
 * Tests the useLocation hook which manages GPS detection, manual location input,
 * permission handling, and location state management. This is critical for ensuring
 * the app can obtain accurate coordinates for pollen data requests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocation } from '../src/hooks/useLocation'
import { Location, LocationError, LocationErrorType } from '../src/types/user'
import * as locationService from '../src/services/locationService'

// Mock the location service
vi.mock('../src/services/locationService', () => ({
  detectCurrentLocation: vi.fn(),
  parseManualLocation: vi.fn(),
  getLocationPermission: vi.fn(),
  isGeolocationSupported: vi.fn(),
  formatLocationDisplay: vi.fn(),
  saveLocationSettings: vi.fn(),
  loadLocationSettings: vi.fn(),
  calculateDistance: vi.fn(),
  createLocationError: vi.fn()
}))

describe('useLocation Hook - Location Management', () => {
  // Mock functions with proper typing
  const mockDetectCurrentLocation = vi.mocked(locationService.detectCurrentLocation)
  const mockParseManualLocation = vi.mocked(locationService.parseManualLocation)
  const mockGetLocationPermission = vi.mocked(locationService.getLocationPermission)
  const mockIsGeolocationSupported = vi.mocked(locationService.isGeolocationSupported)
  const mockFormatLocationDisplay = vi.mocked(locationService.formatLocationDisplay)
  const mockSaveLocationSettings = vi.mocked(locationService.saveLocationSettings)
  const mockLoadLocationSettings = vi.mocked(locationService.loadLocationSettings)
  const mockCalculateDistance = vi.mocked(locationService.calculateDistance)
  const mockCreateLocationError = vi.mocked(locationService.createLocationError)

  // Test data fixtures
  const mockLocation: Location = {
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    displayName: 'San Francisco, CA, US',
    formattedAddress: 'San Francisco, CA, USA',
    source: 'auto',
    timestamp: new Date('2025-08-08T12:00:00Z'),
    accuracy: 10
  }

  const mockLocationError: LocationError = {
    type: LocationErrorType.PERMISSION_DENIED,
    message: 'Location permission denied by user'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockIsGeolocationSupported.mockReturnValue(true)
    mockGetLocationPermission.mockResolvedValue('unknown')
    mockLoadLocationSettings.mockReturnValue({
      useAutoDetection: true,
      savedLocations: []
    })
    mockFormatLocationDisplay.mockReturnValue('Mock Location')
    mockCalculateDistance.mockReturnValue(500)
    mockCreateLocationError.mockImplementation((message) => ({
      type: LocationErrorType.UNKNOWN_ERROR,
      message
    }))
  })

  describe('Initialization and Basic State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      expect(result.current.location).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.permission).toBe('unknown')
      expect(result.current.isSupported).toBe(true)
      expect(result.current.settings.useAutoDetection).toBe(true)
    })

    it('should load saved location settings on mount', () => {
      const savedSettings = {
        useAutoDetection: false,
        savedLocations: [mockLocation],
        current: mockLocation
      }
      mockLoadLocationSettings.mockReturnValue(savedSettings)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      expect(result.current.settings).toEqual(savedSettings)
      expect(result.current.location).toEqual(mockLocation)
    })

    it('should detect geolocation support correctly', () => {
      mockIsGeolocationSupported.mockReturnValue(false)

      const { result } = renderHook(() => useLocation())

      expect(result.current.isSupported).toBe(false)
    })
  })

  describe('Location Detection', () => {
    it('should detect current location successfully', async () => {
      mockDetectCurrentLocation.mockResolvedValue(mockLocation)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(result.current.location).toEqual(mockLocation)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle location detection errors', async () => {
      mockDetectCurrentLocation.mockRejectedValue(mockLocationError)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(result.current.location).toBeNull()
      expect(result.current.error).toEqual(mockLocationError)
      expect(result.current.isLoading).toBe(false)
    })

    it('should reject detection when geolocation not supported', async () => {
      mockIsGeolocationSupported.mockReturnValue(false)
      mockCreateLocationError.mockReturnValue({
        type: LocationErrorType.NOT_SUPPORTED,
        message: 'Geolocation not supported by your browser'
      })

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(result.current.error?.type).toBe(LocationErrorType.NOT_SUPPORTED)
      expect(mockDetectCurrentLocation).not.toHaveBeenCalled()
    })

    it('should handle significant location changes', async () => {
      const initialLocation = { ...mockLocation }
      const newLocation = {
        ...mockLocation,
        latitude: 40.7128, // New York coordinates
        longitude: -74.0060,
        displayName: 'New York, NY'
      }

      mockDetectCurrentLocation.mockResolvedValueOnce(initialLocation)
      mockCalculateDistance.mockReturnValue(2000000) // 2000km - significant change

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      // First detection
      await act(async () => {
        await result.current.detectLocation()
      })
      
      expect(result.current.location).toEqual(initialLocation)

      // Second detection with significant change
      mockDetectCurrentLocation.mockResolvedValueOnce(newLocation)
      
      await act(async () => {
        await result.current.detectLocation()
      })

      expect(result.current.location).toEqual(newLocation)
    })

    it('should ignore insignificant location changes', async () => {
      const initialLocation = { ...mockLocation }
      const nearbyLocation = {
        ...mockLocation,
        latitude: 37.7750, // Very small change
        longitude: -122.4195
      }

      mockDetectCurrentLocation.mockResolvedValueOnce(initialLocation)
      mockCalculateDistance.mockReturnValue(50) // 50m - insignificant change

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      // First detection
      await act(async () => {
        await result.current.detectLocation()
      })

      expect(result.current.location).toEqual(initialLocation)

      // Second detection with insignificant change
      mockDetectCurrentLocation.mockResolvedValueOnce(nearbyLocation)
      
      await act(async () => {
        await result.current.detectLocation()
      })

      // Should not update location due to insignificant change
      expect(result.current.location).toEqual(initialLocation)
    })
  })

  describe('Manual Location Input', () => {
    it('should set manual location from coordinates', async () => {
      const manualLocation = {
        ...mockLocation,
        source: 'manual' as const
      }
      
      mockParseManualLocation.mockReturnValue(manualLocation)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.setManualLocation({
          latitude: 37.7749,
          longitude: -122.4194,
          displayName: 'San Francisco'
        })
      })

      expect(mockParseManualLocation).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
        displayName: 'San Francisco'
      })
      expect(result.current.location).toEqual(manualLocation)
      expect(result.current.error).toBeNull()
    })

    it('should handle manual location parsing errors', async () => {
      const parseError: LocationError = {
        type: LocationErrorType.INVALID_LOCATION,
        message: 'Invalid coordinates provided'
      }
      
      mockParseManualLocation.mockImplementation(() => {
        throw parseError
      })

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.setManualLocation({
          latitude: 'invalid',
          longitude: 'invalid'
        })
      })

      expect(result.current.location).toBeNull()
      expect(result.current.error).toEqual(parseError)
    })

    it('should set location from city selection', async () => {
      const mockCity = {
        name: 'New York',
        formattedAddress: 'New York, NY, USA',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      }

      const expectedLocation: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        displayName: 'New York',
        formattedAddress: 'New York, NY, USA',
        source: 'manual',
        timestamp: expect.any(Date),
        accuracy: null
      }

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.setCityLocation(mockCity)
      })

      expect(result.current.location).toEqual(expectedLocation)
    })
  })

  describe('Permission Management', () => {
    it('should refresh location permission state', async () => {
      mockGetLocationPermission.mockResolvedValue('granted')

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.refreshPermission()
      })

      expect(result.current.permission).toBe('granted')
    })

    it('should handle permission check failures gracefully', async () => {
      mockGetLocationPermission.mockRejectedValue(new Error('Permission API error'))

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.refreshPermission()
      })

      // Should not crash, permission should remain unknown
      expect(result.current.permission).toBe('unknown')
    })
  })

  describe('Location Settings Management', () => {
    it('should toggle auto-detection setting', () => {
      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      expect(result.current.settings.useAutoDetection).toBe(true)

      act(() => {
        result.current.toggleAutoDetection()
      })

      expect(result.current.settings.useAutoDetection).toBe(false)
      expect(mockSaveLocationSettings).toHaveBeenCalledWith({
        useAutoDetection: false,
        savedLocations: []
      })
    })

    it('should save location to saved locations list', () => {
      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      act(() => {
        result.current.saveLocation(mockLocation, 'My Favorite Place')
      })

      expect(mockSaveLocationSettings).toHaveBeenCalledWith({
        useAutoDetection: true,
        savedLocations: [{
          ...mockLocation,
          displayName: 'My Favorite Place'
        }]
      })
    })

    it('should prevent duplicate saved locations', () => {
      mockCalculateDistance.mockReturnValue(50) // Within 100m threshold

      const existingSaved = { ...mockLocation, displayName: 'Existing Location' }
      mockLoadLocationSettings.mockReturnValue({
        useAutoDetection: true,
        savedLocations: [existingSaved]
      })

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      act(() => {
        result.current.saveLocation(mockLocation, 'Updated Location')
      })

      // Should update existing location instead of adding duplicate
      expect(mockSaveLocationSettings).toHaveBeenCalledWith({
        useAutoDetection: true,
        savedLocations: [{
          ...mockLocation,
          displayName: 'Updated Location'
        }]
      })
    })

    it('should remove saved location by index', () => {
      const savedLocations = [
        { ...mockLocation, displayName: 'Location 1' },
        { ...mockLocation, displayName: 'Location 2' },
        { ...mockLocation, displayName: 'Location 3' }
      ]

      mockLoadLocationSettings.mockReturnValue({
        useAutoDetection: true,
        savedLocations
      })

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      act(() => {
        result.current.removeLocation(1) // Remove middle location
      })

      expect(result.current.settings.savedLocations).toEqual([
        { ...mockLocation, displayName: 'Location 1' },
        { ...mockLocation, displayName: 'Location 3' }
      ])
    })

    it('should select saved location as current', () => {
      const savedLocation = { ...mockLocation, displayName: 'Saved Location' }

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      act(() => {
        result.current.selectSavedLocation(savedLocation)
      })

      expect(result.current.location).toEqual(savedLocation)
      expect(mockSaveLocationSettings).toHaveBeenCalledWith({
        useAutoDetection: true,
        savedLocations: [],
        current: savedLocation
      })
    })
  })

  describe('Error Handling', () => {
    it('should clear error state', async () => {
      mockDetectCurrentLocation.mockRejectedValue(mockLocationError)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      // Set error state
      await act(async () => {
        await result.current.detectLocation()
      })

      expect(result.current.error).toEqual(mockLocationError)

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should call error callback when provided', async () => {
      const mockOnError = vi.fn()
      mockDetectCurrentLocation.mockRejectedValue(mockLocationError)

      const { result } = renderHook(() => useLocation({ onError: mockOnError }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(mockOnError).toHaveBeenCalledWith(mockLocationError)
    })
  })

  describe('Change Callbacks', () => {
    it('should call onLocationChange when location is set', async () => {
      const mockOnLocationChange = vi.fn()
      mockDetectCurrentLocation.mockResolvedValue(mockLocation)

      const { result } = renderHook(() => useLocation({ 
        autoDetect: false,
        onLocationChange: mockOnLocationChange 
      }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(mockOnLocationChange).toHaveBeenCalledWith(mockLocation)
    })

    it('should not call onLocationChange when location detection fails', async () => {
      const mockOnLocationChange = vi.fn()
      mockDetectCurrentLocation.mockRejectedValue(mockLocationError)

      const { result } = renderHook(() => useLocation({ 
        autoDetect: false,
        onLocationChange: mockOnLocationChange 
      }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(mockOnLocationChange).not.toHaveBeenCalled()
    })
  })

  describe('Utility Functions', () => {
    it('should format location for display', () => {
      mockFormatLocationDisplay.mockReturnValue('San Francisco, CA')

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      const formatted = result.current.formatLocation(mockLocation)

      expect(formatted).toBe('San Francisco, CA')
      expect(mockFormatLocationDisplay).toHaveBeenCalledWith(mockLocation)
    })

    it('should format current location when no argument provided', () => {
      mockFormatLocationDisplay.mockReturnValue('Current Location')
      mockLoadLocationSettings.mockReturnValue({
        useAutoDetection: true,
        savedLocations: [],
        current: mockLocation
      })

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      const formatted = result.current.formatLocation()

      expect(formatted).toBe('Current Location')
    })
  })

  describe('Edge Cases', () => {
    it('should handle abort signals during detection', async () => {
      const abortError = new Error('Operation aborted')
      abortError.name = 'AbortError'
      mockDetectCurrentLocation.mockRejectedValue(abortError)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.detectLocation()
      })

      // Should not show error for aborted operations
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should save location settings on successful detection', async () => {
      mockDetectCurrentLocation.mockResolvedValue(mockLocation)

      const { result } = renderHook(() => useLocation({ autoDetect: false }))

      await act(async () => {
        await result.current.detectLocation()
      })

      expect(mockSaveLocationSettings).toHaveBeenCalledWith({
        useAutoDetection: true,
        savedLocations: [],
        current: mockLocation,
        lastDetectionTime: expect.any(Date)
      })
    })
  })
})