/**
 * Risk Indicator Component
 * Displays the overall pollen risk level with color-coded visual indicator
 */

import React from 'react';
import { RiskLevel } from '../../types/pollen';

interface RiskIndicatorProps {
  riskLevel: RiskLevel;
  riskScore: number;
  date?: Date;
  isLoading?: boolean;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  'low': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'moderate': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'high': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'very-high': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  'low': 'Low',
  'moderate': 'Moderate', 
  'high': 'High',
  'very-high': 'Very High',
};

export function RiskIndicator({ riskLevel, riskScore, isLoading = false }: RiskIndicatorProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const colors = RISK_COLORS[riskLevel];
  const label = RISK_LABELS[riskLevel];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Risk Level</h2>
      
      <div className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 text-center`}>
        <div className={`${colors.text} text-3xl font-bold mb-2`}>
          {label}
        </div>
        <div className={`${colors.text} text-lg`}>
          Score: {riskScore.toFixed(1)}/10
        </div>
      </div>
      
      {/* Risk scale indicator */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
          <span>Very High</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="flex-1 bg-green-400"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-orange-400"></div>
            <div className="flex-1 bg-red-400"></div>
          </div>
        </div>
        {/* Score indicator */}
        <div className="relative">
          <div 
            className="absolute w-2 h-2 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(riskScore / 10) * 100}%`, top: '-6px' }}
          ></div>
        </div>
      </div>
    </div>
  );
}