/**
 * Loading Spinner Component
 * Accessible loading indicator with customizable size and message
 * 
 * Features:
 * - Multiple sizes (small, medium, large)
 * - Optional loading message
 * - Accessible with ARIA labels
 * - Smooth animations optimized for mobile
 * - Customizable colors
 */

import React from 'react';

/**
 * Loading spinner component props
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  message?: string;
  className?: string;
}

/**
 * Size configuration for different spinner variants
 */
const SPINNER_SIZES = {
  small: {
    spinner: 'w-4 h-4',
    container: 'p-2',
    text: 'text-xs',
  },
  medium: {
    spinner: 'w-8 h-8',
    container: 'p-4',
    text: 'text-sm',
  },
  large: {
    spinner: 'w-12 h-12',
    container: 'p-8',
    text: 'text-base',
  },
} as const;

/**
 * Color configuration for different themes
 */
const SPINNER_COLORS = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
} as const;

/**
 * Animated spinner SVG component
 * Uses CSS animations for smooth performance
 */
const SpinnerIcon: React.FC<{ size: string; color: string }> = ({ size, color }) => (
  <svg
    className={`${size} ${color} animate-spin`}
    fill="none"
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Pulsing dots alternative animation for variety
 */
const PulsingDots: React.FC<{ color: string }> = ({ color }) => (
  <div className="flex space-x-1" role="img" aria-hidden="true">
    <div className={`w-2 h-2 ${color.replace('text-', 'bg-')} rounded-full animate-pulse`} style={{ animationDelay: '0ms' }} />
    <div className={`w-2 h-2 ${color.replace('text-', 'bg-')} rounded-full animate-pulse`} style={{ animationDelay: '150ms' }} />
    <div className={`w-2 h-2 ${color.replace('text-', 'bg-')} rounded-full animate-pulse`} style={{ animationDelay: '300ms' }} />
  </div>
);

/**
 * Loading spinner component with customizable appearance and accessibility
 */
export function LoadingSpinner({
  size = 'medium',
  color = 'primary',
  message,
  className = '',
}: LoadingSpinnerProps): React.JSX.Element {
  
  const sizeConfig = SPINNER_SIZES[size];
  const colorClass = SPINNER_COLORS[color];
  
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${sizeConfig.container}
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={message ? `Loading: ${message}` : 'Loading'}
    >
      {/* Main spinner */}
      <SpinnerIcon size={sizeConfig.spinner} color={colorClass} />
      
      {/* Loading message */}
      {message && (
        <div className="mt-3 text-center">
          <p className={`${sizeConfig.text} text-gray-600 font-medium`}>
            {message}
          </p>
          
          {/* Secondary pulsing dots for visual interest */}
          <div className="mt-2 flex justify-center">
            <PulsingDots color={colorClass} />
          </div>
        </div>
      )}
      
      {/* Screen reader text */}
      <span className="sr-only">
        {message || 'Loading, please wait...'}
      </span>
    </div>
  );
}

/**
 * Inline spinner for use within buttons or small spaces
 */
export function InlineSpinner({
  size = 'small',
  color = 'primary',
  className = '',
}: Pick<LoadingSpinnerProps, 'size' | 'color' | 'className'>): React.JSX.Element {
  
  const sizeConfig = SPINNER_SIZES[size];
  const colorClass = SPINNER_COLORS[color];
  
  return (
    <SpinnerIcon
      size={sizeConfig.spinner}
      color={colorClass}
    />
  );
}

/**
 * Full screen loading overlay for critical loading states
 */
export function LoadingOverlay({
  message = 'Loading...',
  isVisible = true,
}: {
  message?: string;
  isVisible?: boolean;
}): React.JSX.Element {
  
  if (!isVisible) {
    return <></>;
  }
  
  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center"
      role="status"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-4">
        <LoadingSpinner
          size="large"
          message={message}
          className="text-center"
        />
      </div>
    </div>
  );
}