// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import permissionService, { Permission } from './permission.service';
import SkeletonLoader from '../../components/SkeletonLoader';

export function usePermissions() {
  const { token } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setPermissions([]);
      setLoading(false);
      setReady(true);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setReady(false);
        const userPermissions = await permissionService.getUserPermissions(token);
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Failed to load permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
        setReady(true);
      }
    };

    loadPermissions();
  }, [token]);

  const hasPermission = (permissionName: string): boolean => {
    const permission = permissions.find(p => p.name === permissionName);
    return permission?.value === true;
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  };

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name));
  };

  return {
    permissions,
    loading,
    ready,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

// Higher-order component for conditional rendering
export function withPermission(
  WrappedComponent: React.ComponentType<any>,
  requiredPermission: string,
  fallback?: React.ReactNode
) {
  return function PermissionWrapper(props: any) {
    const { hasPermission, loading, ready } = usePermissions();

    if (loading || !ready) {
      return <SkeletonLoader type="card" />;
    }

    if (!hasPermission(requiredPermission)) {
      return fallback || null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Permission-based conditional rendering component
export function PermissionGate({ 
  permission, 
  permissions, 
  requireAll = false, 
  children, 
  fallback = null,
  skeletonType = 'card'
}: {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeletonType?: 'table' | 'card' | 'button' | 'text';
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, ready } = usePermissions();

  if (loading || !ready) {
    return <SkeletonLoader type={skeletonType} />;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
} 