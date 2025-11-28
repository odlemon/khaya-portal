# Khaya Portal - Project Modules Overview

Based on the sidebar navigation and project structure, here are all the modules in the Khaya Portal property management system:

## 📋 Module Categories

### 🏠 **Home Section**

#### 1. **Dashboard** (`/dashboard`)
- **Path**: `/dashboard`
- **Permission**: None (accessible to all authenticated users)
- **Description**: Main overview dashboard with key metrics and statistics
- **Components**:
  - DashboardHeaderCard
  - HousesCard
  - LandlordsCard
  - TenantsCard
  - PaymentsCard
  - MetricCard
- **Service**: `app/services/dashboard/dashboard.service.ts`

---

### 🏘️ **Property Management Section**

#### 2. **Tenants** (`/tenants`)
- **Path**: `/tenants`
- **Permission**: `view_tenants`
- **Description**: Manage tenant information, profiles, and tenant-related operations
- **Service**: `app/services/user/user.service.ts` or `app/services/users/users.service.ts`
- **Page**: `app/(app)/tenants/page.tsx`

#### 3. **Landlords** (`/landlords`)
- **Path**: `/landlords`
- **Permission**: `view_landlords`
- **Description**: Manage landlord profiles, properties owned, and landlord information
- **Service**: `app/services/users/users.service.ts` or `app/services/user/user.service.ts`
- **Page**: `app/(app)/landlords/page.tsx`

#### 4. **Properties** (`/properties`)
- **Path**: `/properties`
- **Permission**: `view_properties`
- **Description**: Manage property listings, property details, images, and property information
- **Service**: `app/services/properties/properties.service.ts`
- **Page**: `app/(app)/properties/page.tsx`

#### 5. **Agreements** (`/agreements`)
- **Path**: `/agreements`
- **Permission**: `view_agreements`
- **Description**: Manage rental agreements, lease contracts, and agreement documents
- **Service**: `app/services/agreements/agreements.service.ts`
- **Page**: `app/(app)/agreements/page.tsx`

---

### 💰 **Payments Section**

#### 6. **Payments** (`/payments`)
- **Path**: `/payments`
- **Permission**: `view_payments`
- **Description**: Track and manage payment transactions, rent payments, and payment history
- **Service**: `app/services/payments/payments.service.ts`
- **Page**: `app/(app)/payments/page.tsx`
- **Layout**: Custom layout at `app/(app)/payments/layout.tsx`

#### 7. **Earnings** (`/earnings`)
- **Path**: `/earnings`
- **Permission**: `view_earnings`
- **Description**: View earnings reports, revenue analytics, and financial summaries
- **Service**: Likely uses `payments.service.ts` or dedicated earnings service
- **Page**: `app/(app)/earnings/page.tsx`

#### 8. **Incoming Requests** (`/incoming-requests`)
- **Path**: `/incoming-requests`
- **Permission**: `view_verification_requests`
- **Description**: Handle incoming verification requests, approval workflows, and pending requests
- **Service**: Likely `app/services/admin/admin.services.ts` or dedicated service
- **Page**: `app/(app)/incoming-requests/page.tsx`

---

### 💬 **Communication Section**

#### 9. **Messages** (`/messages`)
- **Path**: `/messages`
- **Permission**: `view_chats`
- **Description**: Real-time messaging system for communication between tenants, landlords, and admins
- **Features**:
  - Chat list and individual conversations
  - Real-time messaging via Socket.IO
  - Private messaging with @mentions
  - Message history
- **Services**:
  - `app/services/chat/chat.service.ts`
  - `app/store/chatStore.ts` (Zustand store)
  - `app/lib/socket.ts` (Socket.IO service)
- **Pages**:
  - `app/(app)/messages/page.tsx` (Main messages page)
  - `app/(app)/chats/page.tsx` (Alternative chats page)
  - `app/(app)/chats/[chatId]/page.tsx` (Individual chat page)

---

### 🔧 **Maintenance & Services Section**

#### 10. **Vendors** (`/vendors`)
- **Path**: `/vendors`
- **Permission**: `view_vendors`
- **Description**: Manage vendor profiles, contractor information, and service providers
- **Service**: `app/services/vendors/vendors.service.ts`
- **Page**: `app/(app)/vendors/page.tsx`

#### 11. **Maintenance Requests** (`/maintenance-requests`)
- **Path**: `/maintenance-requests`
- **Permission**: `view_maintenance`
- **Description**: Track and manage maintenance requests, repairs, and service requests
- **Service**: `app/services/maintenance/maintenance.service.ts`
- **Page**: `app/(app)/maintenance-requests/page.tsx`

#### 12. **Service Requests** (`/services-requests`)
- **Path**: `/services-requests`
- **Permission**: Not explicitly defined in sidebar (may use same as maintenance)
- **Description**: Handle general service requests and service-related tasks
- **Page**: `app/(app)/services-requests/page.tsx`

---

## 🔐 **Permission-Based Access Control**

All modules (except Dashboard) are protected by permission-based access control:

| Permission | Modules |
|------------|---------|
| `view_tenants` | Tenants |
| `view_landlords` | Landlords |
| `view_properties` | Properties |
| `view_agreements` | Agreements |
| `view_payments` | Payments |
| `view_earnings` | Earnings |
| `view_verification_requests` | Incoming Requests |
| `view_chats` | Messages |
| `view_vendors` | Vendors |
| `view_maintenance` | Maintenance Requests |

**Permission Service**: `app/services/permissions/permission.service.ts`  
**Permission Hook**: `app/services/permissions/usePermissions.tsx`

---

## 🏗️ **Service Layer Architecture**

### Core Services

1. **Authentication** (`app/services/auth/`)
   - `auth.service.ts` - Login, registration, user authentication
   - `types.ts` - Auth-related TypeScript types

2. **User Management** (`app/services/user/` & `app/services/users/`)
   - User CRUD operations
   - User profile management

3. **Properties** (`app/services/properties/`)
   - Property management operations
   - Property listings and details

4. **Agreements** (`app/services/agreements/`)
   - Agreement management
   - Contract handling

5. **Payments** (`app/services/payments/`)
   - Payment processing
   - Transaction management

6. **Chat/Messaging** (`app/services/chat/`)
   - Real-time messaging
   - Chat management

7. **Maintenance** (`app/services/maintenance/`)
   - Maintenance request handling
   - Service request management

8. **Vendors** (`app/services/vendors/`)
   - Vendor management
   - Service provider operations

9. **Admin** (`app/services/services/admin.services.ts`)
   - Administrative operations
   - System management

10. **Dashboard** (`app/services/dashboard/`)
    - Dashboard metrics
    - Analytics and statistics

11. **Permissions** (`app/services/permissions/`)
    - Permission checking
    - Access control

---

## 🔌 **Real-Time Features**

### Socket.IO Integration
- **Service**: `app/lib/socket.ts`
- **Store**: `app/store/chatStore.ts`
- **Features**:
  - Real-time message delivery
  - Chat room management
  - Typing indicators support
  - Connection status monitoring

---

## 📁 **File Structure Summary**

```
app/(app)/
├── dashboard/          # Dashboard module
├── tenants/            # Tenants management
├── landlords/          # Landlords management
├── properties/         # Properties management
├── agreements/         # Agreements management
├── payments/           # Payments module
├── earnings/           # Earnings module
├── incoming-requests/  # Incoming requests
├── messages/           # Messages/Chat module
├── chats/              # Alternative chat interface
├── vendors/            # Vendors management
├── maintenance-requests/  # Maintenance requests
└── services-requests/  # Service requests
```

---

## 🎯 **Module Dependencies**

### Core Dependencies
- **Next.js 14.1.0** - Framework
- **React 18.2.0** - UI Library
- **Zustand 5.0.8** - State management
- **Socket.IO Client 4.8.1** - Real-time communication
- **date-fns 4.1.0** - Date utilities

### UI Libraries
- **Tailwind CSS 3.4.1** - Styling
- **Heroicons** - Icons
- **Lucide React** - Icons
- **React Icons** - Icon library

---

## 🚀 **Key Features by Module**

1. **Dashboard**: Overview metrics, cards, analytics
2. **Tenants/Landlords**: User management, profiles, CRUD operations
3. **Properties**: Property listings, details, images
4. **Agreements**: Contract management, document handling
5. **Payments**: Transaction tracking, payment history
6. **Earnings**: Revenue analytics, financial reports
7. **Messages**: Real-time chat, private messaging
8. **Maintenance**: Request tracking, repair management
9. **Vendors**: Service provider management
10. **Incoming Requests**: Verification and approval workflows

---

This portal is a comprehensive property management system designed for administrators to manage tenants, landlords, properties, agreements, payments, and communications all in one place.





