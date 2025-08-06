/**
 * Forecast Component (Placeholder)
 * 3-day pollen forecast view
 */

import React from 'react';
import { ProcessedPollenData } from '../../types/pollen';
import { Location } from '../../types/user';

interface ForecastProps {
  forecastData: ProcessedPollenData[];
  location: Location | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  getTrend?: (dayIndex: number) => { direction: 'improving' | 'worsening' | 'stable'; magnitude: 'slight' | 'moderate' | 'significant'; scoreDifference: number; } | null;
  getActivityRecommendation?: (dayIndex?: number) => { recommendation: 'ideal' | 'caution' | 'avoid'; reason: string; bestTime?: string; } | null;
}

export function Forecast({ 
  forecastData, 
  location, 
  isLoading, 
  onRefresh,
  getTrend,
  getActivityRecommendation
}: ForecastProps): React.JSX.Element {
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <h2 className="text-xl font-semibold mb-4">3-Day Forecast</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">3-Day Forecast</h2>
        <button 
          onClick={handleRefresh}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
          aria-label="Refresh forecast"
        >
          🔄
        </button>
      </div>
      
      {location && (
        <p className="text-sm text-gray-600 mb-4">
          Forecast for {location.city || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
        </p>
      )}
      
      {forecastData.length > 0 ? (
        <div className="space-y-4">
          {forecastData.map((day, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Day {index + 1}</h3>
                  <p className="text-sm text-gray-600">Overall Risk: {day.overallRisk}</p>
                </div>
                <div className="text-right">
                  {getTrend && (
                    (() => {
                      const trend = getTrend(index);
                      return trend ? (
                        <p className="text-sm text-gray-600">
                          Trend: {trend.direction} ({trend.magnitude})
                        </p>
                      ) : null;
                    })()
                  )}
                  {getActivityRecommendation && (
                    (() => {
                      const rec = getActivityRecommendation(index);
                      return rec ? (
                        <p className="text-xs text-gray-500 mt-1">{rec.recommendation}: {rec.reason}</p>
                      ) : null;
                    })()
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No forecast data available</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-blue-600 hover:underline"
          >
            Try refreshing
          </button>
        </div>
      )}
    </div>
  );
}