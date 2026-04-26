// @ts-nocheck

export type InsurancePhase = 'in_force' | 'awaiting_signature' | 'ended';

export type InsurancePoliciesStatusParam = 'all' | 'in_force' | 'awaiting_signature' | 'ended';

export interface InsuranceSummaryRules {
  coverStartsAt: string;
  policyScope: string;
  policyholder: string;
}

export interface InsuranceSummaryData {
  totalPropertiesWithInsurance: number;
  inForce: number;
  awaitingSignature: number;
  ended: number;
  rules: InsuranceSummaryRules;
}

export interface InsuranceAddress {
  street?: string;
  city?: string;
  area?: string | null;
  state?: string | null;
  country?: string;
}

export interface InsurancePolicyholder {
  type: string;
  description: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  isVerified?: boolean;
  documentVerificationStatus?: string;
}

export interface InsuranceAgreementTenant {
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
}

export interface InsurancePolicyAgreement {
  agreementId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  depositAmount?: number;
  signedAt?: string | null;
  tenant?: InsuranceAgreementTenant;
}

export interface InsurancePolicyListItem {
  propertyId: string;
  propertyTitle: string;
  propertyStatus?: string;
  address?: InsuranceAddress;
  propertyType?: string;
  furnishingLevel?: string;
  phase: InsurancePhase;
  coverStartDate?: string | null;
  insurance?: {
    enabled?: boolean;
    coverageType?: string;
    pricingModel?: string;
    monthlyPremium?: number;
    riskCategory?: string;
    propertyValue?: number;
  };
  policyholder?: InsurancePolicyholder;
  agreement?: InsurancePolicyAgreement | null;
}

export interface InsurancePoliciesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InsurancePoliciesData {
  policies: InsurancePolicyListItem[];
  pagination: InsurancePoliciesPagination;
}

export interface InsurancePolicyDetail extends InsurancePolicyListItem {
  /** Strings, or API objects like { startsWhen, policyholder } — normalize in UI before rendering */
  coverRules?: string | string[] | unknown;
  primaryAgreement?: InsurancePolicyAgreement & {
    landlordSignedAt?: string | null;
    tenantSignedAt?: string | null;
  };
  agreementHistory?: Array<
    InsurancePolicyAgreement & {
      agreementId?: string;
      _id?: string;
      updatedAt?: string;
      landlordSignedAt?: string | null;
      tenantSignedAt?: string | null;
    }
  >;
}
