/**
 * Navigation Component
 * Bottom tab navigation optimized for mobile interaction
 * 
 * Features:
 * - Touch-friendly tab sizes (minimum 44x44px)
 * - Visual indicators for active state
 * - Accessible with ARIA labels and keyboard support
 * - Smooth transitions and haptic feedback preparation
 */

import React from 'react';

/**
 * Navigation tab data
 */
interface NavTab {
  id: 'dashboard' | 'forecast' | 'settings';
  label: string;
  icon: React.ComponentType<{ isActive: boolean }>;
  ariaLabel: string;
}

/**
 * Navigation component props
 */
interface NavigationProps {
  currentView: 'dashboard' | 'forecast' | 'settings';
  onViewChange: (view: 'dashboard' | 'forecast' | 'settings') => void;
}

/**
 * Icon components for navigation tabs
 * Using simple SVG icons for optimal performance
 */
const DashboardIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg
    className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const ForecastIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg
    className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const SettingsIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg
    className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

/**
 * Navigation tabs configuration
 */
const NAV_TABS: NavTab[] = [
  {
    id: 'dashboard',
    label: 'Today',
    icon: DashboardIcon,
    ariaLabel: 'Current pollen conditions',
  },
  {
    id: 'forecast',
    label: 'Forecast',
    icon: ForecastIcon,
    ariaLabel: '3-day pollen forecast',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    ariaLabel: 'App settings and sensitivity',
  },
];

/**
 * Bottom navigation component with mobile-optimized design
 * Implements tab pattern with visual active states and accessibility support
 */
export function Navigation({ currentView, onViewChange }: NavigationProps): React.JSX.Element {
  
  /**
   * Handles tab selection with optional haptic feedback
   */
  const handleTabPress = (tabId: 'dashboard' | 'forecast' | 'settings') => {
    if (tabId === currentView) return; // No action if already active
    
    // Trigger haptic feedback if available (iOS Safari)
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Light tap
    }
    
    onViewChange(tabId);
  };
  
  /**
   * Keyboard event handler for accessibility
   */
  const handleKeyPress = (
    event: React.KeyboardEvent,
    tabId: 'dashboard' | 'forecast' | 'settings'
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabPress(tabId);
    }
  };
  
  return (
    <nav
      className="bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom shadow-lg"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center">
        {NAV_TABS.map((tab) => {
          const isActive = tab.id === currentView;
          const IconComponent = tab.icon;
          
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.ariaLabel}
              tabIndex={0}
              className={`
                flex flex-col items-center justify-center
                min-h-touch min-w-touch
                px-3 py-2 mx-1 rounded-2xl
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                no-select
                ${isActive 
                  ? 'text-blue-600 bg-blue-50 shadow-sm scale-105' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 hover:scale-105 active:scale-95'
                }
              `}
              onClick={() => handleTabPress(tab.id)}
              onKeyPress={(e) => handleKeyPress(e, tab.id)}
            >
              {/* Icon */}
              <div className="mb-1">
                <IconComponent isActive={isActive} />
              </div>
              
              {/* Label */}
              <span
                className={`
                  text-xs font-semibold tracking-tight
                  ${isActive ? 'text-blue-600' : 'text-gray-500'}
                `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}