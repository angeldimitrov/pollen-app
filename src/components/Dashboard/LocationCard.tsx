/**
 * Location Card Component
 * Displays current location information with options to update via GPS or manual selection
 * 
 * Business Context:
 * - Primary interface for location management in the app
 * - Shows both automatic GPS detection and manual city selection options
 * - Provides clear feedback on current location source (GPS vs manual)
 */

import React, { useState } from 'react';
import { Location } from '../../types/user';
import { City } from '../../services/mapsService';
import { LocationButton } from '../common/LocationButton';
import { CitySelector } from '../common/CitySelector';

interface LocationCardProps {
  location: Location | null;
  isLoading?: boolean;
  hasLocationError?: boolean;
  onLocationDetect?: () => void;
  onCitySelect?: (city: City) => void;
}

export function LocationCard({ 
  location, 
  isLoading = false, 
  hasLocationError = false,
  onLocationDetect,
  onCitySelect 
}: LocationCardProps): React.JSX.Element {
  const [showCitySelector, setShowCitySelector] = useState(false);

  const handleCitySelect = (city: City) => {
    onCitySelect?.(city);
    setShowCitySelector(false);
  };

  const getCurrentLocationName = () => {
    if (!location) return undefined;
    
    // Prefer displayName, then city, then formatted address
    return location.displayName || 
           location.city || 
           location.formattedAddress ||
           `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const getLocationSource = () => {
    if (!location) return null;
    return location.source === 'auto' ? '📍 GPS' : '🏙️ Manual';
  };

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Location</h2>
          
          {/* GPS detection button - only show when GPS is supported */}
          {onLocationDetect && (
            <button
              onClick={onLocationDetect}
              className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Detect GPS location"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
        
        {location ? (
          <div className="space-y-4">
            {/* Current location display */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {location.source === 'auto' ? '📍' : '🏙️'}
                </span>
                <span className="font-medium text-gray-900">
                  {getCurrentLocationName()}
                </span>
              </div>
              
              {location.formattedAddress && location.displayName !== location.formattedAddress && (
                <div className="text-sm text-gray-600 ml-6">
                  {location.formattedAddress}
                </div>
              )}
              
              <div className="text-xs text-gray-500 ml-6 flex items-center space-x-3">
                <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                {getLocationSource() && (
                  <>
                    <span>•</span>
                    <span>{getLocationSource()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Location change button */}
            <LocationButton
              currentLocation={getCurrentLocationName()}
              isLoading={isLoading}
              hasLocationError={hasLocationError}
              onClick={() => setShowCitySelector(true)}
              className="w-full"
            />
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4">Location not available</p>
            
            <div className="space-y-3">
              {/* Manual city selection button */}
              <LocationButton
                currentLocation={undefined}
                isLoading={isLoading}
                hasLocationError={hasLocationError}
                onClick={() => setShowCitySelector(true)}
                className="w-full"
              />
              
              {/* GPS detection as secondary option */}
              {onLocationDetect && (
                <button
                  onClick={onLocationDetect}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use GPS Location
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* City Selection Modal */}
      {showCitySelector && (
        <CitySelector
          isOpen={showCitySelector}
          currentCity={getCurrentLocationName()}
          onCitySelect={handleCitySelect}
          onClose={() => setShowCitySelector(false)}
        />
      )}
    </>
  );
}