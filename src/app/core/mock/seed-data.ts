import { Business, Customer, Plan, Product, Quotation, QuotationItem, QuotationStatus, UserRecord } from '../models';

export interface MockDatabase {
  users: UserRecord[];
  plans: Plan[];
  businesses: Business[];
  customers: Customer[];
  products: Product[];
  quotations: Quotation[];
}

/** Dates are relative to "now" so the demo data never looks stale. */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const dateOnly = (iso: string) => iso.slice(0, 10);

const ACME_TERMS =
  'Prices valid until the expiry date. 50% advance on acceptance, balance on completion. Installation timelines start after advance payment.';
const BRIGHT_TERMS =
  'Quoted prices include installation and commissioning. Net-metering approvals are the customer\'s responsibility. Warranty as per manufacturer.';
const NIMBUS_TERMS = 'Invoiced monthly in advance. 30-day notice for cancellation.';

function quote(
  id: string,
  number: string,
  businessId: string,
  customerId: string,
  title: string,
  status: QuotationStatus,
  issuedDaysAgo: number,
  validDays: number,
  items: QuotationItem[],
  discountPercent: number,
  terms: string,
  extra: Partial<Quotation> = {},
): Quotation {
  const created = daysFromNow(-issuedDaysAgo);
  const activity = [{ at: created, by: 'Business', message: 'Quotation created' }];
  if (status !== 'draft') activity.push({ at: daysFromNow(-issuedDaysAgo + 0.1), by: 'Business', message: 'Sent to customer' });
  if (['viewed', 'accepted', 'rejected'].includes(status))
    activity.push({ at: daysFromNow(-issuedDaysAgo + 1), by: 'Customer', message: 'Viewed by customer' });
  if (status === 'accepted') activity.push({ at: daysFromNow(-issuedDaysAgo + 2), by: 'Customer', message: 'Accepted by customer' });
  if (status === 'rejected') activity.push({ at: daysFromNow(-issuedDaysAgo + 2), by: 'Customer', message: 'Rejected by customer' });
  return {
    id,
    number,
    businessId,
    customerId,
    title,
    status,
    issueDate: dateOnly(created),
    validUntil: dateOnly(daysFromNow(-issuedDaysAgo + validDays)),
    items,
    discountPercent,
    notes: '',
    terms,
    activity,
    createdAt: created,
    updatedAt: activity[activity.length - 1].at,
    ...extra,
  };
}

export function createSeedData(): MockDatabase {
  const plans: Plan[] = [
    {
      id: 'plan-starter',
      name: 'Starter',
      priceMonthly: 29,
      maxUsers: 2,
      maxQuotationsPerMonth: 50,
      features: ['Unlimited customers', 'Product catalog', 'Customer portal'],
    },
    {
      id: 'plan-pro',
      name: 'Professional',
      priceMonthly: 79,
      maxUsers: 10,
      maxQuotationsPerMonth: 500,
      features: ['Everything in Starter', 'Custom quote numbering', 'Activity history', 'Priority email support'],
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      priceMonthly: 199,
      maxUsers: 100,
      maxQuotationsPerMonth: 10000,
      features: ['Everything in Professional', 'Dedicated account manager', 'SSO', 'API access'],
    },
  ];

  const businesses: Business[] = [
    {
      id: 'biz-acme',
      name: 'Acme Interiors',
      email: 'hello@acmeinteriors.test',
      phone: '+91 98300 11223',
      address: '12 Park Street, Kolkata 700016',
      industry: 'Interior design',
      planId: 'plan-pro',
      status: 'active',
      currency: 'INR',
      defaultTaxRate: 18,
      quotePrefix: 'ACM',
      defaultTerms: ACME_TERMS,
      createdAt: daysFromNow(-240),
    },
    {
      id: 'biz-bright',
      name: 'BrightWave Solar',
      email: 'sales@brightwave.test',
      phone: '+91 99030 44556',
      address: 'Sector V, Salt Lake, Kolkata 700091',
      industry: 'Renewable energy',
      planId: 'plan-enterprise',
      status: 'active',
      currency: 'INR',
      defaultTaxRate: 12,
      quotePrefix: 'BWS',
      defaultTerms: BRIGHT_TERMS,
      createdAt: daysFromNow(-150),
    },
    {
      id: 'biz-nimbus',
      name: 'Nimbus IT Services',
      email: 'contact@nimbusit.test',
      phone: '+1 415 555 0142',
      address: '500 Market St, San Francisco, CA',
      industry: 'IT services',
      planId: 'plan-starter',
      status: 'trial',
      currency: 'USD',
      defaultTaxRate: 0,
      quotePrefix: 'NIM',
      defaultTerms: NIMBUS_TERMS,
      createdAt: daysFromNow(-9),
    },
    {
      id: 'biz-green',
      name: 'GreenLeaf Catering',
      email: 'events@greenleaf.test',
      phone: '+1 646 555 0199',
      address: '88 Hudson St, New York, NY',
      industry: 'Food & events',
      planId: 'plan-starter',
      status: 'suspended',
      currency: 'USD',
      defaultTaxRate: 8,
      quotePrefix: 'GLC',
      defaultTerms: 'Final headcount due 7 days before the event.',
      createdAt: daysFromNow(-320),
    },
  ];

  const customers: Customer[] = [
    { id: 'cus-john', businessId: 'biz-acme', name: 'John Carter', company: 'Carter Homes', email: 'john@carterhomes.test', phone: '+91 98311 00001', address: '4 Lake Road, Kolkata', createdAt: daysFromNow(-200) },
    { id: 'cus-priya', businessId: 'biz-acme', name: 'Priya Sharma', company: 'Sharma & Co. Architects', email: 'priya@sharmaco.test', phone: '+91 98311 00002', address: '21 Camac Street, Kolkata', createdAt: daysFromNow(-120) },
    { id: 'cus-lena', businessId: 'biz-acme', name: 'Lena Fischer', company: 'Fischer Studio', email: 'lena@fischerstudio.test', phone: '+91 98311 00003', address: '9 Ballygunge Place, Kolkata', createdAt: daysFromNow(-30) },
    { id: 'cus-rahul', businessId: 'biz-bright', name: 'Rahul Mehta', company: 'Mehta Textiles', email: 'rahul@mehtatextiles.test', phone: '+91 90070 00004', address: 'Howrah Industrial Estate, Howrah', createdAt: daysFromNow(-100) },
    { id: 'cus-anita', businessId: 'biz-bright', name: 'Anita Desai', company: 'Desai Care Hospital', email: 'anita@desaicare.test', phone: '+91 90070 00005', address: 'New Town, Kolkata', createdAt: daysFromNow(-60) },
    { id: 'cus-mark', businessId: 'biz-nimbus', name: 'Mark Ellis', company: 'Ellis Legal LLP', email: 'mark@ellislegal.test', phone: '+1 415 555 0100', address: '1 Embarcadero Ctr, San Francisco, CA', createdAt: daysFromNow(-5) },
  ];

  const products: Product[] = [
    { id: 'prd-a1', businessId: 'biz-acme', name: 'Modular kitchen (L-shape)', sku: 'KIT-L01', description: 'Marine ply carcass, acrylic shutters, soft-close hardware', unit: 'set', unitPrice: 285000, taxRate: 18, active: true },
    { id: 'prd-a2', businessId: 'biz-acme', name: 'Wardrobe (sliding)', sku: 'WRD-S02', description: '8 ft sliding wardrobe with loft', unit: 'unit', unitPrice: 92000, taxRate: 18, active: true },
    { id: 'prd-a3', businessId: 'biz-acme', name: 'False ceiling', sku: 'CEL-GYP', description: 'Gypsum false ceiling with cove lighting channel', unit: 'sq ft', unitPrice: 145, taxRate: 18, active: true },
    { id: 'prd-a4', businessId: 'biz-acme', name: 'Wall painting (premium emulsion)', sku: 'PNT-PRM', description: 'Two coats, putty and primer included', unit: 'sq ft', unitPrice: 32, taxRate: 18, active: true },
    { id: 'prd-a5', businessId: 'biz-acme', name: 'Design consultation', sku: 'SRV-DES', description: '3D renders and two revision rounds', unit: 'room', unitPrice: 15000, taxRate: 18, active: true },
    { id: 'prd-b1', businessId: 'biz-bright', name: 'Rooftop solar system 5 kW', sku: 'SOL-5KW', description: 'Mono PERC panels, on-grid inverter, mounting structure', unit: 'system', unitPrice: 265000, taxRate: 12, active: true },
    { id: 'prd-b2', businessId: 'biz-bright', name: 'Rooftop solar system 50 kW', sku: 'SOL-50KW', description: 'Commercial on-grid system with remote monitoring', unit: 'system', unitPrice: 2150000, taxRate: 12, active: true },
    { id: 'prd-b3', businessId: 'biz-bright', name: 'Lithium battery bank 10 kWh', sku: 'BAT-10', description: 'LiFePO4, 6000 cycles', unit: 'unit', unitPrice: 340000, taxRate: 18, active: true },
    { id: 'prd-b4', businessId: 'biz-bright', name: 'Annual maintenance contract', sku: 'AMC-1Y', description: 'Quarterly cleaning and inspection', unit: 'year', unitPrice: 18000, taxRate: 18, active: true },
    { id: 'prd-n1', businessId: 'biz-nimbus', name: 'Managed IT support', sku: 'MSP-USR', description: 'Helpdesk, patching and monitoring', unit: 'user/month', unitPrice: 65, taxRate: 0, active: true },
    { id: 'prd-n2', businessId: 'biz-nimbus', name: 'Laptop setup', sku: 'SET-LAP', description: 'Imaging, security baseline and enrolment', unit: 'device', unitPrice: 120, taxRate: 0, active: true },
  ];

  const quotations: Quotation[] = [
    quote('quo-1', 'ACM-0001', 'biz-acme', 'cus-john', 'Carter residence – kitchen & wardrobes', 'accepted', 45, 30,
      [
        { productId: 'prd-a1', description: 'Modular kitchen (L-shape)', quantity: 1, unitPrice: 285000, taxRate: 18 },
        { productId: 'prd-a2', description: 'Wardrobe (sliding)', quantity: 2, unitPrice: 92000, taxRate: 18 },
      ], 5, ACME_TERMS),
    quote('quo-2', 'ACM-0002', 'biz-acme', 'cus-john', 'Carter residence – living room ceiling & paint', 'sent', 3, 21,
      [
        { productId: 'prd-a3', description: 'False ceiling', quantity: 420, unitPrice: 145, taxRate: 18 },
        { productId: 'prd-a4', description: 'Wall painting (premium emulsion)', quantity: 1650, unitPrice: 32, taxRate: 18 },
      ], 0, ACME_TERMS, { notes: 'Includes cove lighting channel; light fixtures quoted separately.' }),
    quote('quo-3', 'ACM-0003', 'biz-acme', 'cus-priya', 'Sharma & Co. office fit-out – phase 1', 'viewed', 6, 30,
      [
        { productId: 'prd-a5', description: 'Design consultation', quantity: 4, unitPrice: 15000, taxRate: 18 },
        { productId: 'prd-a3', description: 'False ceiling', quantity: 1800, unitPrice: 145, taxRate: 18 },
        { description: 'Glass partitions (custom)', quantity: 6, unitPrice: 38000, taxRate: 18 },
      ], 8, ACME_TERMS),
    quote('quo-4', 'ACM-0004', 'biz-acme', 'cus-lena', 'Fischer Studio – reception redesign', 'draft', 1, 30,
      [{ productId: 'prd-a5', description: 'Design consultation', quantity: 1, unitPrice: 15000, taxRate: 18 }], 0, ACME_TERMS),
    quote('quo-5', 'ACM-0005', 'biz-acme', 'cus-priya', 'Conference room furniture', 'rejected', 25, 15,
      [{ description: 'Conference table (12 seater)', quantity: 1, unitPrice: 145000, taxRate: 18 }], 0, ACME_TERMS,
      { customerComment: 'Budget has been reallocated this quarter. Please check back in March.' }),
    quote('quo-6', 'ACM-0006', 'biz-acme', 'cus-john', 'Guest bedroom wardrobe', 'expired', 60, 15,
      [{ productId: 'prd-a2', description: 'Wardrobe (sliding)', quantity: 1, unitPrice: 92000, taxRate: 18 }], 0, ACME_TERMS),
    quote('quo-7', 'BWS-0001', 'biz-bright', 'cus-rahul', 'Mehta Textiles – 50 kW rooftop plant', 'sent', 4, 30,
      [
        { productId: 'prd-b2', description: 'Rooftop solar system 50 kW', quantity: 1, unitPrice: 2150000, taxRate: 12 },
        { productId: 'prd-b4', description: 'Annual maintenance contract', quantity: 3, unitPrice: 18000, taxRate: 18 },
      ], 4, BRIGHT_TERMS),
    quote('quo-8', 'BWS-0002', 'biz-bright', 'cus-anita', 'Desai Care – backup storage', 'accepted', 20, 30,
      [
        { productId: 'prd-b3', description: 'Lithium battery bank 10 kWh', quantity: 4, unitPrice: 340000, taxRate: 18 },
        { productId: 'prd-b1', description: 'Rooftop solar system 5 kW', quantity: 2, unitPrice: 265000, taxRate: 12 },
      ], 6, BRIGHT_TERMS),
    quote('quo-9', 'BWS-0003', 'biz-bright', 'cus-rahul', 'Warehouse battery add-on', 'draft', 0, 30,
      [{ productId: 'prd-b3', description: 'Lithium battery bank 10 kWh', quantity: 2, unitPrice: 340000, taxRate: 18 }], 0, BRIGHT_TERMS),
    quote('quo-10', 'NIM-0001', 'biz-nimbus', 'cus-mark', 'Ellis Legal – managed IT onboarding', 'sent', 2, 14,
      [
        { productId: 'prd-n1', description: 'Managed IT support', quantity: 25, unitPrice: 65, taxRate: 0 },
        { productId: 'prd-n2', description: 'Laptop setup', quantity: 25, unitPrice: 120, taxRate: 0 },
      ], 0, NIMBUS_TERMS),
  ];

  const user = (
    id: string, name: string, email: string, password: string, role: UserRecord['role'],
    extra: Partial<UserRecord> = {},
  ): UserRecord => ({ id, name, email, password, role, status: 'active', createdAt: daysFromNow(-100), ...extra });

  const users: UserRecord[] = [
    user('usr-super', 'Platform Admin', 'admin@crm.test', 'admin123', 'superadmin'),
    user('usr-acme', 'Rohan Das', 'owner@acme.test', 'admin123', 'business_admin', { businessId: 'biz-acme' }),
    user('usr-bright', 'Sneha Roy', 'owner@brightwave.test', 'admin123', 'business_admin', { businessId: 'biz-bright' }),
    user('usr-nimbus', 'Alex Kim', 'owner@nimbusit.test', 'admin123', 'business_admin', { businessId: 'biz-nimbus' }),
    user('usr-green', 'Maria Lopez', 'owner@greenleaf.test', 'admin123', 'business_admin', { businessId: 'biz-green' }),
    ...customers.map((c) =>
      user(`usr-${c.id}`, c.name, c.email, 'customer123', 'customer', { businessId: c.businessId, customerId: c.id, createdAt: c.createdAt }),
    ),
  ];

  return { users, plans, businesses, customers, products, quotations };
}
