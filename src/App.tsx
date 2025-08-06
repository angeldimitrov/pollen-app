/**
 * Main App Component
 * Root component for the Pollen Tracker PWA
 * 
 * Manages overall app state and routing between Dashboard, Forecast, and Settings views
 * Implements mobile-first navigation with tab-based interface
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from './components/common/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Forecast } from './components/Forecast/Forecast';
import { Settings } from './components/Settings/Settings';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useLocation } from './hooks/useLocation';
import { usePollenData } from './hooks/usePollenData';
import { useSensitivity } from './hooks/useSensitivity';
import { Location, LocationError, SensitivityProfile } from './types/user';
import { PollenError } from './types/pollen';

/**
 * App navigation views
 */
type AppView = 'dashboard' | 'forecast' | 'settings';

/**
 * Main application component
 * Coordinates data flow between location, pollen data, and user sensitivity
 */
function App(): React.JSX.Element {
  // Navigation state
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  
  // App-level error state
  const [appError, setAppError] = useState<string | null>(null);
  
  // Refs to store hook instances for stable callbacks
  const pollenHookRef = useRef<ReturnType<typeof usePollenData> | null>(null);
  const sensitivityRef = useRef<ReturnType<typeof useSensitivity> | null>(null);
  
  // Stable callbacks to prevent infinite loops
  const onLocationChange = useCallback((location: Location) => {
    console.log('📍 Location changed:', location);
    // Refresh pollen data when location changes significantly
    if (pollenHookRef.current?.needsRefresh(location)) {
      pollenHookRef.current?.fetchData(location, sensitivityRef.current?.sensitivity || {
        tree: 5,
        grass: 5, 
        weed: 5
      });
    }
  }, []);
  
  const onLocationError = useCallback((error: LocationError) => {
    console.error('Location error:', error);
    // Don't show location errors as app-level errors - let components handle them
  }, []);
  
  const onSensitivityChange = useCallback((newSensitivity: SensitivityProfile) => {
    console.log('⚙️ Sensitivity changed:', newSensitivity);
    // Recalculate pollen data when sensitivity changes
    const location = pollenHookRef.current?.location;
    if (location) {
      pollenHookRef.current?.fetchData(location, newSensitivity);
    }
  }, []);
  
  const onPollenError = useCallback((error: PollenError) => {
    console.error('Pollen data error:', error);
    // Show pollen errors as app-level errors since they're critical
    setAppError(error.message);
  }, []);
  
  // Custom hooks for data management with stable callbacks
  const locationHook = useLocation({
    autoDetect: true,
    onLocationChange,
    onError: onLocationError,
  });
  
  const sensitivity = useSensitivity({
    autoSave: true,
    onSensitivityChange,
  });
  
  const pollenHook = usePollenData({
    onError: onPollenError,
  });
  
  // Update refs with current hook instances
  pollenHookRef.current = pollenHook;
  sensitivityRef.current = sensitivity;
  
  /**
   * Initial data fetch when location and sensitivity are available
   * CRITICAL: Only runs if no data fetch is already in progress/completed
   */
  useEffect(() => {
    console.log('🎯 App.tsx useEffect triggered:', {
      hasLocation: !!locationHook.location,
      sensitivityLoading: sensitivity.isLoading,
      hasPollenData: !!pollenHook.current,
      isLoadingOrRefreshing: pollenHook.isLoading || pollenHook.isRefreshing,
      location: locationHook.location ? `${locationHook.location.latitude}, ${locationHook.location.longitude}` : 'none'
    });
    
    // Only fetch if we have location, sensitivity is loaded, no data exists, and no fetch is in progress
    if (locationHook.location && 
        !sensitivity.isLoading && 
        !pollenHook.current && 
        !pollenHook.isLoading && 
        !pollenHook.isRefreshing) {
      console.log('🚀 Triggering initial data fetch from App.tsx');
      pollenHook.fetchData(locationHook.location, sensitivity.sensitivity);
    }
  }, [locationHook.location, sensitivity.isLoading, sensitivity.sensitivity]);
  
  /**
   * Navigation handler
   */
  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    // Clear app-level errors when navigating
    setAppError(null);
  };
  
  /**
   * Error clearing handler
   */
  const clearAppError = () => {
    setAppError(null);
    pollenHook.clearError();
  };
  
  /**
   * Retry handler for failed operations
   */
  const handleRetry = async () => {
    clearAppError();
    
    if (locationHook.location) {
      await pollenHook.fetchData(locationHook.location, sensitivity.sensitivity);
    } else if (locationHook.settings.useAutoDetection) {
      await locationHook.detectLocation();
    }
  };
  
  /**
   * Render current view based on navigation state
   */
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            pollenData={pollenHook.current}
            location={locationHook.location}
            isLoading={pollenHook.isLoading || locationHook.isLoading}
            onRefresh={pollenHook.refreshData}
            onLocationDetect={locationHook.detectLocation}
          />
        );
        
      case 'forecast':
        return (
          <Forecast
            forecastData={pollenHook.forecast}
            location={locationHook.location}
            isLoading={pollenHook.isLoading}
            onRefresh={pollenHook.refreshData}
            getTrend={pollenHook.getTrend}
            getActivityRecommendation={pollenHook.getActivityRecommendation}
          />
        );
        
      case 'settings':
        return (
          <Settings
            sensitivity={sensitivity}
            locationHook={locationHook}
            onSave={sensitivity.saveChanges}
          />
        );
        
      default:
        return <Dashboard pollenData={null} location={null} isLoading={false} />;
    }
  };
  
  // Show loading screen during initial app setup
  if (sensitivity.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" message="Setting up your pollen tracker..." />
      </div>
    );
  }
  
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('App-level error:', error);
        setAppError('An unexpected error occurred. Please refresh the app.');
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <Layout
          currentView={currentView}
          onViewChange={handleViewChange}
          hasError={!!appError}
          errorMessage={appError}
          onErrorClear={clearAppError}
          onRetry={handleRetry}
          lastUpdated={pollenHook.lastUpdated}
          isRefreshing={pollenHook.isRefreshing}
        >
          {renderCurrentView()}
        </Layout>
      </div>
    </ErrorBoundary>
  );
}

export default App;
