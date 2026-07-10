// @ts-nocheck

import type { PortalType, RbacState } from '../types/staffSession';

export function canAccess(
  permissions: string[],
  key: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return permissions.includes(key);
}

export function canAccessAny(
  permissions: string[],
  keys: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return keys.some((key) => permissions.includes(key));
}

export function canAccessAll(
  permissions: string[],
  keys: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return keys.every((key) => permissions.includes(key));
}

export interface NavItemWithPermission {
  permission?: string;
  permissions?: string[];
  path: string;
}

export function filterNav<T extends NavItemWithPermission>(
  items: T[],
  session: Pick<RbacState, 'permissions' | 'isSuperAdmin'>
): T[] {
  if (session.isSuperAdmin) return items;
  return items.filter((item) => {
    if (item.permissions?.length) {
      return item.permissions.some((p) => session.permissions.includes(p));
    }
    if (item.permission) {
      return session.permissions.includes(item.permission);
    }
    return true;
  });
}

export function normalizePortal(value: unknown): PortalType {
  if (value === 'khayalami' || value === 'bank' || value === 'insurance') {
    return value;
  }
  return null;
}
