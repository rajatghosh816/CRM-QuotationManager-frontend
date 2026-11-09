import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { Business, BusinessStats, QuotationDetail } from '../../../core/models';
import { quotationTotals } from '../../../core/quotation-math';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-business-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, StatCardComponent, StatusBadgeComponent, LoadingComponent, EmptyStateComponent, IconComponent],
  templateUrl: './business-dashboard.component.html',
  styleUrl: './business-dashboard.component.scss',
})
export class BusinessDashboardComponent {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  ui = ui;
  data = signal<{ stats: BusinessStats; business: Business } | null>(null);

  constructor() {
    forkJoin({ stats: this.api.stats(), business: this.api.profile() }).subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  total(q: QuotationDetail): number {
    return quotationTotals(q.items, q.discountPercent).total;
  }
}
