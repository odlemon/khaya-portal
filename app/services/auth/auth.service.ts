// @ts-nocheck
import { RegisterData, AuthResponse, LoginData, MeResponse, ChangePasswordData } from './types';
import { API_CONFIG } from '../../config/api.config';

class AuthService {
  private get authBase() {
    return `${API_CONFIG.baseUrl}/auth`;
  }

  private get meUrl() {
    return `${this.authBase}/me`;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.authBase}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Registration failed');
      }
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async getMe(token: string): Promise<MeResponse> {
    try {
      const response = await fetch(this.meUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to fetch user details');
      }
      return result;
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: error instanceof Error ? error.message : 'Failed to fetch user details',
      };
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.authBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || result.error || 'Login failed',
          code: result.code,
        };
      }
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async changePassword(
    token: string,
    data: ChangePasswordData
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.authBase}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || result.error || 'Password change failed',
        };
      }
      return { success: true, message: result.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed',
      };
    }
  }
}

const authService = new AuthService();
export default authService;
