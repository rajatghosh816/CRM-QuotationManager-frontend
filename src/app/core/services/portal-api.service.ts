import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../api-endpoints';
import { Business, Customer, CustomerStats, QuotationDetail } from '../models';

/** Customer portal endpoints; the server scopes everything to the signed-in customer. */
@Injectable({ providedIn: 'root' })
export class PortalApiService {
  private http = inject(HttpClient);
  private api = ENDPOINTS.portal;

  stats() {
    return this.http.get<CustomerStats>(this.api.stats);
  }
  business() {
    return this.http.get<Business>(this.api.business);
  }
  quotations() {
    return this.http.get<QuotationDetail[]>(this.api.quotations);
  }
  quotation(id: string) {
    return this.http.get<QuotationDetail>(this.api.quotation(id));
  }
  accept(id: string, comment: string) {
    return this.http.post<QuotationDetail>(this.api.accept(id), { comment });
  }
  reject(id: string, comment: string) {
    return this.http.post<QuotationDetail>(this.api.reject(id), { comment });
  }
  profile() {
    return this.http.get<Customer>(this.api.profile);
  }
  updateProfile(body: Pick<Customer, 'name' | 'company' | 'phone' | 'address'>) {
    return this.http.put<Customer>(this.api.profile, body);
  }
}
