// @ts-nocheck

export const KHAYALAMI_ADMIN_ROLE = 'admin';
export const INSURANCE_ADMIN_ROLE = 'insurance_admin';
export const BANK_ADMIN_ROLE = 'bank_admin';

/** Lowercase / trim / spaces → underscores for comparisons */
export function normalizeRoleKey(role: string | undefined | null): string {
  if (role == null || typeof role !== 'string') return '';
  return role.trim().toLowerCase().replace(/\s+/g, '_');
}

export function isInsuranceAdminRole(role: string | undefined | null): boolean {
  return normalizeRoleKey(role) === 'insurance_admin' || normalizeRoleKey(role) === 'insuranceadmin';
}

export function isBankAdminRole(role: string | undefined | null): boolean {
  const k = normalizeRoleKey(role);
  return (
    k === 'bank_admin' ||
    k === 'bankadmin' ||
    k === 'bank_administrator' ||
    k === 'bankadministrator'
  );
}

export function isKhayalamiAdminRole(role: string | undefined | null): boolean {
  const k = normalizeRoleKey(role);
  return (
    k === 'admin' ||
    k === 'super_admin' ||
    k === 'superadmin' ||
    k === 'khayalami_admin' ||
    k === 'khaya_admin' ||
    k === 'khayalamiadmin'
  );
}

/** Read role claim from JWT (client-side only; API still enforces auth) */
export function getRoleFromJwtToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    const r = decoded?.role;
    if (typeof r === 'string') return r;
    if (r != null) return String(r);
    return null;
  } catch {
    return null;
  }
}

export function isPartnerPortalRole(role: string | undefined | null): boolean {
  return isInsuranceAdminRole(role) || isBankAdminRole(role);
}

/** Default home path after login for each portal role */
export function getDefaultPathForRole(role: string | undefined | null): string {
  if (isInsuranceAdminRole(role)) return '/insurance/dashboard';
  if (isBankAdminRole(role)) return '/bank/dashboard';
  return '/dashboard';
}

/** Bank / insurance areas use their own chrome; used to avoid showing Khayalami sidebar during auth/routing races */
export function isPartnerPortalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/insurance') || pathname.startsWith('/bank');
}
