/**
 * Status Bar Component
 * Top status bar showing app status, last updated time, and refresh functionality
 * 
 * Features:
 * - Last updated timestamp with relative time
 * - Pull-to-refresh indicator
 * - Manual refresh button
 * - Connection status (future enhancement)
 * - Compact design optimized for mobile
 */

import React from 'react';
import { formatLastUpdated } from '../../utils/formatters';

/**
 * Status bar component props
 */
interface StatusBarProps {
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  showTitle?: boolean;
}

/**
 * Refresh icon component with animation support
 */
const RefreshIcon: React.FC<{ isSpinning?: boolean }> = ({ isSpinning = false }) => (
  <svg
    className={`w-5 h-5 text-gray-600 ${isSpinning ? 'animate-spin' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

/**
 * App logo/icon component
 */
const AppIcon: React.FC = () => (
  <div className="flex items-center">
    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
      <svg
        className="w-5 h-5 text-white drop-shadow-sm"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
      </svg>
    </div>
  </div>
);

/**
 * Status bar component providing app header with refresh functionality
 * Designed to be sticky at the top of the viewport
 */
export function StatusBar({
  lastUpdated,
  isRefreshing = false,
  onRefresh,
  showTitle = true,
}: StatusBarProps): React.JSX.Element {
  
  /**
   * Handles refresh button click
   */
  const handleRefreshClick = () => {
    if (!isRefreshing && onRefresh) {
      onRefresh();
    }
  };
  
  /**
   * Gets status text based on current state
   */
  const getStatusText = () => {
    if (isRefreshing) {
      return 'Updating...';
    }
    
    if (lastUpdated) {
      return `Updated ${formatLastUpdated(lastUpdated)}`;
    }
    
    return 'Tap to refresh';
  };
  
  return (
    <header className="bg-white/95 backdrop-blur-md px-4 py-3 safe-top border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - App branding */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <AppIcon />
          {showTitle && (
            <div className="min-w-0 flex-shrink-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                Pollen Tracker
              </h1>
            </div>
          )}
        </div>
        
        {/* Right side - Status and refresh */}
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
          {/* Status text */}
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {getStatusText()}
            </p>
          </div>
          
          {/* Refresh button */}
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className={`
                inline-flex items-center justify-center
                min-h-touch min-w-touch
                p-2 rounded-xl
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                no-select
                ${
                  isRefreshing
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95'
                }
              `}
              aria-label={isRefreshing ? 'Updating pollen data' : 'Refresh pollen data'}
            >
              <RefreshIcon isSpinning={isRefreshing} />
            </button>
          )}
        </div>
      </div>
      
      {/* Progress indicator for refresh */}
      {isRefreshing && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </header>
  );
}