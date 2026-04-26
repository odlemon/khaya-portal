// @ts-nocheck
/**
 * Map API login / GET me user payload → shape stored in AuthContext + sessionStorage (via authSession).
 * Backend example: { userId, email, firstName, lastName, role, ... }
 */
export function toSessionUser(api: Record<string, unknown> | null | undefined) {
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
  return {
    id: String(api.userId ?? api._id ?? api.id ?? ''),
    email: String(api.email ?? ''),
    firstName: String(api.firstName ?? ''),
    lastName: String(api.lastName ?? ''),
    firmName: String(api.firmName ?? firm?.name ?? ''),
    role: String(api.role ?? ''),
  };
}
