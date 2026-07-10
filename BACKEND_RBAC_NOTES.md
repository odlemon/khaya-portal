# RBAC — Frontend test results (seed credentials)

Retested **2026-07-08** against `http://localhost:4002` + portal `http://localhost:3005`.

Seed: `npm run seed:rbac-test`.

---

## Fixes in this pass

1. **Forbidden URL → Access denied** — `RoutePermissionGuard` shows an Access denied card + **Go back** (no blank page / silent redirect). Waits for auth loading before gating.
2. **Nav prefixes** — nested routes (`/properties/...`, `/payments/requests`, bank/insurance paths) map to the right permission keys.
3. **Sidebar empty sections** — section headers (Property Management, Payments, etc.) only render when at least one allowed link exists.

---

## Browser matrix (sidebar + manual URL)

| Account | Sidebar (allowed only) | Manual forbidden URL | Result |
|---------|------------------------|----------------------|--------|
| `staff.users@khaya.test` | Dashboard, Tenants, Landlords, Terminated accounts, Settings — **no Properties** | `/properties` → Access denied + Go back | Pass |
| `staff.payments@khaya.test` | Dashboard, Payments, Settings | `/tenants`, `/properties` → Access denied | Pass |
| `staff.minimal@khaya.test` | Dashboard, Settings | `/properties` → Access denied | Pass |
| `staff.manager@khaya.test` | Dashboard, Settings; settings tabs: Account, Staff roles, Staff users | `/settings/users` → Access denied; `/settings/staff/roles` OK | Pass |
| `staff.bank@khaya.test` | Dashboard, Settlement queue — **no Insurance settlements** | `/bank/insurance-settlement-queue` → Access denied | Pass |
| `staff.insurance@khaya.test` | Dashboard, Pending reviews | Insurance home OK | Pass |
| `staff.mustchange@khaya.test` | Blocking modal: **Set a new password** | Modal blocks use of portal | Pass |

---

## Access-denied behaviour

- Chrome (sidebar + navbar) stays visible.
- Forbidden link is **not** in the sidebar.
- Typing the path manually shows **Access denied** and **Go back** to the first allowed route.

---

## Super-admin / API notes

- Seed logins for all 10 accounts still OK (see earlier matrix in git history / prior notes).
- Backend 403s for staff endpoints without permission still expected (`/api/admin/staff/*`, `/api/admin/users` when missing `users.view`).
- Payments list probe path `GET /api/admin/payments` may 404 if the portal uses a different payments endpoint — not an RBAC UI failure.

---

## Summary

Nav gating and **manual URL Access denied** work for Users Viewer, Payments, Minimal, Staff Manager, Bank, Insurance, and must-change password.
