/**
 * Activity Card Component
 * Shows activity recommendations based on current pollen levels
 */

import React from 'react';
import { ProcessedPollenData } from '../../types/pollen';

interface ActivityRecommendation {
  recommendation: 'ideal' | 'caution' | 'avoid';
  reason: string;
  bestTime?: string;
}

interface ActivityCardProps {
  recommendation?: ActivityRecommendation | null;
  pollenData?: ProcessedPollenData;
  isLoading?: boolean;
}

const RECOMMENDATION_STYLES = {
  ideal: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: '✅',
    iconColor: 'text-green-600',
    title: 'Great for Outdoor Activities',
    titleColor: 'text-green-800',
  },
  caution: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200', 
    icon: '⚠️',
    iconColor: 'text-yellow-600',
    title: 'Exercise Caution',
    titleColor: 'text-yellow-800',
  },
  avoid: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '🚫',
    iconColor: 'text-red-600',
    title: 'Avoid Outdoor Activities',
    titleColor: 'text-red-800',
  },
};

function generateRecommendationFromData(pollenData: ProcessedPollenData): ActivityRecommendation {
  const riskLevel = pollenData.overallRisk || 'low';
  
  switch (riskLevel) {
    case 'low':
      return {
        recommendation: 'ideal',
        reason: 'Low pollen levels make this perfect for outdoor activities.',
        bestTime: 'All day',
      };
    case 'moderate':
      return {
        recommendation: 'caution',
        reason: 'Moderate pollen levels. Consider taking precautions.',
        bestTime: 'Early morning or evening',
      };
    case 'high':
      return {
        recommendation: 'caution',
        reason: 'High pollen levels. Limit outdoor exposure and take medication.',
        bestTime: 'Early morning before 10 AM',
      };
    case 'very-high':
      return {
        recommendation: 'avoid',
        reason: 'Very high pollen levels. Stay indoors if possible.',
        bestTime: 'Indoor activities recommended',
      };
    default:
      return {
        recommendation: 'caution',
        reason: 'Unable to determine pollen levels. Exercise caution.',
      };
  }
}

export function ActivityCard({ recommendation, pollenData, isLoading = false }: ActivityCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Generate recommendation from pollenData if not provided
  const finalRecommendation = recommendation || (pollenData ? generateRecommendationFromData(pollenData) : null);
  
  if (!finalRecommendation) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Recommendations</h2>
        <div className="text-center py-4 text-gray-500">
          <div className="text-4xl mb-2">⏳</div>
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  const style = RECOMMENDATION_STYLES[finalRecommendation.recommendation];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Recommendations</h2>
      
      <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{style.icon}</span>
          <div className="flex-1">
            <h3 className={`font-medium ${style.titleColor} mb-2`}>
              {style.title}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              {finalRecommendation.reason}
            </p>
            {finalRecommendation.bestTime && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">🕐</span>
                <span className="text-gray-700">
                  Best time: {finalRecommendation.bestTime}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional tips based on recommendation level */}
      <div className="mt-4 text-sm text-gray-600">
        {finalRecommendation.recommendation === 'ideal' && (
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">💡</span>
            <p>Perfect conditions for outdoor exercise, gardening, or spending time outside.</p>
          </div>
        )}
        {finalRecommendation.recommendation === 'caution' && (
          <div className="flex items-start space-x-2">
            <span className="text-yellow-500 mt-1">💡</span>
            <p>Consider taking allergy medication before going outside and limit exposure time.</p>
          </div>
        )}
        {finalRecommendation.recommendation === 'avoid' && (
          <div className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">💡</span>
            <p>Stay indoors with windows closed and air conditioning on. Consider indoor activities.</p>
          </div>
        )}
      </div>
    </div>
  );
}