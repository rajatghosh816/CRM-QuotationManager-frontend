import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/guards/role.guard';
import { NavItem, ShellComponent } from './shared/shell.component';

const superadminNav: NavItem[] = [
  { label: 'Overview', path: '/superadmin', icon: 'home', exact: true },
  { label: 'Businesses', path: '/superadmin/businesses', icon: 'building' },
  { label: 'Plans', path: '/superadmin/plans', icon: 'layers' },
  { label: 'Users', path: '/superadmin/users', icon: 'users' },
  { label: 'My account', path: '/superadmin/account', icon: 'user' },
];

const businessNav: NavItem[] = [
  { label: 'Dashboard', path: '/business', icon: 'home', exact: true },
  { label: 'Quotations', path: '/business/quotations', icon: 'document' },
  { label: 'Customers', path: '/business/customers', icon: 'users' },
  { label: 'Products', path: '/business/products', icon: 'cube' },
  { label: 'Settings', path: '/business/settings', icon: 'cog' },
];

const portalNav: NavItem[] = [
  { label: 'Home', path: '/portal', icon: 'home', exact: true },
  { label: 'My quotations', path: '/portal/quotations', icon: 'document' },
  { label: 'Profile', path: '/portal/profile', icon: 'user' },
];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Quotation Manager',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },

  // ---------- Super admin ----------
  {
    path: 'superadmin',
    component: ShellComponent,
    canActivate: [roleGuard('superadmin')],
    data: { areaLabel: 'Super admin', nav: superadminNav },
    children: [
      { path: '', title: 'Overview', loadComponent: () => import('./features/superadmin/admin-dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'businesses', title: 'Businesses', loadComponent: () => import('./features/superadmin/businesses.component').then((m) => m.BusinessesComponent) },
      { path: 'businesses/new', title: 'Add business', loadComponent: () => import('./features/superadmin/business-form.component').then((m) => m.BusinessFormComponent) },
      { path: 'businesses/:id/edit', title: 'Edit business', loadComponent: () => import('./features/superadmin/business-form.component').then((m) => m.BusinessFormComponent) },
      { path: 'plans', title: 'Plans', loadComponent: () => import('./features/superadmin/plans.component').then((m) => m.PlansComponent) },
      { path: 'users', title: 'Users', loadComponent: () => import('./features/superadmin/users.component').then((m) => m.UsersComponent) },
      { path: 'account', title: 'My account', loadComponent: () => import('./features/superadmin/admin-account.component').then((m) => m.AdminAccountComponent) },
    ],
  },

  // ---------- Business admin ----------
  {
    path: 'business',
    component: ShellComponent,
    canActivate: [roleGuard('business_admin')],
    data: { areaLabel: 'Business admin', nav: businessNav },
    children: [
      { path: '', title: 'Dashboard', loadComponent: () => import('./features/business/business-dashboard.component').then((m) => m.BusinessDashboardComponent) },
      { path: 'quotations', title: 'Quotations', loadComponent: () => import('./features/business/quotations.component').then((m) => m.QuotationsComponent) },
      { path: 'quotations/new', title: 'New quotation', loadComponent: () => import('./features/business/quotation-editor.component').then((m) => m.QuotationEditorComponent) },
      { path: 'quotations/:id', title: 'Quotation', loadComponent: () => import('./features/business/quotation-view.component').then((m) => m.QuotationViewComponent) },
      { path: 'quotations/:id/edit', title: 'Edit quotation', loadComponent: () => import('./features/business/quotation-editor.component').then((m) => m.QuotationEditorComponent) },
      { path: 'customers', title: 'Customers', loadComponent: () => import('./features/business/customers.component').then((m) => m.CustomersComponent) },
      { path: 'customers/:id', title: 'Customer', loadComponent: () => import('./features/business/customer-detail.component').then((m) => m.CustomerDetailComponent) },
      { path: 'products', title: 'Products', loadComponent: () => import('./features/business/products.component').then((m) => m.ProductsComponent) },
      { path: 'settings', title: 'Settings', loadComponent: () => import('./features/business/business-settings.component').then((m) => m.BusinessSettingsComponent) },
    ],
  },

  // ---------- Customer portal ----------
  {
    path: 'portal',
    component: ShellComponent,
    canActivate: [roleGuard('customer')],
    data: { areaLabel: 'Customer portal', nav: portalNav },
    children: [
      { path: '', title: 'Home', loadComponent: () => import('./features/portal/portal-home.component').then((m) => m.PortalHomeComponent) },
      { path: 'quotations', title: 'My quotations', loadComponent: () => import('./features/portal/portal-quotations.component').then((m) => m.PortalQuotationsComponent) },
      { path: 'quotations/:id', title: 'Quotation', loadComponent: () => import('./features/portal/portal-quotation.component').then((m) => m.PortalQuotationComponent) },
      { path: 'profile', title: 'My profile', loadComponent: () => import('./features/portal/portal-profile.component').then((m) => m.PortalProfileComponent) },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
