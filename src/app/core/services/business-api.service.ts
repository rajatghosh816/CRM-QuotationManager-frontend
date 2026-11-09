import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api';
import { Business, BusinessStats, Customer, Product, QuotationDetail, QuotationInput } from '../models';

export type CustomerInput = Pick<Customer, 'name' | 'company' | 'email' | 'phone' | 'address'>;
export type ProductInput = Omit<Product, 'id' | 'businessId'>;

/** Business admin endpoints; the server scopes everything to the signed-in user's business. */
@Injectable({ providedIn: 'root' })
export class BusinessApiService {
  private http = inject(HttpClient);
  private base = `${API_URL}/business`;

  stats() {
    return this.http.get<BusinessStats>(`${this.base}/stats`);
  }

  profile() {
    return this.http.get<Business>(`${this.base}/profile`);
  }
  updateProfile(body: Business) {
    return this.http.put<Business>(`${this.base}/profile`, body);
  }

  customers() {
    return this.http.get<Customer[]>(`${this.base}/customers`);
  }
  customer(id: string) {
    return this.http.get<Customer>(`${this.base}/customers/${id}`);
  }
  createCustomer(body: CustomerInput) {
    return this.http.post<Customer>(`${this.base}/customers`, body);
  }
  updateCustomer(id: string, body: CustomerInput) {
    return this.http.put<Customer>(`${this.base}/customers/${id}`, body);
  }
  deleteCustomer(id: string) {
    return this.http.delete(`${this.base}/customers/${id}`);
  }

  products() {
    return this.http.get<Product[]>(`${this.base}/products`);
  }
  createProduct(body: ProductInput) {
    return this.http.post<Product>(`${this.base}/products`, body);
  }
  updateProduct(id: string, body: ProductInput) {
    return this.http.put<Product>(`${this.base}/products/${id}`, body);
  }
  deleteProduct(id: string) {
    return this.http.delete(`${this.base}/products/${id}`);
  }

  quotations() {
    return this.http.get<QuotationDetail[]>(`${this.base}/quotations`);
  }
  quotation(id: string) {
    return this.http.get<QuotationDetail>(`${this.base}/quotations/${id}`);
  }
  createQuotation(body: QuotationInput, send = false) {
    return this.http.post<QuotationDetail>(`${this.base}/quotations`, { ...body, send });
  }
  updateQuotation(id: string, body: QuotationInput, send = false) {
    return this.http.put<QuotationDetail>(`${this.base}/quotations/${id}`, { ...body, send });
  }
  sendQuotation(id: string) {
    return this.http.post<QuotationDetail>(`${this.base}/quotations/${id}/send`, {});
  }
  duplicateQuotation(id: string) {
    return this.http.post<QuotationDetail>(`${this.base}/quotations/${id}/duplicate`, {});
  }
  deleteQuotation(id: string) {
    return this.http.delete(`${this.base}/quotations/${id}`);
  }
}
