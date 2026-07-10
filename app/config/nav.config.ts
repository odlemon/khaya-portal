// @ts-nocheck

/** Khayalami admin sidebar nav items with RBAC permission keys */
export const khayalamiNavItems = [
  { name: 'Dashboard', path: '/dashboard', permission: 'khayalami.dashboard.view' },
  { name: 'Tenants', path: '/tenants', permission: 'khayalami.users.view' },
  { name: 'Landlords', path: '/landlords', permission: 'khayalami.users.view' },
  { name: 'Properties', path: '/properties', permission: 'khayalami.properties.view' },
  { name: 'Agreements', path: '/agreements', permission: 'khayalami.agreements.view' },
  { name: 'Payments', path: '/payments', permission: 'khayalami.payments.view' },
  { name: 'Earnings', path: '/earnings', permission: 'khayalami.commissions.view' },
  { name: 'Document Verifications', path: '/incoming-requests', permission: 'khayalami.documents.view' },
  { name: 'Escrow', path: '/escrow', permission: 'khayalami.escrow.view' },
  { name: 'Khayachats', path: '/messages', permission: 'khayalami.chat.view' },
  { name: 'Vendors', path: '/vendors', permission: 'khayalami.service_providers.view' },
  { name: 'Maintenance', path: '/maintenance-requests', permission: 'khayalami.maintenance.view' },
  { name: 'Service Requests', path: '/services-requests', permission: 'khayalami.services.view' },
  { name: 'Terminated accounts', path: '/terminated-accounts', permission: 'khayalami.users.view' },
  { name: 'Settings', path: '/settings', permission: undefined },
] as const;

export const bankNavItems = [
  { name: 'Dashboard', path: '/bank/dashboard', permission: 'bank.dashboard.view' },
  { name: 'Settlement queue', path: '/bank/settlement-queue', permission: 'bank.payouts.view' },
  { name: 'Insurance settlements', path: '/bank/insurance-settlement-queue', permission: 'bank.insurance_payouts.view' },
] as const;

export const insuranceNavItems = [
  { name: 'Dashboard', path: '/insurance/dashboard', permission: 'insurance.dashboard.view' },
  { name: 'Pending reviews', path: '/insurance/pending-reviews', permission: 'insurance.policies.view' },
] as const;

/** Route → required permission for RoutePermissionGuard */
export const routePermissions: Record<string, string | undefined> = {};

for (const item of khayalamiNavItems) {
  if (item.permission) routePermissions[item.path] = item.permission;
}
for (const item of bankNavItems) {
  routePermissions[item.path] = item.permission;
}
for (const item of insuranceNavItems) {
  routePermissions[item.path] = item.permission;
}

routePermissions['/settings/account'] = undefined;
routePermissions['/settings'] = undefined;
routePermissions['/settings/users'] = 'khayalami.users.view';
routePermissions['/settings/staff/roles'] = 'khayalami.staff.roles.manage';
routePermissions['/settings/staff/users'] = 'khayalami.staff.users.manage';

routePermissions['/payments/requests'] = 'khayalami.payment_requests.view';
routePermissions['/messages'] = 'khayalami.chat.view';

/** Prefix matches for nested routes (longest match first) */
export const routePermissionPrefixes: { prefix: string; permission: string }[] = [
  { prefix: '/settings/staff/roles', permission: 'khayalami.staff.roles.manage' },
  { prefix: '/settings/staff/users', permission: 'khayalami.staff.users.manage' },
  { prefix: '/settings/users', permission: 'khayalami.users.view' },
  { prefix: '/payments/requests', permission: 'khayalami.payment_requests.view' },
  { prefix: '/bank/insurance-payouts', permission: 'bank.insurance_payouts.view' },
  { prefix: '/bank/insurance-settlement-queue', permission: 'bank.insurance_payouts.view' },
  { prefix: '/bank/settlement-queue', permission: 'bank.payouts.view' },
  { prefix: '/bank/payouts', permission: 'bank.payouts.view' },
  { prefix: '/bank/dashboard', permission: 'bank.dashboard.view' },
  { prefix: '/insurance/pending-reviews', permission: 'insurance.policies.view' },
  { prefix: '/insurance/policies', permission: 'insurance.policies.view' },
  { prefix: '/insurance/dashboard', permission: 'insurance.dashboard.view' },
  { prefix: '/escrow', permission: 'khayalami.escrow.view' },
  { prefix: '/chats', permission: 'khayalami.chat.view' },
  { prefix: '/messages', permission: 'khayalami.chat.view' },
  { prefix: '/properties', permission: 'khayalami.properties.view' },
  { prefix: '/agreements', permission: 'khayalami.agreements.view' },
  { prefix: '/payments', permission: 'khayalami.payments.view' },
  { prefix: '/earnings', permission: 'khayalami.commissions.view' },
  { prefix: '/incoming-requests', permission: 'khayalami.documents.view' },
  { prefix: '/vendors', permission: 'khayalami.service_providers.view' },
  { prefix: '/maintenance-requests', permission: 'khayalami.maintenance.view' },
  { prefix: '/services-requests', permission: 'khayalami.services.view' },
  { prefix: '/tenants', permission: 'khayalami.users.view' },
  { prefix: '/landlords', permission: 'khayalami.users.view' },
  { prefix: '/terminated-accounts', permission: 'khayalami.users.view' },
  { prefix: '/dashboard', permission: 'khayalami.dashboard.view' },
];

export function getRoutePermission(pathname: string | null | undefined): string | null | undefined {
  if (!pathname) return undefined;
  // Explicit allowlist for open settings shells
  if (pathname === '/settings' || pathname === '/settings/account') {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(routePermissions, pathname)) {
    return routePermissions[pathname];
  }
  for (const { prefix, permission } of routePermissionPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return permission;
    }
  }
  return undefined;
}

export function getFirstAllowedPath(
  items: { path: string; permission?: string }[],
  permissions: string[],
  isSuperAdmin: boolean
): string | null {
  if (isSuperAdmin && items.length) return items[0].path;
  for (const item of items) {
    if (!item.permission || permissions.includes(item.permission)) {
      return item.path;
    }
  }
  return '/settings/account';
}
