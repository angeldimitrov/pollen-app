/**
 * Layout Component
 * Main layout wrapper with mobile-first navigation and error handling
 * 
 * Provides:
 * - Bottom tab navigation optimized for mobile
 * - Safe area handling for notched devices
 * - Global error display and retry functionality
 * - Pull-to-refresh indication
 * - Status bar with last updated timestamp
 */

import React from 'react';
import { Navigation } from './Navigation';
import { StatusBar } from './StatusBar';
import { ErrorAlert } from './ErrorAlert';

/**
 * Layout component props
 */
interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'forecast' | 'settings';
  onViewChange: (view: 'dashboard' | 'forecast' | 'settings') => void;
  hasError?: boolean;
  errorMessage?: string | null;
  onErrorClear?: () => void;
  onRetry?: () => void;
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
}

/**
 * Main layout component with mobile-optimized structure
 * Uses CSS Grid for optimal performance and layout stability
 */
export function Layout({
  children,
  currentView,
  onViewChange,
  hasError = false,
  errorMessage,
  onErrorClear,
  onRetry,
  lastUpdated,
  isRefreshing = false,
}: LayoutProps): React.JSX.Element {
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 flex flex-col safe-top safe-bottom">
      {/* Status bar - fixed at top */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <StatusBar
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={onRetry}
        />
      </div>
      
      {/* Error alert - shown above content when active */}
      {hasError && errorMessage && (
        <div className="sticky top-16 z-20 mx-4 mt-2">
          <ErrorAlert
            message={errorMessage}
            onDismiss={onErrorClear}
            onRetry={onRetry}
          />
        </div>
      )}
      
      {/* Main content area - scrollable with momentum */}
      <main className="flex-1 overflow-auto momentum-scroll">
        <div className="min-h-full">
          {children}
        </div>
      </main>
      
      {/* Bottom navigation - fixed at bottom with safe area */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200">
        <Navigation
          currentView={currentView}
          onViewChange={onViewChange}
        />
      </div>
    </div>
  );
}