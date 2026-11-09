import { API_URL } from './api';

/**
 * Single source of truth for every backend endpoint the app calls.
 *
 * All paths are relative to `environment.apiUrl`. When the backend team
 * finalises a route (or renames one), change it here only — services never
 * build URLs themselves.
 *
 * Endpoints marked "pending" are still served by the mock backend until their
 * path prefix is added to `liveEndpoints` in the environment file.
 */

const url = (path: string) => `${API_URL}${path}`;
const seg = (id: string) => encodeURIComponent(id);

export const ENDPOINTS = {
  auth: {
    login: url('/auth/login'), //          POST   { email, password } -> AuthResponse, sets session cookie
    logout: url('/auth/logout'), //        POST   clears session cookie
    me: url('/auth/me'), //                GET    -> User
    password: url('/auth/password'), //    PUT    { currentPassword, newPassword }
  },

  /** Super admin. */
  admin: {
    stats: url('/admin/stats'), //                                   GET    -> PlatformStats
    businesses: url('/admin/businesses'), //                         GET | POST
    business: (id: string) => url(`/admin/businesses/${seg(id)}`), // GET | PUT | DELETE
    plans: url('/admin/plans'), //                                   GET | POST
    plan: (id: string) => url(`/admin/plans/${seg(id)}`), //         PUT | DELETE
    users: url('/admin/users'), //                                   GET
    user: (id: string) => url(`/admin/users/${seg(id)}`), //         PATCH  { status }
  },

  /** Business admin (scoped server-side to the signed-in user's business). */
  business: {
    stats: url('/business/stats'), //                                          GET
    profile: url('/business/profile'), //                                      GET | PUT
    customers: url('/business/customers'), //                                  GET | POST
    customer: (id: string) => url(`/business/customers/${seg(id)}`), //        GET | PUT | DELETE
    products: url('/business/products'), //                                    GET | POST
    product: (id: string) => url(`/business/products/${seg(id)}`), //          PUT | DELETE
    quotations: url('/business/quotations'), //                                GET | POST
    quotation: (id: string) => url(`/business/quotations/${seg(id)}`), //      GET | PUT | DELETE
    sendQuotation: (id: string) => url(`/business/quotations/${seg(id)}/send`), //           POST
    duplicateQuotation: (id: string) => url(`/business/quotations/${seg(id)}/duplicate`), // POST
  },

  /** Customer portal (scoped server-side to the signed-in customer). */
  portal: {
    stats: url('/portal/stats'), //                                             GET
    business: url('/portal/business'), //                                       GET
    profile: url('/portal/profile'), //                                         GET | PUT
    quotations: url('/portal/quotations'), //                                   GET
    quotation: (id: string) => url(`/portal/quotations/${seg(id)}`), //         GET
    accept: (id: string) => url(`/portal/quotations/${seg(id)}/accept`), //     POST { comment }
    reject: (id: string) => url(`/portal/quotations/${seg(id)}/reject`), //     POST { comment }
  },
} as const;
