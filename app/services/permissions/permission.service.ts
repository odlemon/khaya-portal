// @ts-nocheck
import { API_CONFIG } from '../../config/api.config';

export interface Permission {
  name: string;
  value: boolean;
}

export interface Role {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

class PermissionService {
  private baseUrl = `${API_CONFIG.baseUrl}/roles`;

  async getUserRole(token: string): Promise<Role | null> {
    try {
      // Decode the token to get roleId
      const roleId = this.getRoleIdFromToken(token);
      
      if (!roleId) {
        return null;
      }

      // Fetch the role details
      const response = await fetch(`${this.baseUrl}/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  async getUserPermissions(token: string): Promise<Permission[]> {
    try {
      const role = await this.getUserRole(token);
      
      if (role?.permissions) {
        return role.permissions;
      }
      
      // Fallback: return default permissions for admin users
      const decoded = this.decodeToken(token);
      if (decoded?.role === 'admin') {
        return [
          { name: 'manage_users', value: true },
          { name: 'manage_roles', value: true },
          { name: 'view_dashboard', value: true },
          { name: 'view_reports', value: true },
          { name: 'view_structure', value: true },
          { name: 'manage_structure', value: true },
          { name: 'view_pricing', value: true },
          { name: 'manage_pricing', value: true },
          { name: 'view_billing_settings', value: true },
          { name: 'manage_billing_settings', value: true },
          { name: 'view_billing', value: true },
          { name: 'manage_billing', value: true },
          { name: 'view_worklog', value: true },
          { name: 'manage_worklog', value: true },
          { name: 'view_payments', value: true },
          { name: 'manage_payments', value: true },
          { name: 'view_invoices', value: true },
          { name: 'manage_invoices', value: true },
          { name: 'view_subscription', value: true },
          { name: 'manage_subscription', value: true },
          { name: 'manage_firm_settings', value: true },
        ];
      }
      
      // Default permissions for regular users
      return [
        { name: 'view_dashboard', value: true },
        { name: 'view_reports', value: false },
        { name: 'view_structure', value: true },
        { name: 'manage_structure', value: false },
        { name: 'view_pricing', value: true },
        { name: 'manage_pricing', value: false },
        { name: 'view_billing_settings', value: true },
        { name: 'manage_billing_settings', value: false },
        { name: 'view_billing', value: true },
        { name: 'manage_billing', value: false },
        { name: 'view_worklog', value: true },
        { name: 'manage_worklog', value: false },
        { name: 'view_payments', value: true },
        { name: 'manage_payments', value: false },
        { name: 'view_invoices', value: true },
        { name: 'manage_invoices', value: false },
        { name: 'view_subscription', value: true },
        { name: 'manage_subscription', value: false },
        { name: 'manage_firm_settings', value: false },
      ];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      // Return default permissions on error
      return [
        { name: 'view_dashboard', value: true },
        { name: 'view_reports', value: false },
        { name: 'view_structure', value: true },
        { name: 'manage_structure', value: false },
        { name: 'view_pricing', value: true },
        { name: 'manage_pricing', value: false },
        { name: 'view_billing_settings', value: true },
        { name: 'manage_billing_settings', value: false },
        { name: 'view_billing', value: true },
        { name: 'manage_billing', value: false },
        { name: 'view_worklog', value: true },
        { name: 'manage_worklog', value: false },
        { name: 'view_payments', value: true },
        { name: 'manage_payments', value: false },
        { name: 'view_invoices', value: true },
        { name: 'manage_invoices', value: false },
        { name: 'view_subscription', value: true },
        { name: 'manage_subscription', value: false },
        { name: 'manage_firm_settings', value: false },
      ];
    }
  }

  async hasPermission(token: string, permissionName: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(token);
      const permission = permissions.find(p => p.name === permissionName);
      return permission?.value === true;
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  async hasAnyPermission(token: string, permissionNames: string[]): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(token);
      return permissionNames.some(name => {
        const permission = permissions.find(p => p.name === name);
        return permission?.value === true;
      });
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  async hasAllPermissions(token: string, permissionNames: string[]): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(token);
      return permissionNames.every(name => {
        const permission = permissions.find(p => p.name === name);
        return permission?.value === true;
      });
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  private getRoleIdFromToken(token: string): string | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      return decoded.roleId || null;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }
}

const permissionService = new PermissionService();
export default permissionService;
