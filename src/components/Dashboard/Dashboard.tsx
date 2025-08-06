/**
 * Dashboard Component
 * Main dashboard showing current pollen conditions with personalized risk assessment
 * 
 * Features:
 * - Current overall risk level with color coding
 * - Individual pollen type breakdowns (Tree, Grass, Weed)
 * - Location display with quick change option
 * - Activity recommendations based on current conditions
 * - Loading states and error handling
 * - Pull-to-refresh functionality
 */

import React from 'react';
import { ProcessedPollenData } from '../../types/pollen';
import { Location } from '../../types/user';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { RiskIndicator } from './RiskIndicator';
import { PollenBreakdown } from './PollenBreakdown';
import { LocationCard } from './LocationCard';
import { ActivityCard } from './ActivityCard';

interface DashboardProps {
  pollenData: ProcessedPollenData | null;
  location: Location | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onLocationDetect?: () => void;
}

/**
 * Main dashboard component showing current pollen conditions
 * Optimized for glanceable information on mobile devices
 */
export function Dashboard({ 
  pollenData, 
  location, 
  isLoading = false,
  onRefresh, 
  onLocationDetect 
}: DashboardProps): React.JSX.Element {
  
  /**
   * Render loading state
   */
  if (isLoading && !pollenData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingSpinner 
          size="large" 
          message="Getting your pollen forecast..."
        />
      </div>
    );
  }
  
  /**
   * Render empty state when no data is available
   */
  if (!pollenData && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M7 8h10M7 8l1 10m8-10l-1 10"
                />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No pollen data available
          </h3>
          <p className="text-gray-600 mb-6">
            {location 
              ? "We couldn't get pollen data for your location. Please try again."
              : "Please allow location access or enter your location manually."
            }
          </p>
          
          <div className="space-y-3">
            {onLocationDetect && (
              <button
                onClick={onLocationDetect}
                className="w-full btn-primary"
              >
                Detect Location
              </button>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="w-full btn-secondary"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Location Card */}
      <LocationCard
        location={location}
        onLocationDetect={onLocationDetect}
      />
      
      {/* Main Risk Indicator */}
      <RiskIndicator
        riskLevel={pollenData?.overallRisk || 'low'}
        riskScore={pollenData?.overallScore || 0}
        date={pollenData?.date}
      />
      
      {/* Pollen Type Breakdown */}
      <PollenBreakdown
        pollenTypes={pollenData?.pollenTypes || {
          tree: { index: 0, risk: 'low', score: 0, inSeason: false },
          grass: { index: 0, risk: 'low', score: 0, inSeason: false },
          weed: { index: 0, risk: 'low', score: 0, inSeason: false },
        }}
      />
      
      {/* Activity Recommendations */}
      {pollenData && (
        <ActivityCard
          pollenData={pollenData}
        />
      )}
      
      {/* Health Recommendations */}
      {pollenData?.recommendations && pollenData.recommendations.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">
            Health Tips
          </h3>
          <ul className="space-y-2">
            {pollenData.recommendations.slice(0, 3).map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">{recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Footer spacing for bottom navigation */}
      <div className="pb-4" />
    </div>
  );
}