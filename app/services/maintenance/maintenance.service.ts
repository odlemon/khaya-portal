// @ts-nocheck
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { API_CONFIG } from '../../config/api.config';
import { useCallback, useMemo } from 'react';

export interface MaintenanceRequest {
  _id: string;
  status: 'pending' | 'approved' | 'rejected' | 'awaiting_vendor' | 'vendor_assigned' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  issueType: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  rentalId: {
    status: string;
    startDate: string;
    endDate: string;
  };
  propertyId: {
    title: string;
    address: {
      street: string;
      city: string;
    };
  };
  landlordId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedVendor?: {
    vendorId: string;
    vendorName: string;
    phoneNumber: string;
    company: string;
    email?: string;
  };
  estimatedArrival?: string;
  actualArrival?: string;
  vendorUpdates?: Array<{
    message: string;
    timestamp: string;
    from: 'vendor' | 'landlord' | 'tenant' | 'admin';
    type: 'eta_update' | 'status_update' | 'completion_update';
  }>;
  workCompletedAt?: string;
  invoiceUrl?: string;
  totalCost?: number;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  vendorAssignedAt?: string;
  completedAt?: string;
}

export interface AssignVendorRequest {
  vendorId: string;
  estimatedArrival: string;
}

export interface UpdateETARequest {
  estimatedArrival: string;
  message?: string;
}

export interface MarkArrivedRequest {
  message?: string;
}

export interface MaintenanceFilters {
  status?: string;
  urgency?: string;
  issueType?: string;
  propertyId?: string;
  landlordId?: string;
  tenantId?: string;
}

export interface MaintenanceRequestsResponse {
  success: boolean;
  data: MaintenanceRequest[];
}

// Custom hook for maintenance service
export function useMaintenanceService() {
  const fetchWithAuth = useFetchWithAuth();

  const getRequestsAwaitingVendor = async (): Promise<MaintenanceRequest[]> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/admin/awaiting-vendor`);
    if (!response.ok) {
      throw new Error('Failed to fetch requests awaiting vendor');
    }
    
    const data = await response.json();
    return data.data || data;
  };

  const getMaintenanceRequests = useCallback(async (filters?: MaintenanceFilters): Promise<MaintenanceRequestsResponse | null> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.urgency) queryParams.append('urgency', filters.urgency);
      if (filters?.issueType) queryParams.append('issueType', filters.issueType);
      if (filters?.propertyId) queryParams.append('propertyId', filters.propertyId);
      if (filters?.landlordId) queryParams.append('landlordId', filters.landlordId);
      if (filters?.tenantId) queryParams.append('tenantId', filters.tenantId);

      const url = queryParams.toString() ? `${API_CONFIG.baseUrl}/maintenance?${queryParams}` : `${API_CONFIG.baseUrl}/maintenance`;
      
      const response = await fetchWithAuth(url, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch maintenance requests');
      const data = await response.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching maintenance requests:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getAllMaintenanceRequests = useCallback(async (): Promise<MaintenanceRequestsResponse | null> => {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/admin/all`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch all maintenance requests');
      const data = await response.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching all maintenance requests:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getMaintenanceRequestById = async (id: string): Promise<MaintenanceRequest | null> => {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance request');
      }
      
      const data = await response.json();
      return data.data || data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching maintenance request:', e);
      throw e;
    }
  };

  const assignVendor = async (requestId: string, assignmentData: AssignVendorRequest): Promise<MaintenanceRequest> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/admin/requests/${requestId}/assign-vendor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign vendor');
    }

    const data = await response.json();
    return data.data || data;
  };

  const updateVendorETA = async (requestId: string, etaData: UpdateETARequest): Promise<MaintenanceRequest> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/admin/requests/${requestId}/update-eta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(etaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update vendor ETA');
    }

    const data = await response.json();
    return data.data || data;
  };

  const markVendorArrived = async (requestId: string, arrivalData: MarkArrivedRequest): Promise<MaintenanceRequest> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/admin/requests/${requestId}/mark-arrived`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arrivalData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark vendor as arrived');
    }

    const data = await response.json();
    return data.data || data;
  };

  const updateRequestStatus = async (requestId: string, status: string, message?: string): Promise<MaintenanceRequest> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update request status');
    }

    const data = await response.json();
    return data.data || data;
  };

  const completeRequest = async (requestId: string, completionData: {
    workCompletedAt: string;
    invoiceUrl?: string;
    totalCost?: number;
    message?: string;
  }): Promise<MaintenanceRequest> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/maintenance/${requestId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete request');
    }

    const data = await response.json();
    return data.data || data;
  };

  return useMemo(() => ({
    getRequestsAwaitingVendor,
    getMaintenanceRequests,
    getAllMaintenanceRequests,
    getMaintenanceRequestById,
    assignVendor,
    updateVendorETA,
    markVendorArrived,
    updateRequestStatus,
    completeRequest,
  }), [getRequestsAwaitingVendor, getMaintenanceRequests, getAllMaintenanceRequests, getMaintenanceRequestById, assignVendor, updateVendorETA, markVendorArrived, updateRequestStatus, completeRequest]);
}
