// @ts-nocheck
import React from 'react';
import { PermissionGate } from '../services/permissions/usePermissions';
import SkeletonLoader from './SkeletonLoader';

interface PagePermissionWrapperProps {
  permissions?: string[];
  permission?: string;
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeletonType?: 'table' | 'card' | 'button' | 'text';
  skeletonRows?: number;
  className?: string;
}

export default function PagePermissionWrapper({
  permissions,
  permission,
  requireAll = false,
  children,
  fallback,
  skeletonType = 'card',
  skeletonRows = 3,
  className = ''
}: PagePermissionWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <PermissionGate
        permissions={permissions}
        permission={permission}
        requireAll={requireAll}
        skeletonType={skeletonType}
        fallback={fallback || defaultFallback}
      >
        {children}
      </PermissionGate>
    </div>
  );
} 