import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../api-endpoints';
import { Business, BusinessStats, Customer, Product, QuotationDetail, QuotationInput } from '../models';

export type CustomerInput = Pick<Customer, 'name' | 'company' | 'email' | 'phone' | 'address'>;
export type ProductInput = Omit<Product, 'id' | 'businessId'>;

/** Business admin endpoints; the server scopes everything to the signed-in user's business. */
@Injectable({ providedIn: 'root' })
export class BusinessApiService {
  private http = inject(HttpClient);
  private api = ENDPOINTS.business;

  stats() {
    return this.http.get<BusinessStats>(this.api.stats);
  }

  profile() {
    return this.http.get<Business>(this.api.profile);
  }
  updateProfile(body: Business) {
    return this.http.put<Business>(this.api.profile, body);
  }

  customers() {
    return this.http.get<Customer[]>(this.api.customers);
  }
  customer(id: string) {
    return this.http.get<Customer>(this.api.customer(id));
  }
  createCustomer(body: CustomerInput) {
    return this.http.post<Customer>(this.api.customers, body);
  }
  updateCustomer(id: string, body: CustomerInput) {
    return this.http.put<Customer>(this.api.customer(id), body);
  }
  deleteCustomer(id: string) {
    return this.http.delete(this.api.customer(id));
  }

  products() {
    return this.http.get<Product[]>(this.api.products);
  }
  createProduct(body: ProductInput) {
    return this.http.post<Product>(this.api.products, body);
  }
  updateProduct(id: string, body: ProductInput) {
    return this.http.put<Product>(this.api.product(id), body);
  }
  deleteProduct(id: string) {
    return this.http.delete(this.api.product(id));
  }

  quotations() {
    return this.http.get<QuotationDetail[]>(this.api.quotations);
  }
  quotation(id: string) {
    return this.http.get<QuotationDetail>(this.api.quotation(id));
  }
  createQuotation(body: QuotationInput, send = false) {
    return this.http.post<QuotationDetail>(this.api.quotations, { ...body, send });
  }
  updateQuotation(id: string, body: QuotationInput, send = false) {
    return this.http.put<QuotationDetail>(this.api.quotation(id), { ...body, send });
  }
  sendQuotation(id: string) {
    return this.http.post<QuotationDetail>(this.api.sendQuotation(id), {});
  }
  duplicateQuotation(id: string) {
    return this.http.post<QuotationDetail>(this.api.duplicateQuotation(id), {});
  }
  deleteQuotation(id: string) {
    return this.http.delete(this.api.quotation(id));
  }
}
