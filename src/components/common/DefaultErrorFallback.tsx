/**
 * Default Error Fallback UI Component
 * Displays user-friendly error message with retry options
 */

import React from 'react';

interface DefaultErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

export const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md mx-auto text-center">
      {/* Error icon */}
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
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
        </div>
      </div>
      
      {/* Error message */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600">
          We encountered an unexpected error. Please try refreshing the app.
        </p>
        
        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Error details (development only)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="
            w-full
            bg-blue-600 hover:bg-blue-700
            text-white font-medium
            px-6 py-3 rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          Try again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="
            w-full
            bg-gray-100 hover:bg-gray-200
            text-gray-700 font-medium
            px-6 py-3 rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          "
        >
          Refresh app
        </button>
      </div>
    </div>
  </div>
);