// @ts-nocheck
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { canAccess, canAccessAll, canAccessAny } from '../../lib/rbac';
import SkeletonLoader from '../../components/SkeletonLoader';

/** @deprecated Legacy shape — use string permission keys from AuthContext instead. */
export interface Permission {
  name: string;
  value: boolean;
}

export function usePermissions() {
  const { permissions, isSuperAdmin, loading } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    return canAccess(permissions, permissionName, isSuperAdmin);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return canAccessAny(permissions, permissionNames, isSuperAdmin);
  };

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return canAccessAll(permissions, permissionNames, isSuperAdmin);
  };

  /** Legacy compat — maps string[] to Permission[] for any old consumers */
  const permissionsLegacy: Permission[] = permissions.map((name) => ({
    name,
    value: true,
  }));

  return {
    permissions: permissionsLegacy,
    permissionKeys: permissions,
    isSuperAdmin,
    loading,
    ready: !loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

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

export function PermissionGate({
  permission,
  permissions: permissionList,
  requireAll = false,
  children,
  fallback = null,
  skeletonType = 'card',
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
  } else if (permissionList) {
    hasAccess = requireAll ? hasAllPermissions(permissionList) : hasAnyPermission(permissionList);
  } else {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
