/**
 * Main App Component
 * Root component for the Pollen Tracker PWA
 * 
 * Manages overall app state and routing between Dashboard, Forecast, and Settings views
 * Implements mobile-first navigation with tab-based interface
 */

import React, { useState, useEffect } from 'react';
import { Layout } from './components/common/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Forecast } from './components/Forecast/Forecast';
import { Settings } from './components/Settings/Settings';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useLocation } from './hooks/useLocation';
import { usePollenData } from './hooks/usePollenData';
import { useSensitivity } from './hooks/useSensitivity';

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
  
  // Custom hooks for data management
  const locationHook = useLocation({
    autoDetect: true,
    onLocationChange: (location) => {
      // Refresh pollen data when location changes significantly
      if (pollenHook.needsRefresh(location)) {
        pollenHook.fetchData(location, sensitivity.sensitivity);
      }
    },
    onError: (error) => {
      console.error('Location error:', error);
      // Don't show location errors as app-level errors - let components handle them
    },
  });
  
  const sensitivity = useSensitivity({
    autoSave: true,
    onSensitivityChange: (newSensitivity) => {
      // Recalculate pollen data when sensitivity changes
      if (locationHook.location) {
        pollenHook.fetchData(locationHook.location, newSensitivity);
      }
    },
  });
  
  const pollenHook = usePollenData({
    onError: (error) => {
      console.error('Pollen data error:', error);
      // Show pollen errors as app-level errors since they're critical
      setAppError(error.message);
    },
  });
  
  /**
   * Initial data fetch when location and sensitivity are available
   */
  useEffect(() => {
    if (locationHook.location && !sensitivity.isLoading && !pollenHook.current) {
      pollenHook.fetchData(locationHook.location, sensitivity.sensitivity);
    }
  }, [locationHook.location, sensitivity.isLoading, sensitivity.sensitivity, pollenHook]);
  
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
