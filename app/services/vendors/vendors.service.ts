// @ts-nocheck
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { API_CONFIG } from '../../config/api.config';
import { useCallback, useMemo } from 'react';

export interface ServiceProvider {
  _id: string;
  name: string;
  company: string;
  phoneNumber: string;
  email: string;
  serviceTypes: string[];
  location: {
    city: string;
    area: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  businessLicense?: string;
  insuranceNumber?: string;
  rating: number;
  totalJobs: number;
  isActive: boolean;
  isVerified: boolean;
  verificationNotes?: string;
  stats: {
    completedJobs: number;
    averageRating: number;
    responseTime: number;
    onTimeRate: number;
  };
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceProviderRequest {
  name: string;
  company: string;
  phoneNumber: string;
  email: string;
  serviceTypes: string[];
  location: {
    city: string;
    area: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  businessLicense?: string;
  insuranceNumber?: string;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
}

export interface UpdateServiceProviderRequest {
  name?: string;
  company?: string;
  phoneNumber?: string;
  email?: string;
  serviceTypes?: string[];
  location?: {
    city: string;
    area: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  businessLicense?: string;
  insuranceNumber?: string;
  isActive?: boolean;
  workingHours?: {
    start: string;
    end: string;
    days: string[];
  };
}

export interface VerifyServiceProviderRequest {
  isVerified: boolean;
  verificationNotes?: string;
}

export interface ServiceProviderFilters {
  serviceType?: string;
  city?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface ServiceProvidersResponse {
  success: boolean;
  data: ServiceProvider[];
}

// Custom hook for vendors service
export function useVendorsService() {
  const fetchWithAuth = useFetchWithAuth();

  const getServiceProviders = useCallback(async (filters?: ServiceProviderFilters): Promise<ServiceProvidersResponse | null> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.serviceType) queryParams.append('serviceType', filters.serviceType);
      if (filters?.city) queryParams.append('city', filters.city);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters?.isVerified !== undefined) queryParams.append('isVerified', filters.isVerified.toString());

      const url = queryParams.toString() ? `${API_CONFIG.baseUrl}/service-providers?${queryParams}` : `${API_CONFIG.baseUrl}/service-providers`;
      
      const response = await fetchWithAuth(url, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch service providers');
      const data = await response.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching service providers:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getServiceProviderById = async (id: string): Promise<ServiceProvider | null> => {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/service-providers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service provider');
      }
      
      const data = await response.json();
      return data.data || data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching service provider:', e);
      throw e;
    }
  };

  const createServiceProvider = useCallback(async (providerData: CreateServiceProviderRequest): Promise<ServiceProvider | null> => {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/service-providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(providerData),
      });

      if (!response.ok) throw new Error('Failed to create service provider');
      const data = await response.json();
      return data.data || data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error creating service provider:', e);
      throw e;
    }
  }, [fetchWithAuth]);

  const updateServiceProvider = async (id: string, updateData: UpdateServiceProviderRequest): Promise<ServiceProvider> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/service-providers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service provider');
    }

    const data = await response.json();
    return data.data || data;
  };

  const verifyServiceProvider = async (id: string, verificationData: VerifyServiceProviderRequest): Promise<ServiceProvider> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/service-providers/${id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify service provider');
    }

    const data = await response.json();
    return data.data || data;
  };

  const deleteServiceProvider = async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/service-providers/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete service provider');
    }
  };

  const getProvidersByServiceType = async (serviceType: string): Promise<ServiceProvider[]> => {
    const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/service-providers/service-type/${serviceType}`);
    if (!response.ok) {
      throw new Error('Failed to fetch providers by service type');
    }
    
    const data = await response.json();
    return data.data || data;
  };

  return useMemo(() => ({
    getServiceProviders,
    getServiceProviderById,
    createServiceProvider,
    updateServiceProvider,
    verifyServiceProvider,
    deleteServiceProvider,
    getProvidersByServiceType,
  }), [getServiceProviders]);
}
