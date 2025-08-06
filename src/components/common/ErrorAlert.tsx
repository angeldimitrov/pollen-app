/**
 * Error Alert Component
 * User-friendly error display with retry functionality
 * 
 * Features:
 * - Dismissible error messages
 * - Retry action for recoverable errors
 * - Auto-dismiss for non-critical errors
 * - Accessible with ARIA labels
 * - Mobile-optimized design
 */

import React, { useEffect, useState } from 'react';

/**
 * Error alert component props
 */
interface ErrorAlertProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  onRetry?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number; // in milliseconds
}

/**
 * Icon components for different alert types
 */
const ErrorIcon: React.FC = () => (
  <svg
    className="w-5 h-5 text-red-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg
    className="w-5 h-5 text-yellow-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg
    className="w-5 h-5 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const RetryIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

/**
 * Error alert component with mobile-optimized design and accessibility
 */
export function ErrorAlert({
  message,
  type = 'error',
  onDismiss,
  onRetry,
  autoDismiss = false,
  autoDismissDelay = 5000,
}: ErrorAlertProps): React.JSX.Element {
  
  const [isVisible, setIsVisible] = useState(true);
  
  /**
   * Auto-dismiss functionality
   */
  useEffect(() => {
    if (autoDismiss && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onDismiss?.();
        }, 300); // Wait for fade out animation
      }, autoDismissDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, onDismiss]);
  
  /**
   * Handle dismiss action
   */
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300); // Wait for fade out animation
  };
  
  /**
   * Handle retry action
   */
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      // Don't auto-dismiss on retry - let parent handle success/failure
    }
  };
  
  /**
   * Get styling classes based on alert type
   */
  const getAlertStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: WarningIcon,
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: InfoIcon,
        };
      default:
        return {
          container: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: ErrorIcon,
        };
    }
  };
  
  const styles = getAlertStyles();
  const IconComponent = styles.icon;
  
  if (!isVisible) {
    return <div />; // Return empty div for layout stability during fade out
  }
  
  return (
    <div
      className={`
        ${styles.container}
        border rounded-lg p-4 shadow-sm
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent />
        </div>
        
        {/* Message content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text}`}>
            {message}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Retry button */}
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className={`
                inline-flex items-center
                px-2 py-1
                text-xs font-medium
                ${styles.text}
                bg-transparent hover:bg-black hover:bg-opacity-5
                rounded-md
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                min-h-touch
              `}
              aria-label="Retry failed operation"
            >
              <RetryIcon />
              <span className="ml-1">Retry</span>
            </button>
          )}
          
          {/* Dismiss button */}
          {onDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className={`
                inline-flex items-center justify-center
                p-1
                ${styles.text}
                bg-transparent hover:bg-black hover:bg-opacity-5
                rounded-md
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                min-h-touch min-w-touch
              `}
              aria-label="Dismiss alert"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}