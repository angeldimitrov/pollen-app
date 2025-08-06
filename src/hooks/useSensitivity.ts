/**
 * User sensitivity profile management hook
 * Handles sensitivity settings, validation, and persistence
 * 
 * Business Context:
 * - Manages user's sensitivity levels for Tree, Grass, and Weed pollen (1-10 scale)
 * - Provides validation and normalization of sensitivity values
 * - Persists changes to localStorage automatically
 * - Supports bulk updates and individual pollen type updates
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  SensitivityProfile, 
  DEFAULT_SENSITIVITY,
  PollenTypeKey 
} from '../types/user';
import { 
  loadUserProfile, 
  updateSensitivityProfile,
  validateSensitivityProfile 
} from '../services/storageService';

/**
 * Hook state interface
 */
interface UseSensitivityState {
  // Current sensitivity settings
  sensitivity: SensitivityProfile;
  
  // Unsaved changes tracking
  hasChanges: boolean;
  isDirty: boolean;
  
  // Loading and error states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Validation state
  isValid: boolean;
}

/**
 * Hook actions interface
 */
interface UseSensitivityActions {
  // Individual sensitivity updates
  setTreeSensitivity: (value: number) => void;
  setGrassSensitivity: (value: number) => void;
  setWeedSensitivity: (value: number) => void;
  
  // Bulk updates
  setSensitivity: (sensitivity: Partial<SensitivityProfile>) => void;
  resetToDefaults: () => void;
  
  // Persistence actions
  saveChanges: () => Promise<boolean>;
  discardChanges: () => void;
  
  // Validation and utilities
  validateSensitivity: (sensitivity: SensitivityProfile) => boolean;
  getSensitivityText: (type: PollenTypeKey) => string;
  
  // Error handling
  clearError: () => void;
}

/**
 * Return type for useSensitivity hook
 */
export type UseSensitivityReturn = UseSensitivityState & UseSensitivityActions;

/**
 * Configuration for sensitivity management
 */
const SENSITIVITY_CONFIG = {
  // Validation ranges
  minValue: 1,
  maxValue: 10,
  
  // Default values
  defaultValue: 5,
  
  // Debounce delay for auto-save
  autoSaveDelay: 1000, // 1 second
  
  // Text labels for sensitivity levels
  labels: {
    1: 'Very Low',
    2: 'Very Low',
    3: 'Low', 
    4: 'Low',
    5: 'Moderate',
    6: 'Moderate',
    7: 'High',
    8: 'High',
    9: 'Very High',
    10: 'Very High',
  } as Record<number, string>,
} as const;

/**
 * Custom hook for sensitivity profile management
 * Provides comprehensive sensitivity management with validation and persistence
 * 
 * @param options - Configuration options
 * @returns Sensitivity state and actions
 */
export function useSensitivity(options: {
  autoSave?: boolean;
  onSensitivityChange?: (sensitivity: SensitivityProfile) => void;
  onSaveComplete?: (success: boolean) => void;
  onError?: (error: string) => void;
} = {}): UseSensitivityReturn {
  
  const {
    autoSave = true,
    onSensitivityChange,
    onSaveComplete,
    onError,
  } = options;
  
  // State management
  const [state, setState] = useState<UseSensitivityState>({
    sensitivity: { ...DEFAULT_SENSITIVITY },
    hasChanges: false,
    isDirty: false,
    isLoading: true,
    isSaving: false,
    error: null,
    isValid: true,
  });
  
  // Track original values for change detection
  const [originalSensitivity, setOriginalSensitivity] = useState<SensitivityProfile>({ ...DEFAULT_SENSITIVITY });
  
  /**
   * Updates hook state immutably
   */
  const updateState = useCallback((updates: Partial<UseSensitivityState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);
  
  /**
   * Sets error state and notifies error callback
   */
  const setError = useCallback((error: string) => {
    updateState({ error });
    onError?.(error);
  }, [updateState, onError]);
  
  /**
   * Validates a sensitivity value
   */
  const isValidSensitivityValue = useCallback((value: number): boolean => {
    return Number.isInteger(value) && 
           value >= SENSITIVITY_CONFIG.minValue && 
           value <= SENSITIVITY_CONFIG.maxValue;
  }, []);
  
  /**
   * Validates complete sensitivity profile
   */
  const validateSensitivity = useCallback((sensitivity: SensitivityProfile): boolean => {
    return validateSensitivityProfile(sensitivity) &&
           isValidSensitivityValue(sensitivity.tree) &&
           isValidSensitivityValue(sensitivity.grass) &&
           isValidSensitivityValue(sensitivity.weed);
  }, [isValidSensitivityValue]);
  
  /**
   * Normalizes sensitivity value to valid range
   */
  const normalizeSensitivityValue = useCallback((value: number): number => {
    return Math.max(
      SENSITIVITY_CONFIG.minValue,
      Math.min(SENSITIVITY_CONFIG.maxValue, Math.round(value))
    );
  }, []);
  
  /**
   * Updates sensitivity and manages change tracking
   */
  const updateSensitivity = useCallback((newSensitivity: SensitivityProfile) => {
    const isValid = validateSensitivity(newSensitivity);
    const hasChanges = JSON.stringify(newSensitivity) !== JSON.stringify(originalSensitivity);
    
    updateState({
      sensitivity: newSensitivity,
      isValid,
      hasChanges,
      isDirty: hasChanges,
      error: isValid ? null : 'Invalid sensitivity values',
    });
    
    // Notify change callback
    if (isValid) {
      onSensitivityChange?.(newSensitivity);
    }
  }, [originalSensitivity, validateSensitivity, updateState, onSensitivityChange]);
  
  /**
   * Sets tree pollen sensitivity
   */
  const setTreeSensitivity = useCallback((value: number) => {
    const normalizedValue = normalizeSensitivityValue(value);
    updateSensitivity({
      ...state.sensitivity,
      tree: normalizedValue,
    });
  }, [state.sensitivity, normalizeSensitivityValue, updateSensitivity]);
  
  /**
   * Sets grass pollen sensitivity
   */
  const setGrassSensitivity = useCallback((value: number) => {
    const normalizedValue = normalizeSensitivityValue(value);
    updateSensitivity({
      ...state.sensitivity,
      grass: normalizedValue,
    });
  }, [state.sensitivity, normalizeSensitivityValue, updateSensitivity]);
  
  /**
   * Sets weed pollen sensitivity
   */
  const setWeedSensitivity = useCallback((value: number) => {
    const normalizedValue = normalizeSensitivityValue(value);
    updateSensitivity({
      ...state.sensitivity,
      weed: normalizedValue,
    });
  }, [state.sensitivity, normalizeSensitivityValue, updateSensitivity]);
  
  /**
   * Sets partial or complete sensitivity profile
   */
  const setSensitivity = useCallback((partialSensitivity: Partial<SensitivityProfile>) => {
    const newSensitivity = {
      ...state.sensitivity,
      ...partialSensitivity,
    };
    
    // Normalize all values
    const normalizedSensitivity = {
      tree: normalizeSensitivityValue(newSensitivity.tree),
      grass: normalizeSensitivityValue(newSensitivity.grass),
      weed: normalizeSensitivityValue(newSensitivity.weed),
    };
    
    updateSensitivity(normalizedSensitivity);
  }, [state.sensitivity, normalizeSensitivityValue, updateSensitivity]);
  
  /**
   * Resets sensitivity to default values
   */
  const resetToDefaults = useCallback(() => {
    updateSensitivity({ ...DEFAULT_SENSITIVITY });
  }, [updateSensitivity]);
  
  /**
   * Saves changes to localStorage
   */
  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (!state.hasChanges || !state.isValid) {
      return true;
    }
    
    updateState({ isSaving: true, error: null });
    
    try {
      const success = updateSensitivityProfile(state.sensitivity);
      
      if (success) {
        setOriginalSensitivity({ ...state.sensitivity });
        updateState({
          isSaving: false,
          hasChanges: false,
          isDirty: false,
          error: null,
        });
        
        onSaveComplete?.(true);
        return true;
      } else {
        setError('Failed to save sensitivity settings. Please try again.');
        updateState({ isSaving: false });
        onSaveComplete?.(false);
        return false;
      }
    } catch (error) {
      setError('Unable to save settings. Please check your browser storage.');
      updateState({ isSaving: false });
      onSaveComplete?.(false);
      return false;
    }
  }, [state.hasChanges, state.isValid, state.sensitivity, updateState, setError, onSaveComplete]);
  
  /**
   * Discards unsaved changes
   */
  const discardChanges = useCallback(() => {
    updateSensitivity({ ...originalSensitivity });
  }, [originalSensitivity, updateSensitivity]);
  
  /**
   * Gets user-friendly text for sensitivity level
   */
  const getSensitivityText = useCallback((type: PollenTypeKey): string => {
    const value = state.sensitivity[type];
    return SENSITIVITY_CONFIG.labels[value] || 'Moderate';
  }, [state.sensitivity]);
  
  /**
   * Clears current error state
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);
  
  /**
   * Load initial sensitivity data
   */
  useEffect(() => {
    try {
      const userProfile = loadUserProfile();
      const sensitivity = userProfile.sensitivity || DEFAULT_SENSITIVITY;
      
      // Validate loaded data
      const validatedSensitivity = validateSensitivity(sensitivity) 
        ? sensitivity 
        : DEFAULT_SENSITIVITY;
      
      setOriginalSensitivity({ ...validatedSensitivity });
      updateState({
        sensitivity: { ...validatedSensitivity },
        isLoading: false,
        hasChanges: false,
        isDirty: false,
        isValid: true,
      });
      
    } catch (error) {
      console.error('Failed to load sensitivity profile:', error);
      setError('Failed to load your sensitivity settings. Using defaults.');
      
      setOriginalSensitivity({ ...DEFAULT_SENSITIVITY });
      updateState({
        sensitivity: { ...DEFAULT_SENSITIVITY },
        isLoading: false,
        hasChanges: false,
        isDirty: false,
        isValid: true,
      });
    }
  }, [validateSensitivity, updateState, setError]);
  
  /**
   * Auto-save functionality with debouncing
   */
  useEffect(() => {
    if (!autoSave || !state.hasChanges || !state.isValid || state.isLoading) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      saveChanges();
    }, SENSITIVITY_CONFIG.autoSaveDelay);
    
    return () => clearTimeout(timeoutId);
  }, [autoSave, state.hasChanges, state.isValid, state.isLoading, saveChanges]);
  
  return {
    // State
    ...state,
    
    // Actions
    setTreeSensitivity,
    setGrassSensitivity,
    setWeedSensitivity,
    setSensitivity,
    resetToDefaults,
    saveChanges,
    discardChanges,
    validateSensitivity,
    getSensitivityText,
    clearError,
  };
}