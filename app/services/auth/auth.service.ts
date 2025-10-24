// @ts-nocheck
import { RegisterData, AuthResponse, LoginData, MeResponse } from './types';
import { API_CONFIG } from '../../config/api.config';

class AuthService {
  private baseUrl = `${API_CONFIG.baseUrl}/auth`;
  private meUrl = `${API_CONFIG.baseUrl}/auth/me`;

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to fetch user details');
      }
      return result;
    } catch (error) {
      return {
        success: false,
        user: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user details',
      } as any;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Login failed');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }
}

// Create a singleton instance
const authService = new AuthService();
export default authService; 