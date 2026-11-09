import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { PlatformStats } from '../../core/models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatCardComponent } from '../../shared/stat-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, StatCardComponent, StatusBadgeComponent, LoadingComponent],
  template: `
    <app-page-header title="Platform overview" subtitle="How the businesses on the platform are doing.">
      <a routerLink="/superadmin/businesses/new" [class]="ui.btnPrimary">Add business</a>
    </app-page-header>

    @if (stats(); as s) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card label="Businesses" [value]="s.businesses" icon="building"
          [hint]="s.activeBusinesses + ' active · ' + s.trialBusinesses + ' trial · ' + s.suspendedBusinesses + ' suspended'" />
        <app-stat-card label="Monthly recurring revenue" [value]="s.monthlyRevenue | currency: 'USD' : 'symbol' : '1.0-0'"
          icon="chart" hint="From active subscriptions" />
        <app-stat-card label="Users" [value]="s.users" icon="users" hint="Admins and customers" />
        <app-stat-card label="Quotations" [value]="s.quotations" icon="document" hint="Across all businesses" />
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <section [class]="ui.card + ' p-5'">
          <h2 class="text-base font-semibold text-slate-900">Businesses by plan</h2>
          <ul class="mt-4 space-y-4">
            @for (p of s.planBreakdown; track p.planId) {
              <li>
                <div class="flex justify-between text-sm">
                  <span class="font-medium text-slate-700">{{ p.planName }}</span>
                  <span class="text-slate-500">{{ p.count }}</span>
                </div>
                <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full bg-indigo-500" [style.width.%]="s.businesses ? (p.count / s.businesses) * 100 : 0"></div>
                </div>
              </li>
            }
          </ul>
        </section>

        <section [class]="ui.card + ' overflow-hidden lg:col-span-2'">
          <div class="flex items-center justify-between px-5 py-4">
            <h2 class="text-base font-semibold text-slate-900">Newest businesses</h2>
            <a routerLink="/superadmin/businesses" [class]="ui.link + ' text-sm'">View all</a>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr><th [class]="ui.th">Business</th><th [class]="ui.th">Status</th><th [class]="ui.th">Joined</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (b of s.recentBusinesses; track b.id) {
                  <tr>
                    <td [class]="ui.td">
                      <a [routerLink]="['/superadmin/businesses', b.id, 'edit']" class="font-medium text-slate-900 hover:text-indigo-600">{{ b.name }}</a>
                      <p class="text-xs text-slate-500">{{ b.industry }}</p>
                    </td>
                    <td [class]="ui.td"><app-status-badge [status]="b.status" /></td>
                    <td [class]="ui.td">{{ b.createdAt | date: 'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    } @else {
      <app-loading />
    }
  `,
})
export class AdminDashboardComponent {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  ui = ui;
  stats = signal<PlatformStats | null>(null);

  constructor() {
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: (e) => this.toast.error(errorMessage(e)) });
  }
}
