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
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <p>Settings implementation coming soon...</p>
      <p>Tree sensitivity: {sensitivity.sensitivity.tree}</p>
      <p>Grass sensitivity: {sensitivity.sensitivity.grass}</p>
      <p>Weed sensitivity: {sensitivity.sensitivity.weed}</p>
      {locationHook.location && (
        <p>Current location: {locationHook.location.latitude}, {locationHook.location.longitude}</p>
      )}
    </div>
  );
}