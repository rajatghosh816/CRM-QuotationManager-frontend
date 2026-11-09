import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../api-endpoints';
import { Business, BusinessOverview, CreateBusinessRequest, Plan, PlatformStats, User } from '../models';

/** Super admin endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private api = ENDPOINTS.admin;

  stats() {
    return this.http.get<PlatformStats>(this.api.stats);
  }

  businesses() {
    return this.http.get<BusinessOverview[]>(this.api.businesses);
  }
  business(id: string) {
    return this.http.get<BusinessOverview>(this.api.business(id));
  }
  createBusiness(body: CreateBusinessRequest) {
    return this.http.post<BusinessOverview>(this.api.businesses, body);
  }
  updateBusiness(id: string, body: Omit<Business, 'id' | 'createdAt'>) {
    return this.http.put<BusinessOverview>(this.api.business(id), body);
  }
  deleteBusiness(id: string) {
    return this.http.delete(this.api.business(id));
  }

  plans() {
    return this.http.get<Plan[]>(this.api.plans);
  }
  createPlan(body: Omit<Plan, 'id'>) {
    return this.http.post<Plan>(this.api.plans, body);
  }
  updatePlan(id: string, body: Omit<Plan, 'id'>) {
    return this.http.put<Plan>(this.api.plan(id), body);
  }
  deletePlan(id: string) {
    return this.http.delete(this.api.plan(id));
  }

  users() {
    return this.http.get<User[]>(this.api.users);
  }
  setUserStatus(id: string, status: User['status']) {
    return this.http.patch<User>(this.api.user(id), { status });
  }
}
