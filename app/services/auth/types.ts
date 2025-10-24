// @ts-nocheck
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

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    firmName?: string;
    role?: string;
  };
  data?: {
    token?: string;
    user?: {
      _id?: string;
      id?: string;
      email: string;
      firstName: string;
      lastName: string;
      firmName?: string;
      role: string;
      phone?: string;
      isVerified?: boolean;
      isActive?: boolean;
      createdAt?: string;
      updatedAt?: string;
    };
  };
  error?: string;
}

export interface FirmInfo {
  _id: string;
  name: string;
}

export interface UserDetailsData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  firm: FirmInfo;
}

export type MeResponse = {
  success: boolean;
  data: UserDetailsData;
  message?: string;
}; 