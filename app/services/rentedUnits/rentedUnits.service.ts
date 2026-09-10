import { API_CONFIG } from '@/app/config/api.config';
import { authenticatedFetchJson } from '@/app/lib/authenticatedFetch';

export interface RentedUnitParty {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface RentedUnit {
  rentalId: string;
  status: string;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  nextPaymentDue?: string;
  property: {
    id: string;
    title?: string;
    address?: Record<string, string> | string;
    status?: string;
  } | null;
  tenant: RentedUnitParty | null;
  landlord: RentedUnitParty | null;
  reminders: { total: number; lastSentAt: string | null };
}

export interface ReminderRow {
  kind: string;
  label: string;
  detail: string;
  sentAt: string;
  status: string;
  read: boolean | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  return authenticatedFetchJson<T>(url, { ...options, headers });
}

class RentedUnitsService {
  async listUnits(): Promise<RentedUnit[]> {
    const res = await fetchWithAuth<ApiEnvelope<RentedUnit[]>>(
      `${API_CONFIG.baseUrl}/admin/rented-units`
    );
    return res.data || [];
  }

  async listReminders(rentalId: string): Promise<ReminderRow[]> {
    const res = await fetchWithAuth<ApiEnvelope<ReminderRow[]>>(
      `${API_CONFIG.baseUrl}/admin/rented-units/${rentalId}/reminders`
    );
    return res.data || [];
  }

  /** Opens (or reuses) a support conversation and returns its chat id. */
  async startChat(userId: string, propertyId: string): Promise<string> {
    const res = await fetchWithAuth<ApiEnvelope<{ _id: string }>>(
      `${API_CONFIG.baseUrl}/chat/admin/start`,
      { method: 'POST', body: JSON.stringify({ userId, propertyId }) }
    );
    return res.data?._id;
  }
}

export const rentedUnitsService = new RentedUnitsService();
