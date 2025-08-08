/**
 * City Selection Component with Google Maps Integration
 * 
 * Provides search/autocomplete interface for manual city selection
 * when geolocation is unavailable or user prefers manual control.
 * 
 * Business Context:
 * - Fallback when device geolocation fails or is denied
 * - Enables users to check pollen levels for different cities
 * - Integrates with Google Maps for accurate coordinate lookup
 */

import React, { useState, useEffect, useRef } from 'react';
import { searchCities, getPopularCities, City, MapsServiceError } from '../../services/mapsService';

interface CitySelectorProps {
  onCitySelect: (city: City) => void;
  onClose: () => void;
  isOpen: boolean;
  currentCity?: string;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  onCitySelect,
  onClose,
  isOpen,
  currentCity
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load popular cities on mount
  useEffect(() => {
    const loadPopularCities = async () => {
      try {
        const cities = await getPopularCities();
        setPopularCities(cities);
      } catch {
        // Ignore errors loading popular cities
      }
    };

    if (isOpen) {
      loadPopularCities();
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search cities when query changes
  useEffect(() => {
    const searchForCities = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setError(null);
        return;
      }

      if (searchQuery.length < 2) {
        return; // Wait for at least 2 characters
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchCities(searchQuery, 8);
        setSearchResults(results);
        setSelectedIndex(-1); // Reset selection
      } catch (error) {
        if (error instanceof MapsServiceError) {
          setError(error.message);
        } else {
          setError('Failed to search cities. Please try again.');
        }
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchForCities, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const results = searchResults.length > 0 ? searchResults : popularCities;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? results.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleCitySelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleCitySelect = (city: City) => {
    onCitySelect(city);
    onClose();
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const formatCityDisplay = (city: City) => {
    const parts = [city.name];
    if (city.region && city.region !== city.name) {
      parts.push(city.region);
    }
    if (city.country && city.country !== city.region) {
      parts.push(city.country);
    }
    return parts.join(', ');
  };

  const displayResults = searchResults.length > 0 ? searchResults : popularCities;
  const showNoResults = searchQuery.length >= 2 && !isLoading && searchResults.length === 0 && !error;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Select City</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close city selector"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {currentCity && (
            <p className="text-sm text-gray-500 mt-2">
              Current: {currentCity}
            </p>
          )}
        </div>

        {/* Results */}
        <div 
          ref={resultsRef}
          className="flex-1 overflow-y-auto"
        >
          {error && (
            <div className="p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {showNoResults && (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm">No cities found for "{searchQuery}"</p>
              <p className="text-gray-400 text-xs mt-1">Try searching with a different spelling</p>
            </div>
          )}

          {displayResults.length > 0 && (
            <div className="py-2">
              {searchQuery.length < 2 && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Popular Cities
                </div>
              )}
              
              {displayResults.map((city, index) => (
                <button
                  key={city.placeId}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-l-2 transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-transparent'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {city.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {formatCityDisplay(city)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Use ↑↓ keys to navigate, Enter to select, Esc to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default CitySelector;