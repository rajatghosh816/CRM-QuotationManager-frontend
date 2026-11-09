/**
 * Test-only builders for model objects and service mocks, shared by the
 * component specs. Each builder returns a complete, valid object; pass
 * overrides for the fields a test cares about.
 */
import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import {
  Business,
  BusinessOverview,
  BusinessStats,
  Customer,
  CustomerStats,
  Plan,
  PlatformStats,
  Product,
  QuotationDetail,
  User,
} from '../app/core/models';
import { AdminApiService } from '../app/core/services/admin-api.service';
import { AuthService } from '../app/core/services/auth.service';
import { BusinessApiService } from '../app/core/services/business-api.service';
import { PortalApiService } from '../app/core/services/portal-api.service';
import { ToastService } from '../app/core/services/toast.service';

export function makeUser(o: Partial<User> = {}): User {
  return { id: 'u1', name: 'Jane Doe', email: 'jane@test.dev', role: 'customer', status: 'active', createdAt: '2026-01-01', ...o };
}

export function makePlan(o: Partial<Plan> = {}): Plan {
  return { id: 'plan-pro', name: 'Pro', priceMonthly: 49, maxUsers: 5, maxQuotationsPerMonth: 200, features: ['Feature A', 'Feature B'], ...o };
}

export function makeBusiness(o: Partial<Business> = {}): Business {
  return {
    id: 'b1',
    name: 'Acme Corp',
    email: 'sales@acme.test',
    phone: '+1 555 0100',
    address: '1 Main St',
    industry: 'Interiors',
    planId: 'plan-pro',
    status: 'active',
    currency: 'USD',
    defaultTaxRate: 18,
    quotePrefix: 'ACM',
    defaultTerms: 'Payment within 30 days.',
    createdAt: '2026-01-01',
    ...o,
  };
}

export function makeBusinessOverview(o: Partial<BusinessOverview> = {}): BusinessOverview {
  return {
    ...makeBusiness(),
    planName: 'Pro',
    adminName: 'Alex Admin',
    adminEmail: 'admin@acme.test',
    customerCount: 3,
    quotationCount: 7,
    ...o,
  };
}

export function makeCustomer(o: Partial<Customer> = {}): Customer {
  return {
    id: 'c1',
    businessId: 'b1',
    name: 'John Carter',
    company: 'Carter Homes',
    email: 'john@carter.test',
    phone: '+1 555 0111',
    address: '4 Lake Road',
    createdAt: '2026-01-01',
    ...o,
  };
}

export function makeProduct(o: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    businessId: 'b1',
    name: 'Oak Table',
    sku: 'OAK-1',
    description: 'Solid oak dining table',
    unit: 'pc',
    unitPrice: 500,
    taxRate: 18,
    active: true,
    ...o,
  };
}

export function makeQuotation(o: Partial<QuotationDetail> = {}): QuotationDetail {
  return {
    id: 'q1',
    number: 'ACM-0001',
    businessId: 'b1',
    customerId: 'c1',
    title: 'Living room fit-out',
    status: 'draft',
    issueDate: '2026-01-01',
    validUntil: '2026-02-01',
    items: [{ description: 'Oak Table', quantity: 2, unitPrice: 500, taxRate: 10 }],
    discountPercent: 0,
    notes: 'Some notes',
    terms: 'Some terms',
    activity: [{ at: '2026-01-01T10:00:00Z', by: 'Alex Admin', message: 'Created' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    customer: makeCustomer(),
    business: makeBusiness(),
    ...o,
  };
}

export function makeCustomerStats(o: Partial<CustomerStats> = {}): CustomerStats {
  return { total: 5, awaitingResponse: 2, accepted: 1, acceptedValue: 1234, ...o };
}

export function makeBusinessStats(o: Partial<BusinessStats> = {}): BusinessStats {
  return {
    totalQuotations: 10,
    draft: 2,
    awaiting: 3,
    accepted: 4,
    rejected: 1,
    pipelineValue: 5000,
    wonValue: 8000,
    conversionRate: 80,
    customers: 6,
    products: 12,
    recent: [],
    ...o,
  };
}

export function makePlatformStats(o: Partial<PlatformStats> = {}): PlatformStats {
  return {
    businesses: 4,
    activeBusinesses: 2,
    trialBusinesses: 1,
    suspendedBusinesses: 1,
    users: 20,
    quotations: 40,
    monthlyRevenue: 196,
    planBreakdown: [{ planId: 'plan-pro', planName: 'Pro', count: 4 }],
    recentBusinesses: [makeBusiness()],
    ...o,
  };
}

/** An HTTP error whose body carries `message`, as the API sends it. */
export function httpError(message: string, status = 400): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { message } });
}

export type Spied<T> = jasmine.SpyObj<T>;

export function toastSpy(): Spied<ToastService> {
  return jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'dismiss'], { toasts: signal([]) });
}

export interface AuthMock {
  user: WritableSignal<User | null>;
  login: jasmine.Spy;
  logout: jasmine.Spy;
  refreshUser: jasmine.Spy;
  changePassword: jasmine.Spy;
  homeUrl: jasmine.Spy;
}

/** A stand-in for AuthService whose `user` signal a test can set. */
export function authMock(user: User | null = makeUser()): AuthMock {
  return {
    user: signal(user),
    login: jasmine.createSpy('login'),
    logout: jasmine.createSpy('logout'),
    refreshUser: jasmine.createSpy('refreshUser'),
    changePassword: jasmine.createSpy('changePassword'),
    homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/portal'),
  };
}

export const provideAuth = (mock: AuthMock) => ({ provide: AuthService, useValue: mock });

export function portalApiSpy(): Spied<PortalApiService> {
  return jasmine.createSpyObj<PortalApiService>('PortalApiService', [
    'stats',
    'business',
    'quotations',
    'quotation',
    'accept',
    'reject',
    'profile',
    'updateProfile',
  ]);
}

export function businessApiSpy(): Spied<BusinessApiService> {
  return jasmine.createSpyObj<BusinessApiService>('BusinessApiService', [
    'stats',
    'profile',
    'updateProfile',
    'customers',
    'customer',
    'createCustomer',
    'updateCustomer',
    'deleteCustomer',
    'products',
    'createProduct',
    'updateProduct',
    'deleteProduct',
    'quotations',
    'quotation',
    'createQuotation',
    'updateQuotation',
    'sendQuotation',
    'duplicateQuotation',
    'deleteQuotation',
  ]);
}

export function adminApiSpy(): Spied<AdminApiService> {
  return jasmine.createSpyObj<AdminApiService>('AdminApiService', [
    'stats',
    'businesses',
    'business',
    'createBusiness',
    'updateBusiness',
    'deleteBusiness',
    'plans',
    'createPlan',
    'updatePlan',
    'deletePlan',
    'users',
    'setUserStatus',
  ]);
}

/** Text content of the fixture root with whitespace collapsed, for `toContain` checks. */
export function textOf(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Runs change detection until template-driven forms have finished updating. */
export async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** Sets an input/textarea/select value the way a user would and lets the form update. */
export async function typeInto(
  fixture: { nativeElement: HTMLElement; detectChanges(): void; whenStable(): Promise<unknown> },
  selector: string,
  value: string,
): Promise<void> {
  const el = fixture.nativeElement.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
  if (!el) throw new Error(`No element matches ${selector}`);
  el.value = value;
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'));
  await settle(fixture);
}

/** Finds a button by its visible text. */
export function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const btn = Array.from(root.querySelectorAll('button')).find((b) => (b.textContent ?? '').trim().includes(text));
  if (!btn) throw new Error(`No button with text "${text}"`);
  return btn;
}
