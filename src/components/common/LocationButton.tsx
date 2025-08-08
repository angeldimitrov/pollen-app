/**
 * Location Button Component
 * 
 * Provides manual location selection trigger and displays current location.
 * Shows different states based on location detection status.
 * 
 * Business Context:
 * - Primary interface for switching between automatic and manual location
 * - Displays current location status clearly to user
 * - Handles both geolocation success and failure scenarios
 */

import React from 'react';

interface LocationButtonProps {
  currentLocation?: string;
  isLoading?: boolean;
  hasLocationError?: boolean;
  onClick: () => void;
  className?: string;
}

export const LocationButton: React.FC<LocationButtonProps> = ({
  currentLocation,
  isLoading,
  hasLocationError,
  onClick,
  className = ''
}) => {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span>Detecting location...</span>
        </>
      );
    }

    if (hasLocationError) {
      return (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>Choose location</span>
        </>
      );
    }

    if (currentLocation) {
      return (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{currentLocation}</span>
          <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </>
      );
    }

    return (
      <>
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span>Select location</span>
      </>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    if (hasLocationError) {
      return `${baseStyles} bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 border border-red-200`;
    }
    
    if (currentLocation) {
      return `${baseStyles} bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500 border border-blue-200`;
    }
    
    return `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-200`;
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${getButtonStyles()} ${className}`}
      aria-label={currentLocation ? `Change location from ${currentLocation}` : 'Select location'}
    >
      {getButtonContent()}
    </button>
  );
};

export default LocationButton;