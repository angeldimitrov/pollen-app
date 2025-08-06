/**
 * Pollen Breakdown Component
 * Shows detailed breakdown of different pollen types and their individual risk levels
 */

import React from 'react';
import { ProcessedPollenData } from '../../types/pollen';

interface PollenBreakdownProps {
  data?: ProcessedPollenData;
  pollenTypes?: ProcessedPollenData['pollenTypes'];
  isLoading?: boolean;
}

const POLLEN_ICONS = {
  tree: '🌳',
  grass: '🌾', 
  weed: '🌿',
};

export function PollenBreakdown({ data, pollenTypes, isLoading = false }: PollenBreakdownProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pollenTypesToShow = data?.pollenTypes || pollenTypes || {
    tree: { index: 0, risk: 'low', score: 0, inSeason: false },
    grass: { index: 0, risk: 'low', score: 0, inSeason: false },
    weed: { index: 0, risk: 'low', score: 0, inSeason: false },
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pollen Breakdown</h2>
      
      <div className="space-y-4">
        {Object.entries(pollenTypesToShow).map(([type, typeData]) => (
          <div key={type} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{POLLEN_ICONS[type as keyof typeof POLLEN_ICONS]}</span>
              <div>
                <div className="font-medium text-gray-900 capitalize">
                  {type} Pollen
                </div>
                <div className="text-sm text-gray-500">
                  Raw: {typeData.index}/5 • Personal: {typeData.score.toFixed(1)}/10
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${typeData.risk === 'low' ? 'bg-green-100 text-green-800' :
                  typeData.risk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  typeData.risk === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {typeData.risk.charAt(0).toUpperCase() + typeData.risk.slice(1).replace('-', ' ')}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Health recommendations */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Health Recommendations</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {data.recommendations.slice(0, 3).map((rec: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}