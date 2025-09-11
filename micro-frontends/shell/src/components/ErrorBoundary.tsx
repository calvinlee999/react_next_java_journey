import React, { Component, ReactNode } from 'react';
import { EventBus } from '../shared/event-bus';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console
    console.error('Micro-frontend error boundary caught an error:', error, errorInfo);

    // Emit error event for monitoring
    EventBus.emit('micro-frontend-error', {
      mfId: 'unknown',
      error: error.message
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    // In a real application, you would send this to your error monitoring service
    // like Sentry, LogRocket, or Azure Application Insights
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Example: Send to monitoring service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });

    console.warn('Error report (would be sent to monitoring service):', errorReport);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    EventBus.emit('notification', {
      type: 'info',
      message: 'Attempting to recover from error...'
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    EventBus.emit('navigate', { route: '/' });
    this.handleRetry();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-64 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg m-4">
          <div className="text-center max-w-md p-6">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Something went wrong
            </h2>
            
            <p className="text-red-700 mb-6">
              A micro-frontend encountered an error and crashed. This is isolated to this component and won't affect other parts of the application.
            </p>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 bg-red-100 p-4 rounded border">
                <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-sm text-red-700 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs bg-red-200 p-2 rounded overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs bg-red-200 p-2 rounded overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Recovery actions */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Go Home
                </button>
              </div>
              
              <button
                onClick={this.handleReload}
                className="text-sm text-red-600 hover:text-red-800 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              >
                Reload Page
              </button>
            </div>

            {/* Help text */}
            <p className="text-sm text-gray-600 mt-6">
              If this problem persists, please contact support or check the system status page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage with hooks
export function ErrorBoundaryWrapper({ 
  children, 
  fallback,
  onError 
}: ErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
