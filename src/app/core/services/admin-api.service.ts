import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api';
import { Business, BusinessOverview, CreateBusinessRequest, Plan, PlatformStats, User } from '../models';

/** Super admin endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = `${API_URL}/admin`;

  stats() {
    return this.http.get<PlatformStats>(`${this.base}/stats`);
  }

  businesses() {
    return this.http.get<BusinessOverview[]>(`${this.base}/businesses`);
  }
  business(id: string) {
    return this.http.get<BusinessOverview>(`${this.base}/businesses/${id}`);
  }
  createBusiness(body: CreateBusinessRequest) {
    return this.http.post<BusinessOverview>(`${this.base}/businesses`, body);
  }
  updateBusiness(id: string, body: Omit<Business, 'id' | 'createdAt'>) {
    return this.http.put<BusinessOverview>(`${this.base}/businesses/${id}`, body);
  }
  deleteBusiness(id: string) {
    return this.http.delete(`${this.base}/businesses/${id}`);
  }

  plans() {
    return this.http.get<Plan[]>(`${this.base}/plans`);
  }
  createPlan(body: Omit<Plan, 'id'>) {
    return this.http.post<Plan>(`${this.base}/plans`, body);
  }
  updatePlan(id: string, body: Omit<Plan, 'id'>) {
    return this.http.put<Plan>(`${this.base}/plans/${id}`, body);
  }
  deletePlan(id: string) {
    return this.http.delete(`${this.base}/plans/${id}`);
  }

  users() {
    return this.http.get<User[]>(`${this.base}/users`);
  }
  setUserStatus(id: string, status: User['status']) {
    return this.http.patch<User>(`${this.base}/users/${id}`, { status });
  }
}
