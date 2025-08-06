/**
 * Error Boundary Component
 * React error boundary for catching and handling component errors
 * 
 * Features:
 * - Catches JavaScript errors in component tree
 * - Shows user-friendly error UI instead of white screen
 * - Provides retry mechanism
 * - Logs errors for debugging
 * - Maintains app stability during unexpected errors
 */

import React, { Component, ReactNode } from 'react';
import { DefaultErrorFallback } from './DefaultErrorFallback';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: ReactNode;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * React Error Boundary class component
 * Catches errors during render, lifecycle methods, and constructors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  
  /**
   * Static method called when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }
  
  /**
   * Lifecycle method called after an error is caught
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });
    
    // Call error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  /**
   * Reset error state to retry rendering
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  /**
   * Render method with error handling
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Show default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    
    // No error, render children normally
    return this.props.children;
  }
}

/**
 * Higher-order component version of ErrorBoundary for easier use
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for triggering error boundary from function components
 */
export function useErrorHandler() {
  return (error: Error) => {
    // Throw error to be caught by nearest error boundary
    throw error;
  };
}