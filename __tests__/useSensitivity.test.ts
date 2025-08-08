/**
 * Sensitivity Management Tests
 * 
 * Tests the useSensitivity hook which manages user sensitivity profiles,
 * validation, localStorage persistence, and debounced updates.
 * This is critical for maintaining user preferences and ensuring data integrity.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSensitivity } from '../src/hooks/useSensitivity'
import { DEFAULT_SENSITIVITY } from '../src/types/user'
import * as storageService from '../src/services/storageService'

// Mock the storage service
vi.mock('../src/services/storageService', () => ({
  loadUserProfile: vi.fn(),
  updateSensitivityProfile: vi.fn(),
  validateSensitivityProfile: vi.fn()
}))

describe('useSensitivity Hook - Sensitivity Management', () => {
  // Mock functions with proper typing
  const mockLoadUserProfile = vi.mocked(storageService.loadUserProfile)
  const mockUpdateSensitivityProfile = vi.mocked(storageService.updateSensitivityProfile)
  const mockValidateSensitivityProfile = vi.mocked(storageService.validateSensitivityProfile)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Default mock implementations
    mockLoadUserProfile.mockReturnValue({
      id: 'test-id',
      sensitivity: DEFAULT_SENSITIVITY,
      location: {
        useAutoDetection: true,
        savedLocations: []
      },
      settings: {
        temperatureUnit: 'celsius',
        language: 'en-US',
        enableNotifications: false,
        dataRefreshInterval: 60
      },
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0.0'
    })
    
    mockUpdateSensitivityProfile.mockReturnValue(true)
    mockValidateSensitivityProfile.mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization and Default Values', () => {
    it('should initialize with default sensitivity values', () => {
      const { result } = renderHook(() => useSensitivity())

      // The hook may complete initialization synchronously due to our mock
      // Let's just check the final state after timers
      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.sensitivity).toEqual(DEFAULT_SENSITIVITY)
      expect(result.current.hasChanges).toBe(false)
      expect(result.current.isValid).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should load saved sensitivity profile from storage', () => {
      const customSensitivity = { tree: 7, grass: 3, weed: 9 }
      mockLoadUserProfile.mockReturnValue({
        id: 'test-id',
        sensitivity: customSensitivity,
        location: { useAutoDetection: true, savedLocations: [] },
        settings: { temperatureUnit: 'celsius', language: 'en-US', enableNotifications: false, dataRefreshInterval: 60 },
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0.0'
      })

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.sensitivity).toEqual(customSensitivity)
      expect(result.current.hasChanges).toBe(false)
    })

    it('should fallback to defaults when loading fails', () => {
      mockLoadUserProfile.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.sensitivity).toEqual(DEFAULT_SENSITIVITY)
      expect(result.current.error).toContain('Failed to load your sensitivity settings')
      expect(result.current.isLoading).toBe(false)
    })

    it('should validate loaded data and use defaults if invalid', () => {
      const invalidSensitivity = { tree: 15, grass: -5, weed: 0 } // Invalid values
      mockLoadUserProfile.mockReturnValue({
        id: 'test-id',
        sensitivity: invalidSensitivity,
        location: { useAutoDetection: true, savedLocations: [] },
        settings: { temperatureUnit: 'celsius', language: 'en-US', enableNotifications: false, dataRefreshInterval: 60 },
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0.0'
      })
      
      mockValidateSensitivityProfile.mockReturnValue(false) // Invalid profile

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // Should fallback to default sensitivity
      expect(result.current.sensitivity).toEqual(DEFAULT_SENSITIVITY)
    })
  })

  describe('Individual Sensitivity Updates', () => {
    it('should update tree sensitivity correctly', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers() // Complete initialization
      })

      act(() => {
        result.current.setTreeSensitivity(8)
      })

      expect(result.current.sensitivity.tree).toBe(8)
      expect(result.current.sensitivity.grass).toBe(5) // Unchanged
      expect(result.current.sensitivity.weed).toBe(5) // Unchanged
      expect(result.current.hasChanges).toBe(true)
      expect(result.current.isDirty).toBe(true)
    })

    it('should update grass sensitivity correctly', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setGrassSensitivity(3)
      })

      expect(result.current.sensitivity.grass).toBe(3)
      expect(result.current.sensitivity.tree).toBe(5) // Unchanged
      expect(result.current.sensitivity.weed).toBe(5) // Unchanged
      expect(result.current.hasChanges).toBe(true)
    })

    it('should update weed sensitivity correctly', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setWeedSensitivity(10)
      })

      expect(result.current.sensitivity.weed).toBe(10)
      expect(result.current.sensitivity.tree).toBe(5) // Unchanged
      expect(result.current.sensitivity.grass).toBe(5) // Unchanged
      expect(result.current.hasChanges).toBe(true)
    })
  })

  describe('Bulk Sensitivity Updates', () => {
    it('should update partial sensitivity profile', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setSensitivity({ tree: 7, grass: 2 })
      })

      expect(result.current.sensitivity.tree).toBe(7)
      expect(result.current.sensitivity.grass).toBe(2)
      expect(result.current.sensitivity.weed).toBe(5) // Unchanged
      expect(result.current.hasChanges).toBe(true)
    })

    it('should update complete sensitivity profile', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      const newSensitivity = { tree: 9, grass: 4, weed: 6 }
      act(() => {
        result.current.setSensitivity(newSensitivity)
      })

      expect(result.current.sensitivity).toEqual(newSensitivity)
      expect(result.current.hasChanges).toBe(true)
    })

    it('should reset to default values', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // First change values
      act(() => {
        result.current.setSensitivity({ tree: 10, grass: 1, weed: 3 })
      })

      expect(result.current.sensitivity).not.toEqual(DEFAULT_SENSITIVITY)

      // Then reset
      act(() => {
        result.current.resetToDefaults()
      })

      expect(result.current.sensitivity).toEqual(DEFAULT_SENSITIVITY)
      expect(result.current.hasChanges).toBe(false)
    })
  })

  describe('Value Validation and Normalization', () => {
    it('should validate sensitivity values in range 1-10', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // Valid values should pass validation
      act(() => {
        result.current.setSensitivity({ tree: 1, grass: 10, weed: 5 })
      })

      expect(result.current.isValid).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should normalize values outside valid range', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // Test values below minimum (should be clamped to 1)
      act(() => {
        result.current.setTreeSensitivity(0)
      })
      expect(result.current.sensitivity.tree).toBe(1)

      act(() => {
        result.current.setGrassSensitivity(-5)
      })
      expect(result.current.sensitivity.grass).toBe(1)

      // Test values above maximum (should be clamped to 10)
      act(() => {
        result.current.setWeedSensitivity(15)
      })
      expect(result.current.sensitivity.weed).toBe(10)
    })

    it('should round fractional values to integers', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(7.8)
      })
      expect(result.current.sensitivity.tree).toBe(8) // Rounded up

      act(() => {
        result.current.setGrassSensitivity(3.2)
      })
      expect(result.current.sensitivity.grass).toBe(3) // Rounded down
    })

    it('should validate complete sensitivity profile', () => {
      mockValidateSensitivityProfile.mockReturnValue(false)

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setSensitivity({ tree: 5, grass: 5, weed: 5 })
      })

      expect(result.current.isValid).toBe(false)
      expect(result.current.error).toBe('Invalid sensitivity values')
    })
  })

  describe('Auto-Save Functionality', () => {
    it('should auto-save changes after debounce delay', async () => {
      const { result } = renderHook(() => useSensitivity({ autoSave: true }))

      act(() => {
        vi.runAllTimers() // Complete initialization
      })

      // Make a change
      act(() => {
        result.current.setTreeSensitivity(8)
      })

      expect(result.current.hasChanges).toBe(true)
      expect(mockUpdateSensitivityProfile).not.toHaveBeenCalled()

      // Wait for debounce delay (800ms)
      act(() => {
        vi.advanceTimersByTime(800)
      })

      expect(mockUpdateSensitivityProfile).toHaveBeenCalledWith({ tree: 8, grass: 5, weed: 5 })
      expect(result.current.hasChanges).toBe(false)
    })

    it('should not auto-save when disabled', () => {
      const { result } = renderHook(() => useSensitivity({ autoSave: false }))

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(7)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockUpdateSensitivityProfile).not.toHaveBeenCalled()
      expect(result.current.hasChanges).toBe(true)
    })

    it('should not auto-save invalid values', () => {
      mockValidateSensitivityProfile.mockReturnValue(false)

      const { result } = renderHook(() => useSensitivity({ autoSave: true }))

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setSensitivity({ tree: 5, grass: 5, weed: 5 })
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockUpdateSensitivityProfile).not.toHaveBeenCalled()
    })

    it('should debounce multiple rapid changes', () => {
      const { result } = renderHook(() => useSensitivity({ autoSave: true }))

      act(() => {
        vi.runAllTimers()
      })

      // Make multiple rapid changes
      act(() => {
        result.current.setTreeSensitivity(6)
      })

      act(() => {
        vi.advanceTimersByTime(400) // Less than debounce delay
      })

      act(() => {
        result.current.setTreeSensitivity(7)
      })

      act(() => {
        vi.advanceTimersByTime(400) // Still less than total debounce
      })

      act(() => {
        result.current.setTreeSensitivity(8)
      })

      // Should not have saved yet
      expect(mockUpdateSensitivityProfile).not.toHaveBeenCalled()

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(800)
      })

      // Should save only the final value
      expect(mockUpdateSensitivityProfile).toHaveBeenCalledTimes(1)
      expect(mockUpdateSensitivityProfile).toHaveBeenCalledWith({ tree: 8, grass: 5, weed: 5 })
    })
  })

  describe('Manual Save Operations', () => {
    it('should save changes manually', async () => {
      const { result } = renderHook(() => useSensitivity({ autoSave: false }))

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(6)
      })

      expect(result.current.hasChanges).toBe(true)

      let saveResult: boolean
      await act(async () => {
        saveResult = await result.current.saveChanges()
      })

      expect(saveResult).toBe(true)
      expect(mockUpdateSensitivityProfile).toHaveBeenCalledWith({ tree: 6, grass: 5, weed: 5 })
      expect(result.current.hasChanges).toBe(false)
      expect(result.current.isSaving).toBe(false)
    })

    it('should handle save failures', async () => {
      mockUpdateSensitivityProfile.mockReturnValue(false)

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(9)
      })

      let saveResult: boolean
      await act(async () => {
        saveResult = await result.current.saveChanges()
      })

      expect(saveResult).toBe(false)
      expect(result.current.error).toContain('Failed to save sensitivity settings')
      expect(result.current.hasChanges).toBe(true) // Changes still pending
    })

    it('should handle save exceptions', async () => {
      mockUpdateSensitivityProfile.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(4)
      })

      let saveResult: boolean
      await act(async () => {
        saveResult = await result.current.saveChanges()
      })

      expect(saveResult).toBe(false)
      expect(result.current.error).toContain('Unable to save settings')
    })

    it('should not save when no changes exist', async () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      let saveResult: boolean
      await act(async () => {
        saveResult = await result.current.saveChanges()
      })

      expect(saveResult).toBe(true)
      expect(mockUpdateSensitivityProfile).not.toHaveBeenCalled()
    })

    it('should not save invalid values', async () => {
      mockValidateSensitivityProfile.mockReturnValue(false)

      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setSensitivity({ tree: 5, grass: 5, weed: 5 })
      })

      let saveResult: boolean
      await act(async () => {
        saveResult = await result.current.saveChanges()
      })

      expect(saveResult).toBe(true) // Returns true for invalid values (no save needed)
      expect(mockUpdateSensitivityProfile).not.toHaveBeenCalled()
    })
  })

  describe('Change Management', () => {
    it('should track changes correctly', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.hasChanges).toBe(false)
      expect(result.current.isDirty).toBe(false)

      // Make a change
      act(() => {
        result.current.setTreeSensitivity(7)
      })

      expect(result.current.hasChanges).toBe(true)
      expect(result.current.isDirty).toBe(true)

      // Revert to original value
      act(() => {
        result.current.setTreeSensitivity(5)
      })

      expect(result.current.hasChanges).toBe(false)
      expect(result.current.isDirty).toBe(false)
    })

    it('should discard changes correctly', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // Make changes
      act(() => {
        result.current.setSensitivity({ tree: 9, grass: 2, weed: 8 })
      })

      expect(result.current.hasChanges).toBe(true)
      expect(result.current.sensitivity).not.toEqual(DEFAULT_SENSITIVITY)

      // Discard changes
      act(() => {
        result.current.discardChanges()
      })

      expect(result.current.hasChanges).toBe(false)
      expect(result.current.sensitivity).toEqual(DEFAULT_SENSITIVITY)
    })
  })

  describe('Utility Functions', () => {
    it('should get sensitivity text labels correctly', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // Test different sensitivity levels
      act(() => {
        result.current.setSensitivity({ tree: 1, grass: 5, weed: 10 })
      })

      expect(result.current.getSensitivityText('tree')).toBe('Very Low') // 1-2
      expect(result.current.getSensitivityText('grass')).toBe('Moderate') // 5-6  
      expect(result.current.getSensitivityText('weed')).toBe('Very High') // 9-10
    })

    it('should clear error state', () => {
      const { result } = renderHook(() => useSensitivity())

      act(() => {
        vi.runAllTimers()
      })

      // Set an error state
      mockValidateSensitivityProfile.mockReturnValue(false)
      act(() => {
        result.current.setSensitivity({ tree: 5, grass: 5, weed: 5 })
      })

      expect(result.current.error).not.toBeNull()

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Callback Integration', () => {
    it('should call onSensitivityChange callback with debounce', () => {
      const mockOnChange = vi.fn()
      const { result } = renderHook(() => useSensitivity({ onSensitivityChange: mockOnChange }))

      act(() => {
        vi.runAllTimers()
      })

      // Clear any calls from initialization
      mockOnChange.mockClear()

      act(() => {
        result.current.setTreeSensitivity(8)
      })

      // Should not call immediately
      expect(mockOnChange).not.toHaveBeenCalled()

      // Should call after debounce
      act(() => {
        vi.advanceTimersByTime(800)
      })

      expect(mockOnChange).toHaveBeenCalledWith({ tree: 8, grass: 5, weed: 5 })
    })

    it('should call onSaveComplete callback', async () => {
      const mockOnSaveComplete = vi.fn()
      const { result } = renderHook(() => useSensitivity({ onSaveComplete: mockOnSaveComplete }))

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(6)
      })

      await act(async () => {
        await result.current.saveChanges()
      })

      expect(mockOnSaveComplete).toHaveBeenCalledWith(true)
    })

    it('should call onError callback on save failure', async () => {
      const mockOnError = vi.fn()
      mockUpdateSensitivityProfile.mockReturnValue(false)

      const { result } = renderHook(() => useSensitivity({ onError: mockOnError }))

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.setTreeSensitivity(7)
      })

      await act(async () => {
        await result.current.saveChanges()
      })

      expect(mockOnError).toHaveBeenCalledWith('Failed to save sensitivity settings. Please try again.')
    })
  })
})