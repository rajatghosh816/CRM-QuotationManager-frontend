import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api';
import { Business, Customer, CustomerStats, QuotationDetail } from '../models';

/** Customer portal endpoints; the server scopes everything to the signed-in customer. */
@Injectable({ providedIn: 'root' })
export class PortalApiService {
  private http = inject(HttpClient);
  private base = `${API_URL}/portal`;

  stats() {
    return this.http.get<CustomerStats>(`${this.base}/stats`);
  }
  business() {
    return this.http.get<Business>(`${this.base}/business`);
  }
  quotations() {
    return this.http.get<QuotationDetail[]>(`${this.base}/quotations`);
  }
  quotation(id: string) {
    return this.http.get<QuotationDetail>(`${this.base}/quotations/${id}`);
  }
  accept(id: string, comment: string) {
    return this.http.post<QuotationDetail>(`${this.base}/quotations/${id}/accept`, { comment });
  }
  reject(id: string, comment: string) {
    return this.http.post<QuotationDetail>(`${this.base}/quotations/${id}/reject`, { comment });
  }
  profile() {
    return this.http.get<Customer>(`${this.base}/profile`);
  }
  updateProfile(body: Pick<Customer, 'name' | 'company' | 'phone' | 'address'>) {
    return this.http.put<Customer>(`${this.base}/profile`, body);
  }
}
