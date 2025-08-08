/**
 * Settings Component (Placeholder)
 * User settings and sensitivity configuration
 */

import React from 'react';
import { UseSensitivityReturn } from '../../hooks/useSensitivity';
import { UseLocationReturn } from '../../hooks/useLocation';

interface SettingsProps {
  sensitivity: UseSensitivityReturn;
  locationHook: UseLocationReturn;
  onSave?: () => Promise<boolean>;
}

export function Settings({ 
  sensitivity, 
  locationHook, 
  onSave 
}: SettingsProps): React.JSX.Element {
  
  const handleSave = async () => {
    if (onSave) {
      const success = await onSave();
      if (success) {
        // Could show a success message here
      }
    }
  };

  const handleDetectLocation = () => {
    locationHook.detectLocation();
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Settings</h2>
      
      {/* Sensitivity Settings */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 ring-1 ring-black/5 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Pollen Sensitivity Levels</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="tree-sensitivity" className="block text-sm font-semibold text-gray-700 mb-3">
              Tree Pollen: {sensitivity.sensitivity.tree}/10
            </label>
            <div className="slider-container relative">
              <input
                id="tree-sensitivity"
                type="range"
                min="1"
                max="10"
                value={sensitivity.sensitivity.tree}
                onChange={(e) => sensitivity.setTreeSensitivity(parseInt(e.target.value))}
                className="slider-premium"
                aria-label="Tree pollen sensitivity level"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(34, 197, 94) 0%, 
                    rgb(22, 163, 74) ${(sensitivity.sensitivity.tree / 10) * 100}%, 
                    #f3f4f6 ${(sensitivity.sensitivity.tree / 10) * 100}%, 
                    #e5e7eb 100%)`
                }}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="grass-sensitivity" className="block text-sm font-semibold text-gray-700 mb-3">
              Grass Pollen: {sensitivity.sensitivity.grass}/10
            </label>
            <div className="slider-container relative">
              <input
                id="grass-sensitivity"
                type="range"
                min="1"
                max="10"
                value={sensitivity.sensitivity.grass}
                onChange={(e) => sensitivity.setGrassSensitivity(parseInt(e.target.value))}
                className="slider-premium"
                aria-label="Grass pollen sensitivity level"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(234, 179, 8) 0%, 
                    rgb(245, 158, 11) ${(sensitivity.sensitivity.grass / 10) * 100}%, 
                    #f3f4f6 ${(sensitivity.sensitivity.grass / 10) * 100}%, 
                    #e5e7eb 100%)`
                }}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="weed-sensitivity" className="block text-sm font-semibold text-gray-700 mb-3">
              Weed Pollen: {sensitivity.sensitivity.weed}/10
            </label>
            <div className="slider-container relative">
              <input
                id="weed-sensitivity"
                type="range"
                min="1"
                max="10"
                value={sensitivity.sensitivity.weed}
                onChange={(e) => sensitivity.setWeedSensitivity(parseInt(e.target.value))}
                className="slider-premium"
                aria-label="Weed pollen sensitivity level"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(249, 115, 22) 0%, 
                    rgb(239, 68, 68) ${(sensitivity.sensitivity.weed / 10) * 100}%, 
                    #f3f4f6 ${(sensitivity.sensitivity.weed / 10) * 100}%, 
                    #e5e7eb 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Settings */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 ring-1 ring-black/5 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
        {locationHook.location ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Current: {locationHook.location.city || 'Unknown city'}
            </p>
            <p className="text-xs text-gray-500">
              {locationHook.location.latitude.toFixed(4)}, {locationHook.location.longitude.toFixed(4)}
            </p>
            <button
              onClick={handleDetectLocation}
              disabled={locationHook.isLoading}
              className="w-full mt-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locationHook.isLoading ? 'Detecting...' : 'Update Location'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">No location detected</p>
            <button
              onClick={handleDetectLocation}
              disabled={locationHook.isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locationHook.isLoading ? 'Detecting...' : 'Detect Location'}
            </button>
          </div>
        )}
      </div>
      
      {/* Save Settings */}
      {sensitivity.hasChanges && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 ring-1 ring-black/5">
          <button
            onClick={handleSave}
            disabled={sensitivity.isSaving}
            className="w-full btn-primary"
          >
            {sensitivity.isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}