// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface Property {
  _id: string;
  title: string;
  description: string;
  address: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  landlordId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  images: {
    mainImage: string;
    gallery: string[];
    floorPlan?: string;
    virtualTour?: string;
  };
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertiesResponse {
  success: boolean;
  message: string;
  data: {
    properties: Property[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export function usePropertiesService() {
  const fetchWithAuth = useFetchWithAuth();

  const getProperties = useCallback(async (page: number = 1, limit: number = 10): Promise<PropertiesResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/properties?page=${page}&limit=${limit}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching properties:', e);
      return null;
    }
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getProperties,
  }), [getProperties]);
}
