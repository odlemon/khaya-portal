// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface DashboardMetrics {
  overview: {
    totalUsers: number;
    totalLandlords: number;
    totalTenants: number;
    totalProperties: number;
    totalAgreements: number;
    totalRentals: number;
    totalPayments: number;
    totalServices: number;
    totalConnections: number;
    totalChats: number;
    totalCommissions: number;
    totalDebts: number;
    collectedThisMonth: number;
    owedThisMonth: number;
  };
  recentActivity: {
    recentUsers: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    recentAgreements: Array<{
      _id: string;
      title: string;
      status: string;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      propertyId: {
        title: string;
      };
      createdAt: string;
    }>;
    recentPayments: Array<{
      _id: string;
      amount: number;
      status: string;
      paymentMethod: string;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      createdAt: string;
    }>;
    recentServices: Array<{
      _id: string;
      title: string;
      serviceType: string;
      status: string;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      createdAt: string;
    }>;
  };
  activeData: {
    activeRentals: Array<{
      _id: string;
      status: string;
      monthlyRent: number;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      propertyId: {
        title: string;
        address: {
          street: string;
          city: string;
        };
      };
    }>;
    pendingConnections: Array<{
      _id: string;
      status: string;
      tenantId: {
        firstName: string;
        lastName: string;
      };
      landlordId: {
        firstName: string;
        lastName: string;
      };
      propertyId: {
        title: string;
      };
      createdAt: string;
    }>;
    overduePayments: Array<{
      _id: string;
      amount: number;
      dueDate: string;
      daysLate: number;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      propertyId: {
        title: string;
      };
    }>;
    pendingServices: Array<{
      _id: string;
      title: string;
      serviceType: string;
      status: string;
      urgency: string;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      propertyId: {
        title: string;
      };
    }>;
    completedServices: Array<{
      _id: string;
      title: string;
      serviceType: string;
      status: string;
      completedDate: string;
      landlordId: {
        firstName: string;
        lastName: string;
      };
      tenantId: {
        firstName: string;
        lastName: string;
      };
      propertyId: {
        title: string;
      };
    }>;
  };
  financial: {
    totalRevenue: number;
    monthlyRevenue: number;
    commissionSummary: {
      totalEarnings: number;
      totalDebts: number;
      collectedThisMonth: number;
      owedThisMonth: number;
      topLandlords: Array<{
        landlordId: string;
        name: string;
        totalEarnings: number;
      }>;
    };
    commissionRate: number;
    averageCommissionPerTransaction: number;
    debtCollectionRate: number;
  };
  analytics: {
    userGrowth: Array<{
      _id: { year: number; month: number };
      count: number;
      landlords: number;
      tenants: number;
    }>;
    agreementStats: {
      byStatus: {
        draft: number;
        pending: number;
        signed: number;
        active: number;
        expired: number;
        terminated: number;
      };
      total: number;
    };
    paymentStats: {
      byStatus: {
        pending: { count: number; totalAmount: number };
        paid: { count: number; totalAmount: number };
        verified: { count: number; totalAmount: number };
        overdue: { count: number; totalAmount: number };
      };
      total: number;
    };
    serviceStats: {
      byStatus: {
        pending_landlord_approval: number;
        approved: number;
        scheduled: number;
        in_progress: number;
        completed: number;
      };
      total: number;
    };
  };
  charts: {
    revenueChart: Array<{
      month: string;
      revenue: number;
      transactions: number;
      averageTransaction: number;
    }>;
    commissionChart: Array<{
      month: string;
      totalRevenue: number;
      onlineRevenue: number;
      cashRevenue: number;
      onlineCommission: number;
      cashCommission: number;
      totalCommission: number;
    }>;
    userGrowthChart: Array<{
      month: string;
      totalUsers: number;
      landlords: number;
      tenants: number;
    }>;
    paymentMethodChart: Array<{
      method: string;
      count: number;
      totalAmount: number;
      averageAmount: number;
      commission: number;
    }>;
    serviceTypeChart: Array<{
      serviceType: string;
      count: number;
      totalCost: number;
      averageCost: number;
    }>;
    monthlyTrends: {
      userGrowth: Array<{
        month: string;
        newUsers: number;
      }>;
      revenueGrowth: Array<{
        month: string;
        revenue: number;
        transactions: number;
      }>;
      serviceGrowth: Array<{
        month: string;
        totalServices: number;
        completedServices: number;
      }>;
    };
  };
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardMetrics;
}

export interface ReportResponseMeta {
  section: string;
  range?: { startDate?: string; endDate?: string };
  groupBy?: string;
  generatedAt?: string;
}

export interface ReportResponse {
  success: boolean;
  meta: ReportResponseMeta;
  kpis: Record<string, number | string | boolean>;
  series: Array<Record<string, unknown>>;
  tables: Record<string, Array<Record<string, unknown>>>;
}

export function useDashboardService() {
  const fetchWithAuth = useFetchWithAuth();

  const getDashboardMetrics = useCallback(async (): Promise<DashboardResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/dashboard/metrics`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      const data = await res.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching dashboard metrics:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getAdminReport = useCallback(async (): Promise<ReportResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/reports`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch admin report');
      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching admin report:', e);
      return null;
    }
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getDashboardMetrics,
    getAdminReport,
  }), [getDashboardMetrics, getAdminReport]);
}
