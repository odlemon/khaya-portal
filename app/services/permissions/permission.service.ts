// @ts-nocheck
/**
 * @deprecated RBAC permissions now come from login/me via AuthContext.
 * This file is kept for backward compatibility only.
 */
import type { Permission } from './usePermissions';

export type { Permission };

class PermissionService {
  async getUserPermissions(_token: string): Promise<Permission[]> {
    return [];
  }

  async hasPermission(_token: string, _permissionName: string): Promise<boolean> {
    return false;
  }

  async hasAnyPermission(_token: string, _permissionNames: string[]): Promise<boolean> {
    return false;
  }

  async hasAllPermissions(_token: string, _permissionNames: string[]): Promise<boolean> {
    return false;
  }
}

const permissionService = new PermissionService();
export default permissionService;
