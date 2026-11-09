import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { BusinessOverview, BusinessStatus } from '../../core/models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-businesses',
  imports: [DatePipe, FormsModule, RouterLink, PageHeaderComponent, StatusBadgeComponent, LoadingComponent, EmptyStateComponent, IconComponent],
  template: `
    <app-page-header title="Businesses" subtitle="Every company that uses the platform.">
      <a routerLink="new" [class]="ui.btnPrimary"><app-icon name="plus" size="size-4" />Add business</a>
    </app-page-header>

    <div [class]="ui.card + ' overflow-hidden'">
      <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
        <div class="relative flex-1">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><app-icon name="search" size="size-4" /></span>
          <input type="search" placeholder="Search by name, admin or email" [class]="ui.input + ' pl-9'"
            [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
        <select [class]="ui.input + ' sm:w-48'" [ngModel]="status()" (ngModelChange)="status.set($event)" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="building" title="No businesses found" message="Try a different search or add a new business." />
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th [class]="ui.th">Business</th>
                <th [class]="ui.th">Admin</th>
                <th [class]="ui.th">Plan</th>
                <th [class]="ui.th">Customers</th>
                <th [class]="ui.th">Quotations</th>
                <th [class]="ui.th">Status</th>
                <th [class]="ui.th">Joined</th>
                <th [class]="ui.th"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (b of filtered(); track b.id) {
                <tr class="hover:bg-slate-50">
                  <td [class]="ui.td">
                    <a [routerLink]="[b.id, 'edit']" class="font-medium text-slate-900 hover:text-indigo-600">{{ b.name }}</a>
                    <p class="text-xs text-slate-500">{{ b.industry }} · {{ b.currency }}</p>
                  </td>
                  <td [class]="ui.td">
                    <p>{{ b.adminName }}</p>
                    <p class="text-xs text-slate-500">{{ b.adminEmail }}</p>
                  </td>
                  <td [class]="ui.td">{{ b.planName }}</td>
                  <td [class]="ui.td">{{ b.customerCount }}</td>
                  <td [class]="ui.td">{{ b.quotationCount }}</td>
                  <td [class]="ui.td"><app-status-badge [status]="b.status" /></td>
                  <td [class]="ui.td + ' whitespace-nowrap'">{{ b.createdAt | date: 'mediumDate' }}</td>
                  <td [class]="ui.td + ' text-right whitespace-nowrap'">
                    <a [routerLink]="[b.id, 'edit']" [class]="ui.btnGhost">Edit</a>
                    @if (b.status === 'suspended') {
                      <button type="button" [class]="ui.btnGhost" (click)="setStatus(b, 'active')">Activate</button>
                    } @else {
                      <button type="button" [class]="ui.btnGhost" (click)="setStatus(b, 'suspended')">Suspend</button>
                    }
                    <button type="button" [class]="ui.btnGhostDanger" (click)="remove(b)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class BusinessesComponent {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  ui = ui;

  businesses = signal<BusinessOverview[]>([]);
  loading = signal(true);
  query = signal('');
  status = signal('');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.businesses().filter(
      (b) =>
        (!this.status() || b.status === this.status()) &&
        (!q || [b.name, b.adminName, b.adminEmail, b.email].some((v) => v.toLowerCase().includes(q))),
    );
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.businesses().subscribe({
      next: (list) => {
        this.businesses.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  setStatus(b: BusinessOverview, status: BusinessStatus): void {
    const verb = status === 'suspended' ? 'Suspend' : 'Activate';
    if (status === 'suspended' && !confirm(`Suspend ${b.name}? Its admins and customers will not be able to sign in.`)) return;
    const { id, createdAt, planName, adminName, adminEmail, customerCount, quotationCount, ...fields } = b;
    this.api.updateBusiness(id, { ...fields, status }).subscribe({
      next: () => {
        this.toast.success(`${verb}d ${b.name}.`);
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  remove(b: BusinessOverview): void {
    if (!confirm(`Delete ${b.name}? This removes all its customers, products, quotations and users. This cannot be undone.`)) return;
    this.api.deleteBusiness(b.id).subscribe({
      next: () => {
        this.toast.success(`${b.name} deleted.`);
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
