// @ts-nocheck

export type PortalType = 'khayalami' | 'bank' | 'insurance' | null;

export interface StaffRoleRef {
  id: string;
  name: string;
  portal: PortalType;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firmName: string;
  role: string;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  portal?: PortalType;
  staffRole?: StaffRoleRef | null;
}

export interface RbacState {
  permissions: string[];
  portal: PortalType;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  staffRole: StaffRoleRef | null;
}

export interface StaffSession extends RbacState {
  token: string;
  user: SessionUser;
}

export interface LoginPayload {
  token: string;
  user: SessionUser;
  permissions?: string[];
  portal?: PortalType;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  staffRole?: StaffRoleRef | null;
}
