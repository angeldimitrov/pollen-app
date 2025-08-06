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
  getTrend?: (dayIndex: number) => any;
  getActivityRecommendation?: (dayIndex?: number) => any;
}

export function Forecast({ 
  forecastData, 
  location, 
  isLoading, 
  onRefresh,
  getTrend,
  getActivityRecommendation
}: ForecastProps): React.JSX.Element {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Forecast</h2>
      <p>Forecast implementation coming soon...</p>
      {location && <p>Location: {location.latitude}, {location.longitude}</p>}
      <p>Forecast days: {forecastData.length}</p>
    </div>
  );
}