export type Role = 'superadmin' | 'business_admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessId?: string;
  customerId?: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

/** Only the mock backend stores passwords; the API never returns them. */
export interface UserRecord extends User {
  password: string;
}

/** Login response body. The session itself travels in an HttpOnly cookie set by the server. */
export interface AuthResponse {
  user: User;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxQuotationsPerMonth: number;
  features: string[];
}

export type BusinessStatus = 'active' | 'trial' | 'suspended';

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  planId: string;
  status: BusinessStatus;
  currency: string;
  defaultTaxRate: number;
  quotePrefix: string;
  defaultTerms: string;
  createdAt: string;
}

/** A business plus the figures the super admin screens show next to it. */
export interface BusinessOverview extends Business {
  planName: string;
  adminName: string;
  adminEmail: string;
  customerCount: number;
  quotationCount: number;
}

/** Payload used when a super admin creates a business and its first admin. */
export interface CreateBusinessRequest extends Omit<Business, 'id' | 'createdAt'> {
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  description: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  active: boolean;
}

export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export interface QuotationItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface QuotationActivity {
  at: string;
  by: string;
  message: string;
}

export interface Quotation {
  id: string;
  number: string;
  businessId: string;
  customerId: string;
  title: string;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string;
  items: QuotationItem[];
  discountPercent: number;
  notes: string;
  terms: string;
  customerComment?: string;
  activity: QuotationActivity[];
  createdAt: string;
  updatedAt: string;
}

/** What the editor sends when creating or updating a quotation. */
export type QuotationInput = Pick<
  Quotation,
  'customerId' | 'title' | 'issueDate' | 'validUntil' | 'items' | 'discountPercent' | 'notes' | 'terms'
>;

/** A quotation with the related records the screens need, as the API returns it. */
export interface QuotationDetail extends Quotation {
  customer: Customer;
  business: Business;
}

export interface PlatformStats {
  businesses: number;
  activeBusinesses: number;
  trialBusinesses: number;
  suspendedBusinesses: number;
  users: number;
  quotations: number;
  monthlyRevenue: number;
  planBreakdown: { planId: string; planName: string; count: number }[];
  recentBusinesses: Business[];
}

export interface BusinessStats {
  totalQuotations: number;
  draft: number;
  awaiting: number;
  accepted: number;
  rejected: number;
  pipelineValue: number;
  wonValue: number;
  conversionRate: number;
  customers: number;
  products: number;
  recent: QuotationDetail[];
}

export interface CustomerStats {
  total: number;
  awaitingResponse: number;
  accepted: number;
  acceptedValue: number;
}

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];
