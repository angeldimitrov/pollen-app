/**
 * Location Card Component
 * Displays current location information with option to update
 */

import React from 'react';
import { Location } from '../../types/user';

interface LocationCardProps {
  location: Location | null;
  isLoading?: boolean;
  onLocationDetect?: () => void;
}

export function LocationCard({ location, isLoading = false, onLocationDetect }: LocationCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Location</h2>
        {onLocationDetect && (
          <button
            onClick={onLocationDetect}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            aria-label="Update location"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
      
      {location ? (
        <div className="space-y-2">
          {location.city && (
            <div className="flex items-center space-x-2">
              <span className="text-lg">📍</span>
              <span className="font-medium text-gray-900">{location.city}</span>
            </div>
          )}
          
          {(location.state || location.country) && (
            <div className="text-sm text-gray-600">
              {location.state}{location.country && `, ${location.country}`}
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-3">Location not detected</p>
          {onLocationDetect && (
            <button
              onClick={onLocationDetect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Detect Location
            </button>
          )}
        </div>
      )}
    </div>
  );
}