import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Business, CustomerStats, QuotationDetail } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PortalApiService } from '../../core/services/portal-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatCardComponent } from '../../shared/stat-card.component';
import { ui } from '../../shared/ui';
import { PortalQuotationListComponent } from './portal-quotation-list.component';

@Component({
  selector: 'app-portal-home',
  imports: [CurrencyPipe, RouterLink, PageHeaderComponent, StatCardComponent, LoadingComponent, EmptyStateComponent, PortalQuotationListComponent],
  template: `
    @if (data(); as d) {
      <app-page-header [title]="'Welcome, ' + firstName()" [subtitle]="'Quotations from ' + d.business.name" />

      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card label="Waiting for your response" [value]="d.stats.awaitingResponse" icon="send" />
        <app-stat-card label="Accepted" [value]="d.stats.accepted" icon="check" />
        <app-stat-card label="Accepted value" [value]="d.stats.acceptedValue | currency: d.business.currency : 'symbol' : '1.0-0'" icon="chart" />
      </div>

      <section [class]="ui.card + ' mt-6 overflow-hidden'">
        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-900">Needs your response</h2>
          <a routerLink="/portal/quotations" [class]="ui.link + ' text-sm'">All quotations</a>
        </div>
        @if (awaiting().length) {
          <app-portal-quotation-list [quotations]="awaiting()" />
        } @else {
          <app-empty-state icon="check" title="You're all caught up" message="New quotations from {{ d.business.name }} will appear here." />
        }
      </section>

      <section [class]="ui.card + ' mt-6 p-5'">
        <h2 class="text-base font-semibold text-slate-900">Questions about a quotation?</h2>
        <p class="mt-1 text-sm text-slate-600">
          Contact {{ d.business.name }} at <a [href]="'mailto:' + d.business.email" [class]="ui.link">{{ d.business.email }}</a>
          or {{ d.business.phone }}.
        </p>
      </section>
    } @else {
      <app-loading />
    }
  `,
})
export class PortalHomeComponent {
  private api = inject(PortalApiService);
  private toast = inject(ToastService);
  private user = inject(AuthService).user;
  ui = ui;

  data = signal<{ stats: CustomerStats; business: Business; quotations: QuotationDetail[] } | null>(null);
  awaiting = computed(() => (this.data()?.quotations ?? []).filter((q) => q.status === 'sent' || q.status === 'viewed'));
  firstName = computed(() => this.user()?.name.split(' ')[0] ?? '');

  constructor() {
    forkJoin({ stats: this.api.stats(), business: this.api.business(), quotations: this.api.quotations() }).subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
