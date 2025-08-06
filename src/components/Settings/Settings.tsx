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
        console.log('Settings saved successfully');
      }
    }
  };

  const handleDetectLocation = () => {
    locationHook.detectLocation();
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      
      {/* Sensitivity Settings */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-4">Pollen Sensitivity Levels</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="tree-sensitivity" className="block text-sm font-medium text-gray-700 mb-2">
              Tree Pollen: {sensitivity.sensitivity.tree}/10
            </label>
            <input
              id="tree-sensitivity"
              type="range"
              min="1"
              max="10"
              value={sensitivity.sensitivity.tree}
              onChange={(e) => sensitivity.setTreeSensitivity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label htmlFor="grass-sensitivity" className="block text-sm font-medium text-gray-700 mb-2">
              Grass Pollen: {sensitivity.sensitivity.grass}/10
            </label>
            <input
              id="grass-sensitivity"
              type="range"
              min="1"
              max="10"
              value={sensitivity.sensitivity.grass}
              onChange={(e) => sensitivity.setGrassSensitivity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label htmlFor="weed-sensitivity" className="block text-sm font-medium text-gray-700 mb-2">
              Weed Pollen: {sensitivity.sensitivity.weed}/10
            </label>
            <input
              id="weed-sensitivity"
              type="range"
              min="1"
              max="10"
              value={sensitivity.sensitivity.weed}
              onChange={(e) => sensitivity.setWeedSensitivity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {/* Location Settings */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-4">Location</h3>
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
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locationHook.isLoading ? 'Detecting...' : 'Detect Location'}
            </button>
          </div>
        )}
      </div>
      
      {/* Save Settings */}
      {sensitivity.hasChanges && (
        <div className="bg-white rounded-lg p-4">
          <button
            onClick={handleSave}
            disabled={sensitivity.isSaving}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sensitivity.isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}