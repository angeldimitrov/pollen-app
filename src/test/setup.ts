/**
 * Vitest test setup file
 * Configures testing environment and global test utilities
 */

import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock sessionStorage for testing  
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock environment variables for testing
vi.mock('vite', () => ({
  defineConfig: vi.fn()
}))

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
  
  mockGeolocation.getCurrentPosition.mockClear()
  mockGeolocation.watchPosition.mockClear()
  mockGeolocation.clearWatch.mockClear()
  
  // Reset fetch mock
  if (typeof global.fetch === 'function' && 'mockClear' in global.fetch) {
    (global.fetch as unknown as { mockClear: () => void }).mockClear()
  }
})