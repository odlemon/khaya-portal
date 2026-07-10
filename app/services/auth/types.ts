// @ts-nocheck
import type { PortalType, SessionUser, StaffRoleRef } from '../../types/staffSession';

export interface RegisterData {
  firmName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  newPassword: string;
  confirmPassword: string;
  currentPassword?: string;
}

export interface AuthUserPayload {
  id?: string;
  userId?: string;
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  firmName?: string;
  role?: string;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  portal?: PortalType;
  staffRole?: StaffRoleRef | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  code?: string;
  token?: string;
  user?: AuthUserPayload;
  permissions?: string[];
  portal?: PortalType;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  staffRole?: StaffRoleRef | null;
  data?: {
    token?: string;
    user?: AuthUserPayload;
    permissions?: string[];
    portal?: PortalType;
    isSuperAdmin?: boolean;
    mustChangePassword?: boolean;
    staffRole?: StaffRoleRef | null;
  };
  error?: string;
}

export interface FirmInfo {
  _id: string;
  name: string;
}

export interface UserDetailsData extends AuthUserPayload {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  firm?: FirmInfo;
}

export type MeResponse = {
  success: boolean;
  data?: UserDetailsData;
  message?: string;
  permissions?: string[];
  portal?: PortalType;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  staffRole?: StaffRoleRef | null;
};
