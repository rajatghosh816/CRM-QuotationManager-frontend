import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';
import {
  Business,
  BusinessOverview,
  BusinessStats,
  CreateBusinessRequest,
  Customer,
  CustomerStats,
  Plan,
  PlatformStats,
  Product,
  Quotation,
  QuotationDetail,
  QuotationInput,
  QuotationStatus,
  Role,
  User,
  UserRecord,
} from '../models';
import { quotationTotals } from '../quotation-math';
import { mockDb, newId } from './mock-db';

/*
 * Fake REST backend. Every request to /api/** is answered here from the
 * in-memory mock database, so the services and components are written exactly
 * as they will be against the real server. To switch to the real backend,
 * remove `mockBackendInterceptor` from app.config.ts.
 */

const LATENCY_MS = 250;
const TOKEN_PREFIX = 'mock.';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface Ctx {
  req: HttpRequest<unknown>;
  params: Record<string, string>;
  body: any;
  user: UserRecord | null;
}

type Handler = (ctx: Ctx) => unknown;

interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler): void {
  const keys: string[] = [];
  const pattern = path.replace(/:(\w+)/g, (_, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  routes.push({ method, regex: new RegExp(`^${pattern}$`), keys, handler });
}

// ---------- helpers ----------

const db = () => mockDb.data;
const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);

function publicUser(u: UserRecord): User {
  const { password: _password, ...rest } = u;
  return rest;
}

function requireRole(ctx: Ctx, role: Role): UserRecord {
  if (!ctx.user) throw new ApiError(401, 'Please sign in again.');
  if (ctx.user.role !== role) throw new ApiError(403, 'You do not have access to this area.');
  return ctx.user;
}

function find<T extends { id: string }>(list: T[], id: string, what: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new ApiError(404, `${what} not found.`);
  return item;
}

function ensureEmailFree(email: string, exceptUserId?: string): void {
  const taken = db().users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== exceptUserId);
  if (taken) throw new ApiError(409, `The email ${email} is already in use.`);
}

function required(body: any, fields: string[]): void {
  const missing = fields.filter((f) => body?.[f] === undefined || body?.[f] === null || `${body[f]}`.trim() === '');
  if (missing.length) throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}.`);
}

/** Sent/viewed quotations past their validity date become expired. */
function expireOverdue(): void {
  let changed = false;
  for (const q of db().quotations) {
    if ((q.status === 'sent' || q.status === 'viewed') && q.validUntil < today()) {
      q.status = 'expired';
      q.activity.push({ at: nowIso(), by: 'System', message: 'Quotation expired' });
      changed = true;
    }
  }
  if (changed) mockDb.save();
}

function toDetail(q: Quotation): QuotationDetail {
  return {
    ...q,
    customer: find(db().customers, q.customerId, 'Customer'),
    business: find(db().businesses, q.businessId, 'Business'),
  };
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

function quoteTotal(q: Quotation): number {
  return quotationTotals(q.items, q.discountPercent).total;
}

function overview(b: Business): BusinessOverview {
  const admin = db().users.find((u) => u.role === 'business_admin' && u.businessId === b.id);
  return {
    ...b,
    planName: db().plans.find((p) => p.id === b.planId)?.name ?? '—',
    adminName: admin?.name ?? '—',
    adminEmail: admin?.email ?? '—',
    customerCount: db().customers.filter((c) => c.businessId === b.id).length,
    quotationCount: db().quotations.filter((q) => q.businessId === b.id).length,
  };
}

function businessOf(user: UserRecord): Business {
  return find(db().businesses, user.businessId!, 'Business');
}

function ownQuotation(user: UserRecord, id: string): Quotation {
  const q = find(db().quotations, id, 'Quotation');
  if (q.businessId !== user.businessId) throw new ApiError(404, 'Quotation not found.');
  return q;
}

function ownCustomer(user: UserRecord, id: string): Customer {
  const c = find(db().customers, id, 'Customer');
  if (c.businessId !== user.businessId) throw new ApiError(404, 'Customer not found.');
  return c;
}

function ownProduct(user: UserRecord, id: string): Product {
  const p = find(db().products, id, 'Product');
  if (p.businessId !== user.businessId) throw new ApiError(404, 'Product not found.');
  return p;
}

function nextQuoteNumber(b: Business): string {
  const nums = db()
    .quotations.filter((q) => q.businessId === b.id)
    .map((q) => parseInt(q.number.split('-').pop() ?? '0', 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${b.quotePrefix}-${String(next).padStart(4, '0')}`;
}

function validateQuotation(user: UserRecord, body: QuotationInput): void {
  required(body, ['customerId', 'title', 'issueDate', 'validUntil']);
  ownCustomer(user, body.customerId);
  if (!Array.isArray(body.items) || body.items.length === 0) throw new ApiError(400, 'Add at least one line item.');
  if (body.items.some((i) => !i.description?.trim() || !(i.quantity > 0) || i.unitPrice < 0))
    throw new ApiError(400, 'Every line item needs a description, a quantity above 0 and a price.');
  if (body.validUntil < body.issueDate) throw new ApiError(400, 'Valid-until date must be after the issue date.');
}

function pickQuotationInput(body: QuotationInput): QuotationInput {
  return {
    customerId: body.customerId,
    title: body.title.trim(),
    issueDate: body.issueDate,
    validUntil: body.validUntil,
    items: body.items.map((i) => ({
      productId: i.productId || undefined,
      description: i.description.trim(),
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      taxRate: Number(i.taxRate) || 0,
    })),
    discountPercent: Number(body.discountPercent) || 0,
    notes: body.notes ?? '',
    terms: body.terms ?? '',
  };
}

function markSent(q: Quotation, by: string): void {
  q.status = 'sent';
  q.customerComment = undefined;
  q.updatedAt = nowIso();
  q.activity.push({ at: q.updatedAt, by, message: 'Sent to customer' });
}

// ---------- auth ----------

route('POST', '/api/auth/login', ({ body }) => {
  required(body, ['email', 'password']);
  const user = db().users.find((u) => u.email.toLowerCase() === String(body.email).trim().toLowerCase());
  if (!user || user.password !== body.password) throw new ApiError(401, 'Incorrect email or password.');
  if (user.status !== 'active') throw new ApiError(403, 'This account has been disabled. Contact your administrator.');
  if (user.businessId && businessOf(user).status === 'suspended')
    throw new ApiError(403, 'This business account is suspended. Contact the platform administrator.');
  return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
});

route('GET', '/api/auth/me', ({ user }) => {
  if (!user) throw new ApiError(401, 'Please sign in again.');
  return publicUser(user);
});

route('PUT', '/api/auth/password', ({ user, body }) => {
  if (!user) throw new ApiError(401, 'Please sign in again.');
  required(body, ['currentPassword', 'newPassword']);
  if (user.password !== body.currentPassword) throw new ApiError(400, 'Current password is incorrect.');
  if (String(body.newPassword).length < 6) throw new ApiError(400, 'New password must be at least 6 characters.');
  user.password = body.newPassword;
  return { ok: true };
});

// ---------- super admin ----------

route('GET', '/api/admin/stats', (ctx): PlatformStats => {
  requireRole(ctx, 'superadmin');
  const { businesses, plans, users, quotations } = db();
  const billable = businesses.filter((b) => b.status === 'active');
  return {
    businesses: businesses.length,
    activeBusinesses: billable.length,
    trialBusinesses: businesses.filter((b) => b.status === 'trial').length,
    suspendedBusinesses: businesses.filter((b) => b.status === 'suspended').length,
    users: users.length,
    quotations: quotations.length,
    monthlyRevenue: billable.reduce((sum, b) => sum + (plans.find((p) => p.id === b.planId)?.priceMonthly ?? 0), 0),
    planBreakdown: plans.map((p) => ({
      planId: p.id,
      planName: p.name,
      count: businesses.filter((b) => b.planId === p.id).length,
    })),
    recentBusinesses: [...businesses].sort(byNewest).slice(0, 5),
  };
});

route('GET', '/api/admin/businesses', (ctx) => {
  requireRole(ctx, 'superadmin');
  return [...db().businesses].sort(byNewest).map(overview);
});

route('GET', '/api/admin/businesses/:id', (ctx) => {
  requireRole(ctx, 'superadmin');
  return overview(find(db().businesses, ctx.params['id'], 'Business'));
});

route('POST', '/api/admin/businesses', (ctx) => {
  requireRole(ctx, 'superadmin');
  const body = ctx.body as CreateBusinessRequest;
  required(body, ['name', 'email', 'planId', 'currency', 'quotePrefix', 'adminName', 'adminEmail', 'adminPassword']);
  find(db().plans, body.planId, 'Plan');
  ensureEmailFree(body.adminEmail);
  const { adminName, adminEmail, adminPassword, ...fields } = body;
  const business: Business = { ...fields, id: newId('biz'), quotePrefix: fields.quotePrefix.toUpperCase(), createdAt: nowIso() };
  db().businesses.push(business);
  db().users.push({
    id: newId('usr'),
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'business_admin',
    businessId: business.id,
    status: 'active',
    createdAt: nowIso(),
  });
  return overview(business);
});

route('PUT', '/api/admin/businesses/:id', (ctx) => {
  requireRole(ctx, 'superadmin');
  const business = find(db().businesses, ctx.params['id'], 'Business');
  required(ctx.body, ['name', 'email', 'planId', 'currency', 'quotePrefix']);
  find(db().plans, ctx.body.planId, 'Plan');
  const { id: _id, createdAt: _c, ...changes } = ctx.body as Business;
  Object.assign(business, changes, { quotePrefix: changes.quotePrefix.toUpperCase() });
  return overview(business);
});

route('DELETE', '/api/admin/businesses/:id', (ctx) => {
  requireRole(ctx, 'superadmin');
  const id = find(db().businesses, ctx.params['id'], 'Business').id;
  const d = db();
  d.businesses = d.businesses.filter((b) => b.id !== id);
  d.customers = d.customers.filter((c) => c.businessId !== id);
  d.products = d.products.filter((p) => p.businessId !== id);
  d.quotations = d.quotations.filter((q) => q.businessId !== id);
  d.users = d.users.filter((u) => u.businessId !== id);
  return { ok: true };
});

route('GET', '/api/admin/plans', (ctx) => {
  requireRole(ctx, 'superadmin');
  return db().plans;
});

route('POST', '/api/admin/plans', (ctx) => {
  requireRole(ctx, 'superadmin');
  required(ctx.body, ['name', 'priceMonthly']);
  const plan: Plan = { ...(ctx.body as Plan), id: newId('plan') };
  db().plans.push(plan);
  return plan;
});

route('PUT', '/api/admin/plans/:id', (ctx) => {
  requireRole(ctx, 'superadmin');
  const plan = find(db().plans, ctx.params['id'], 'Plan');
  required(ctx.body, ['name', 'priceMonthly']);
  Object.assign(plan, ctx.body, { id: plan.id });
  return plan;
});

route('DELETE', '/api/admin/plans/:id', (ctx) => {
  requireRole(ctx, 'superadmin');
  const plan = find(db().plans, ctx.params['id'], 'Plan');
  const inUse = db().businesses.filter((b) => b.planId === plan.id).length;
  if (inUse) throw new ApiError(409, `${inUse} business(es) are on this plan. Move them to another plan first.`);
  db().plans = db().plans.filter((p) => p.id !== plan.id);
  return { ok: true };
});

route('GET', '/api/admin/users', (ctx) => {
  requireRole(ctx, 'superadmin');
  return [...db().users].sort(byNewest).map(publicUser);
});

route('PATCH', '/api/admin/users/:id', (ctx) => {
  const me = requireRole(ctx, 'superadmin');
  const user = find(db().users, ctx.params['id'], 'User');
  if (user.id === me.id) throw new ApiError(400, 'You cannot disable your own account.');
  if (ctx.body?.status) user.status = ctx.body.status;
  return publicUser(user);
});

// ---------- business admin ----------

route('GET', '/api/business/stats', (ctx): BusinessStats => {
  const me = requireRole(ctx, 'business_admin');
  const quotes = db().quotations.filter((q) => q.businessId === me.businessId);
  const awaiting = quotes.filter((q) => q.status === 'sent' || q.status === 'viewed');
  const accepted = quotes.filter((q) => q.status === 'accepted');
  const rejected = quotes.filter((q) => q.status === 'rejected');
  const decided = accepted.length + rejected.length;
  return {
    totalQuotations: quotes.length,
    draft: quotes.filter((q) => q.status === 'draft').length,
    awaiting: awaiting.length,
    accepted: accepted.length,
    rejected: rejected.length,
    pipelineValue: awaiting.reduce((s, q) => s + quoteTotal(q), 0),
    wonValue: accepted.reduce((s, q) => s + quoteTotal(q), 0),
    conversionRate: decided ? Math.round((accepted.length / decided) * 100) : 0,
    customers: db().customers.filter((c) => c.businessId === me.businessId).length,
    products: db().products.filter((p) => p.businessId === me.businessId).length,
    recent: [...quotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6).map(toDetail),
  };
});

route('GET', '/api/business/profile', (ctx) => businessOf(requireRole(ctx, 'business_admin')));

route('PUT', '/api/business/profile', (ctx) => {
  const business = businessOf(requireRole(ctx, 'business_admin'));
  required(ctx.body, ['name', 'email', 'currency', 'quotePrefix']);
  // Plan and status are controlled by the super admin only.
  const { name, email, phone, address, industry, currency, defaultTaxRate, quotePrefix, defaultTerms } = ctx.body as Business;
  Object.assign(business, {
    name, email, phone, address, industry, currency, defaultTerms,
    defaultTaxRate: Number(defaultTaxRate) || 0,
    quotePrefix: quotePrefix.toUpperCase(),
  });
  return business;
});

route('GET', '/api/business/customers', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  return db().customers.filter((c) => c.businessId === me.businessId).sort((a, b) => a.name.localeCompare(b.name));
});

route('GET', '/api/business/customers/:id', (ctx) => ownCustomer(requireRole(ctx, 'business_admin'), ctx.params['id']));

route('POST', '/api/business/customers', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  required(ctx.body, ['name', 'email']);
  ensureEmailFree(ctx.body.email);
  const customer: Customer = { ...(ctx.body as Customer), id: newId('cus'), businessId: me.businessId!, createdAt: nowIso() };
  db().customers.push(customer);
  // Every customer gets a portal login. The real backend would email an invite.
  db().users.push({
    id: newId('usr'),
    name: customer.name,
    email: customer.email,
    password: 'customer123',
    role: 'customer',
    businessId: me.businessId,
    customerId: customer.id,
    status: 'active',
    createdAt: nowIso(),
  });
  return customer;
});

route('PUT', '/api/business/customers/:id', (ctx) => {
  const customer = ownCustomer(requireRole(ctx, 'business_admin'), ctx.params['id']);
  required(ctx.body, ['name', 'email']);
  const login = db().users.find((u) => u.customerId === customer.id);
  ensureEmailFree(ctx.body.email, login?.id);
  const { name, company, email, phone, address } = ctx.body as Customer;
  Object.assign(customer, { name, company, email, phone, address });
  if (login) Object.assign(login, { name, email });
  return customer;
});

route('DELETE', '/api/business/customers/:id', (ctx) => {
  const customer = ownCustomer(requireRole(ctx, 'business_admin'), ctx.params['id']);
  if (db().quotations.some((q) => q.customerId === customer.id))
    throw new ApiError(409, 'This customer has quotations. Delete those first.');
  db().customers = db().customers.filter((c) => c.id !== customer.id);
  db().users = db().users.filter((u) => u.customerId !== customer.id);
  return { ok: true };
});

route('GET', '/api/business/products', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  return db().products.filter((p) => p.businessId === me.businessId).sort((a, b) => a.name.localeCompare(b.name));
});

route('POST', '/api/business/products', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  required(ctx.body, ['name', 'unitPrice']);
  const product: Product = { ...(ctx.body as Product), id: newId('prd'), businessId: me.businessId! };
  db().products.push(product);
  return product;
});

route('PUT', '/api/business/products/:id', (ctx) => {
  const product = ownProduct(requireRole(ctx, 'business_admin'), ctx.params['id']);
  required(ctx.body, ['name', 'unitPrice']);
  Object.assign(product, ctx.body, { id: product.id, businessId: product.businessId });
  return product;
});

route('DELETE', '/api/business/products/:id', (ctx) => {
  const product = ownProduct(requireRole(ctx, 'business_admin'), ctx.params['id']);
  db().products = db().products.filter((p) => p.id !== product.id);
  return { ok: true };
});

route('GET', '/api/business/quotations', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  return db().quotations.filter((q) => q.businessId === me.businessId).sort(byNewest).map(toDetail);
});

route('GET', '/api/business/quotations/:id', (ctx) =>
  toDetail(ownQuotation(requireRole(ctx, 'business_admin'), ctx.params['id'])),
);

route('POST', '/api/business/quotations', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  const body = ctx.body as QuotationInput & { send?: boolean };
  validateQuotation(me, body);
  const business = businessOf(me);
  const at = nowIso();
  const q: Quotation = {
    ...pickQuotationInput(body),
    id: newId('quo'),
    number: nextQuoteNumber(business),
    businessId: business.id,
    status: 'draft',
    activity: [{ at, by: me.name, message: 'Quotation created' }],
    createdAt: at,
    updatedAt: at,
  };
  if (body.send) markSent(q, me.name);
  db().quotations.push(q);
  return toDetail(q);
});

route('PUT', '/api/business/quotations/:id', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  const q = ownQuotation(me, ctx.params['id']);
  if (q.status === 'accepted') throw new ApiError(409, 'Accepted quotations cannot be edited. Duplicate it instead.');
  const body = ctx.body as QuotationInput & { send?: boolean };
  validateQuotation(me, body);
  Object.assign(q, pickQuotationInput(body), { updatedAt: nowIso() });
  q.activity.push({ at: q.updatedAt, by: me.name, message: 'Quotation edited' });
  if (body.send) markSent(q, me.name);
  else if (q.status !== 'draft') {
    // A changed quotation must be re-sent before the customer can respond again.
    q.status = 'draft';
    q.activity.push({ at: q.updatedAt, by: me.name, message: 'Moved back to draft after editing' });
  }
  return toDetail(q);
});

route('POST', '/api/business/quotations/:id/send', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  const q = ownQuotation(me, ctx.params['id']);
  if (q.status === 'accepted') throw new ApiError(409, 'This quotation is already accepted.');
  if (q.validUntil < today()) throw new ApiError(400, 'The valid-until date has passed. Edit the quotation to extend it first.');
  markSent(q, me.name);
  return toDetail(q);
});

route('POST', '/api/business/quotations/:id/duplicate', (ctx) => {
  const me = requireRole(ctx, 'business_admin');
  const source = ownQuotation(me, ctx.params['id']);
  const business = businessOf(me);
  const at = nowIso();
  const validDays = Math.max(
    1,
    Math.round((new Date(source.validUntil).getTime() - new Date(source.issueDate).getTime()) / 86_400_000),
  );
  const valid = new Date();
  valid.setDate(valid.getDate() + validDays);
  const copy: Quotation = {
    ...structuredClone(source),
    id: newId('quo'),
    number: nextQuoteNumber(business),
    title: `${source.title} (copy)`,
    status: 'draft',
    issueDate: today(),
    validUntil: valid.toISOString().slice(0, 10),
    customerComment: undefined,
    activity: [{ at, by: me.name, message: `Duplicated from ${source.number}` }],
    createdAt: at,
    updatedAt: at,
  };
  db().quotations.push(copy);
  return toDetail(copy);
});

route('DELETE', '/api/business/quotations/:id', (ctx) => {
  const q = ownQuotation(requireRole(ctx, 'business_admin'), ctx.params['id']);
  db().quotations = db().quotations.filter((x) => x.id !== q.id);
  return { ok: true };
});

// ---------- customer portal ----------

const VISIBLE_TO_CUSTOMER: QuotationStatus[] = ['sent', 'viewed', 'accepted', 'rejected', 'expired'];

function portalQuotation(user: UserRecord, id: string): Quotation {
  const q = find(db().quotations, id, 'Quotation');
  if (q.customerId !== user.customerId || !VISIBLE_TO_CUSTOMER.includes(q.status))
    throw new ApiError(404, 'Quotation not found.');
  return q;
}

function respond(ctx: Ctx, status: 'accepted' | 'rejected'): QuotationDetail {
  const me = requireRole(ctx, 'customer');
  const q = portalQuotation(me, ctx.params['id']);
  if (q.status !== 'sent' && q.status !== 'viewed') throw new ApiError(409, `This quotation is already ${q.status}.`);
  const comment = String(ctx.body?.comment ?? '').trim();
  if (status === 'rejected' && !comment) throw new ApiError(400, 'Please tell the business why you are declining.');
  q.status = status;
  q.customerComment = comment || undefined;
  q.updatedAt = nowIso();
  q.activity.push({
    at: q.updatedAt,
    by: me.name,
    message: `${status === 'accepted' ? 'Accepted' : 'Rejected'} by customer${comment ? `: “${comment}”` : ''}`,
  });
  return toDetail(q);
}

route('GET', '/api/portal/stats', (ctx): CustomerStats => {
  const me = requireRole(ctx, 'customer');
  const quotes = db().quotations.filter((q) => q.customerId === me.customerId && VISIBLE_TO_CUSTOMER.includes(q.status));
  const accepted = quotes.filter((q) => q.status === 'accepted');
  return {
    total: quotes.length,
    awaitingResponse: quotes.filter((q) => q.status === 'sent' || q.status === 'viewed').length,
    accepted: accepted.length,
    acceptedValue: accepted.reduce((s, q) => s + quoteTotal(q), 0),
  };
});

route('GET', '/api/portal/quotations', (ctx) => {
  const me = requireRole(ctx, 'customer');
  return db()
    .quotations.filter((q) => q.customerId === me.customerId && VISIBLE_TO_CUSTOMER.includes(q.status))
    .sort(byNewest)
    .map(toDetail);
});

route('GET', '/api/portal/quotations/:id', (ctx) => {
  const me = requireRole(ctx, 'customer');
  const q = portalQuotation(me, ctx.params['id']);
  if (q.status === 'sent') {
    q.status = 'viewed';
    q.updatedAt = nowIso();
    q.activity.push({ at: q.updatedAt, by: me.name, message: 'Viewed by customer' });
  }
  return toDetail(q);
});

route('POST', '/api/portal/quotations/:id/accept', (ctx) => respond(ctx, 'accepted'));
route('POST', '/api/portal/quotations/:id/reject', (ctx) => respond(ctx, 'rejected'));

route('GET', '/api/portal/profile', (ctx) => {
  const me = requireRole(ctx, 'customer');
  return find(db().customers, me.customerId!, 'Customer');
});

route('PUT', '/api/portal/profile', (ctx) => {
  const me = requireRole(ctx, 'customer');
  const customer = find(db().customers, me.customerId!, 'Customer');
  required(ctx.body, ['name']);
  // Customers can't change their login email here; the business manages that.
  const { name, company, phone, address } = ctx.body as Customer;
  Object.assign(customer, { name, company, phone, address });
  me.name = name;
  return customer;
});

route('GET', '/api/portal/business', (ctx) => businessOf(requireRole(ctx, 'customer')));

// ---------- interceptor ----------

function userFromToken(req: HttpRequest<unknown>): UserRecord | null {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const user = db().users.find((u) => u.id === token.slice(TOKEN_PREFIX.length));
  return user && user.status === 'active' ? user : null;
}

function handle(req: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  const path = new URL(req.urlWithParams, location.origin).pathname;
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const match = r.regex.exec(path);
    if (!match) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
    try {
      expireOverdue();
      const body = r.handler({ req, params, body: structuredClone(req.body ?? {}), user: userFromToken(req) });
      if (req.method !== 'GET') mockDb.save();
      // Clone so components can never mutate the "database" by reference.
      return of(new HttpResponse({ status: 200, body: structuredClone(body), url: req.url }));
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 500;
      const message = e instanceof Error ? e.message : 'Unexpected error';
      if (!(e instanceof ApiError)) console.error('[mock backend]', e);
      return throwError(() => new HttpErrorResponse({ status, error: { message }, url: req.url }));
    }
  }
  return throwError(
    () => new HttpErrorResponse({ status: 404, error: { message: `No mock for ${req.method} ${path}` }, url: req.url }),
  );
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  // materialize/dematerialize so errors are delayed too, like a real network.
  return handle(req).pipe(materialize(), delay(LATENCY_MS), dematerialize());
};
