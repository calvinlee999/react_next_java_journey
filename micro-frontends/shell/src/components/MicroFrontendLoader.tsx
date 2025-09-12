import React from 'react';

interface MicroFrontendLoaderProps {
  mfName: string;
  message?: string;
}

export function MicroFrontendLoader({ mfName, message }: MicroFrontendLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        {/* Loading animation */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Loading {mfName}
        </h3>
        
        <p className="text-gray-600 max-w-md">
          {message || `Initializing the ${mfName} micro-frontend...`}
        </p>
        
        {/* Progress indicators */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            Downloading and initializing components...
          </div>
        </div>
      </div>
    </div>
  );
}

// Alternative skeleton loader for specific micro-frontend types
export function UserManagementSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Table skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-12 bg-gray-200 rounded-full w-12 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Large chart skeleton */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export function EcommerceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Product grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 space-y-3">
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
