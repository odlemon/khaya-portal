# RBAC Manual Test Guide

Use this to verify role-based access on the Khaya Portal yourself.

**Assumes:**

- Backend: `http://localhost:4002`
- Portal: `http://localhost:3005`
- Seed data already loaded (`npm run seed:rbac-test` on the backend)

**Default password for most staff:** `Test@123456`

---

## Accounts

| # | Email | Password | Portal | Role | What they can do |
|---|-------|----------|--------|------|------------------|
| 1 | `admin@khaya.com` | `Admin@123456` | Khayalami | Super admin | Everything |
| 2 | `staff.users@khaya.test` | `Test@123456` | Khayalami | Users Viewer | Dashboard + tenants/landlords/terminated + Customers in Settings |
| 3 | `staff.payments@khaya.test` | `Test@123456` | Khayalami | Payments Officer | Dashboard + Payments |
| 4 | `staff.minimal@khaya.test` | `Test@123456` | Khayalami | Dashboard Only | Dashboard + Account settings only |
| 5 | `staff.manager@khaya.test` | `Test@123456` | Khayalami | Staff Manager | Dashboard + Staff roles + Staff users |
| 6 | `staff.mustchange@khaya.test` | `Temp@Test1` | Khayalami | Must change password | Forced password modal on login |
| 7 | `staff.bank@khaya.test` | `Test@123456` | Bank | Bank Payouts Viewer | Bank dashboard + Settlement queue |
| 8 | `admin@metbank` | *(seed password)* | Bank | Bank super | Full bank nav |
| 9 | `staff.insurance@khaya.test` | `Test@123456` | Insurance | Insurance staff | Insurance dashboard + Pending reviews |
| 10 | `admin@insurance.com` | *(seed password)* | Insurance | Insurance super | Full insurance nav |

> Tip: always **Sign out** before switching accounts (or clear the session).

---

## How to test (general rules)

For each restricted account:

1. **Login** with the email/password above.
2. **Check the sidebar** — only allowed links should appear. Forbidden links must be **hidden**, not just disabled.
3. **Type a forbidden URL** in the address bar (examples below).
4. Expect an **Access denied** card with a **Go back** button (sidebar/navbar still visible).
5. Open **Settings** and check which tabs appear (Account is always allowed).

---

## Test cases by account

### 1. Super admin — `admin@khaya.com` / `Admin@123456`

**Expect**

- Full Khayalami sidebar (Dashboard, Tenants, Landlords, Properties, Payments, Settings, etc.)
- Settings tabs: Account, Customers, Staff roles, Staff users
- Can open any route (e.g. `/properties`, `/settings/staff/roles`)

**Do**

- [ ] Login succeeds
- [ ] Sidebar shows all main sections
- [ ] Settings shows all 4 tabs
- [ ] Can create/edit staff roles and staff users

---

### 2. Users Viewer — `staff.users@khaya.test` / `Test@123456`

**Expect sidebar**

- Dashboard
- Tenants
- Landlords
- Terminated accounts
- Settings
- **No** Properties, Payments, Agreements, Escrow, etc.

**Expect Settings tabs**

- Account
- Customers
- **No** Staff roles / Staff users

**Manual URLs**

| URL | Expected |
|-----|----------|
| `/dashboard` | OK |
| `/tenants` | OK |
| `/properties` | Access denied |
| `/payments` | Access denied |
| `/settings/staff/roles` | Access denied |

**Do**

- [ ] Sidebar matches list above (no Properties link)
- [ ] Type `/properties` → Access denied + Go back
- [ ] Settings → Customers lists landlords/tenants only (no staff/admin rows)
- [ ] Cannot open Staff roles tab

---

### 3. Payments Officer — `staff.payments@khaya.test` / `Test@123456`

**Expect sidebar**

- Dashboard
- Payments
- Settings
- **No** Tenants, Landlords, Properties

**Expect Settings tabs**

- Account only (no Customers / Staff tabs)

**Manual URLs**

| URL | Expected |
|-----|----------|
| `/payments` | OK |
| `/tenants` | Access denied |
| `/properties` | Access denied |
| `/settings/users` | Access denied |

**Do**

- [ ] Sidebar = Dashboard + Payments + Settings
- [ ] `/tenants` → Access denied
- [ ] Settings has Account only

---

### 4. Minimal (Dashboard Only) — `staff.minimal@khaya.test` / `Test@123456`

**Expect sidebar**

- Dashboard
- Settings
- Nothing else

**Expect Settings tabs**

- Account only

**Manual URLs**

| URL | Expected |
|-----|----------|
| `/dashboard` | OK |
| `/properties` | Access denied |
| `/payments` | Access denied |
| `/tenants` | Access denied |

**Do**

- [ ] Very short sidebar
- [ ] Profile card loads on Account
- [ ] Change password modal opens (eye icon works)
- [ ] Forbidden URLs show Access denied

---

### 5. Staff Manager — `staff.manager@khaya.test` / `Test@123456`

**Expect sidebar**

- Dashboard
- Settings
- **No** Tenants / Properties / Payments

**Expect Settings tabs**

- Account
- Staff roles
- Staff users
- **No** Customers

**Manual URLs**

| URL | Expected |
|-----|----------|
| `/settings/staff/roles` | OK |
| `/settings/staff/users` | OK |
| `/settings/users` (Customers) | Access denied |
| `/properties` | Access denied |

**Do**

- [ ] Staff roles table uses edit/trash icons
- [ ] Can open create/edit role modal (text readable, black labels)
- [ ] Staff users: edit / activate-deactivate icons
- [ ] **No** “Reset password” action on staff users
- [ ] Customers tab not visible; `/settings/users` → Access denied

---

### 6. Must change password — `staff.mustchange@khaya.test` / `Temp@Test1`

**Expect**

- After login, blocking modal: **Set a new password**
- Cannot use the portal until password is changed
- Eye icons on password fields

**Do**

- [ ] Modal appears and blocks interaction
- [ ] Cannot dismiss without changing password
- [ ] (Optional) Set a new password → modal closes and portal works
  - If you change it, remember the seed temp password may no longer work until you re-seed

---

### 7. Bank Payouts Viewer — `staff.bank@khaya.test` / `Test@123456`

**Expect sidebar (Bank portal)**

- Dashboard
- Settlement queue
- Settings
- **No** Insurance settlements

**Manual URLs**

| URL | Expected |
|-----|----------|
| `/bank/dashboard` | OK |
| `/bank/settlement-queue` | OK |
| `/bank/insurance-settlement-queue` | Access denied |

**Do**

- [ ] Insurance settlements link hidden
- [ ] Type insurance queue URL → Access denied
- [ ] Settings → Account only (profile / change password)

---

### 8. Insurance staff — `staff.insurance@khaya.test` / `Test@123456`

**Expect sidebar (Insurance portal)**

- Dashboard
- Pending reviews
- Settings

**Manual URLs**

| URL | Expected |
|-----|----------|
| `/insurance/dashboard` | OK |
| `/insurance/pending-reviews` | OK |
| `/bank/dashboard` | Access denied (or wrong portal) |

**Do**

- [ ] Correct insurance nav only
- [ ] Settings → Account works

---

## Settings UI checklist (any account with Settings)

- [ ] Tabs look like iOS segmented control (Account / Customers / Staff roles / Staff users as allowed)
- [ ] Account: profile card + **Change password** button → modal
- [ ] Password fields have **eye** show/hide icons (login + change password + must-change modal)
- [ ] With browser/OS **dark mode** on: input/select text stays **black** on white (readable)

---

## Quick pass / fail summary sheet

Copy and tick while testing:

| Account | Sidebar OK | Forbidden URL → Access denied | Settings tabs OK | Notes |
|---------|------------|-------------------------------|------------------|-------|
| Super admin | ☐ | ☐ | ☐ | |
| Users Viewer | ☐ | ☐ | ☐ | |
| Payments Officer | ☐ | ☐ | ☐ | |
| Minimal | ☐ | ☐ | ☐ | |
| Staff Manager | ☐ | ☐ | ☐ | |
| Must change | ☐ | — | — | Modal blocks |
| Bank staff | ☐ | ☐ | ☐ | |
| Insurance staff | ☐ | ☐ | ☐ | |

---

## If something fails

1. Confirm backend is running and seed was applied.
2. Hard refresh the portal (`Ctrl+Shift+R`).
3. Sign out fully, then log in again.
4. For must-change account after you changed the password: re-run backend `npm run seed:rbac-test` to restore `Temp@Test1`.
