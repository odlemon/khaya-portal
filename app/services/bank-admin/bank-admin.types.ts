// @ts-nocheck

export interface BankEscrowSummary {
  totalHeld?: number;
  pendingLandlordShareInEscrow?: number;
  [key: string]: unknown;
}

export interface BankPayoutPipelineStats {
  count?: number;
  sum?: number;
}

export interface BankLandlordPayoutsSummary {
  recordsAwaitingSettlement?: BankPayoutPipelineStats | Record<string, unknown>;
  settledOutsideSystemLifetime?: BankPayoutPipelineStats | Record<string, unknown>;
  /** Backend may send a number or an aggregate object (e.g. escrowTransactionCount). */
  distributedEscrowRowsAwaitingBankConfirmation?: number | Record<string, unknown>;
}

export interface BankAdminSummaryData {
  escrow?: BankEscrowSummary;
  landlordPayouts?: BankLandlordPayoutsSummary;
  notes?: string | Record<string, string>;
}

export interface HeldEscrowLandlord {
  landlordId?: string;
  landlord?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bankAccount?: string;
    bankName?: string;
    phone?: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bankAccount?: string;
    bankName?: string;
  };
  heldTransactionCount?: number;
  totalLandlordAmount?: number;
}

export type BankPayoutStatusFilter =
  | 'all'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BankLandlordRef {
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface BankPayoutListItem {
  payoutId?: string;
  _id?: string;
  amount?: number;
  status?: string;
  payoutMethod?: string;
  bankDetails?: Record<string, unknown> | null;
  mobileMoneyDetails?: Record<string, unknown> | null;
  landlord?: BankLandlordRef;
  escrowTransactionCount?: number;
  createdAt?: string;
  updatedAt?: string;
  processedAt?: string;
  externalReference?: string;
}

export interface BankEscrowLineInPayout {
  _id?: string;
  amount?: number;
  landlordAmount?: number;
  /** Escrow row status (same as escrowStatus per API). */
  status?: string;
  escrowStatus?: string;
  landlordPayoutStatus?: string;
  landlordPayoutDate?: string;
  /** Prefer for main column; set even when property is null (e.g. service lines). */
  propertyDisplayTitle?: string;
  propertyDisplaySubtitle?: string;
  propertyTitle?: string;
  address?: { city?: string; street?: string };
  paymentType?: string;
  [key: string]: unknown;
}

export interface BankPayoutDetail extends BankPayoutListItem {
  notes?: string;
  escrowTransactions?: BankEscrowLineInPayout[];
  transactions?: BankEscrowLineInPayout[];
}

export interface BankPayoutsListData {
  payouts: BankPayoutListItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface BankHeldEscrowData {
  items?: HeldEscrowLandlord[];
  landlords?: HeldEscrowLandlord[];
}

export interface MarkPayoutPaidData {
  emailSent?: boolean;
}

export interface MarkPayoutPaidResponse {
  success: boolean;
  message?: string;
  data?: MarkPayoutPaidData;
}
