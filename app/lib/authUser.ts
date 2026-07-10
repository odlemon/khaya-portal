// @ts-nocheck
/**
 * Map API login / GET me user payload → shape stored in AuthContext + sessionStorage.
 */
import type { PortalType, RbacState, SessionUser, StaffRoleRef } from '../types/staffSession';
import { normalizePortal } from './rbac';
import { isKhayalamiAdminRole } from './portals';

function toStaffRoleRef(raw: unknown): StaffRoleRef | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r._id ?? '');
  if (!id) return null;
  return {
    id,
    name: String(r.name ?? ''),
    portal: normalizePortal(r.portal),
  };
}

export function toSessionUser(api: Record<string, unknown> | null | undefined): SessionUser {
  if (!api || typeof api !== 'object') {
    return {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      firmName: '',
      role: '',
    };
  }
  const firm = api.firm as { name?: string } | undefined;
  const staffRole = toStaffRoleRef(api.staffRole);

  return {
    id: String(api.userId ?? api._id ?? api.id ?? ''),
    email: String(api.email ?? ''),
    firstName: String(api.firstName ?? ''),
    lastName: String(api.lastName ?? ''),
    firmName: String(api.firmName ?? firm?.name ?? ''),
    role: String(api.role ?? ''),
    isSuperAdmin: api.isSuperAdmin === true,
    mustChangePassword: api.mustChangePassword === true,
    portal: normalizePortal(api.portal),
    staffRole,
  };
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === 'string');
}

/** Extract RBAC fields from login or GET /me response (top-level or nested in data). */
export function extractRbacFromAuthResponse(
  res: Record<string, unknown> | null | undefined,
  user?: SessionUser | null
): RbacState {
  const data = (res?.data && typeof res.data === 'object' ? res.data : res) as Record<string, unknown>;
  const userObj = user ?? toSessionUser((data?.user as Record<string, unknown>) ?? data);

  const permissions = normalizePermissions(res?.permissions ?? data?.permissions);
  const portal = normalizePortal(res?.portal ?? data?.portal ?? userObj.portal);
  const staffRole = toStaffRoleRef(res?.staffRole ?? data?.staffRole ?? userObj.staffRole);

  let isSuperAdmin =
    res?.isSuperAdmin === true ||
    data?.isSuperAdmin === true ||
    userObj.isSuperAdmin === true;

  // Legacy migration: khayalami admin with no staff role → super-admin
  if (!isSuperAdmin && isKhayalamiAdminRole(userObj.role) && !staffRole) {
    isSuperAdmin = true;
  }

  const mustChangePassword =
    res?.mustChangePassword === true ||
    data?.mustChangePassword === true ||
    userObj.mustChangePassword === true;

  return {
    permissions,
    portal,
    isSuperAdmin,
    mustChangePassword,
    staffRole,
  };
}

export function mergeUserWithRbac(user: SessionUser, rbac: RbacState): SessionUser {
  return {
    ...user,
    isSuperAdmin: rbac.isSuperAdmin,
    mustChangePassword: rbac.mustChangePassword,
    portal: rbac.portal,
    staffRole: rbac.staffRole,
  };
}
