// @ts-nocheck
import React from 'react';

interface SkeletonLoaderProps {
  type?: 'table' | 'card' | 'button' | 'text';
  rows?: number;
  className?: string;
}

export default function SkeletonLoader({ type = 'card', rows = 3, className = '' }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'button':
        return (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        );
      
      case 'text':
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        );
      
      default:
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
} 