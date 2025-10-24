// @ts-nocheck
import { API_CONFIG } from '../../config/api.config';

class UserService {
  private baseUrl = `${API_CONFIG.baseUrl}/users`;

  async getUsers(token: string) {
    try {
      const response = await fetch(this.baseUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to fetch users');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to fetch users' };
    }
  }

  async addUser(token: string, data: Omit<any, 'id'>) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to add user');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to add user' };
    }
  }

  async updateUser(token: string, userId: string, data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to update user');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to update user' };
    }
  }

  async deleteUser(token: string, userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to delete user');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to delete user' };
    }
  }

  async getRoles(token: string) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to fetch roles');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to fetch roles' };
    }
  }

  async createRole(token: string, data: any) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to create role');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to create role' };
    }
  }

  async updateRole(token: string, roleId: string, data: any) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to update role');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to update role' };
    }
  }

  async deleteRole(token: string, roleId: string) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to delete role');
      return result;
    } catch (error) {
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to delete role' };
    }
  }
}

const userService = new UserService();
export default userService; 