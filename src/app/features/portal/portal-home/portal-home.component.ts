import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { Business, CustomerStats, QuotationDetail } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { ui } from '../../../shared/ui';
import { PortalQuotationListComponent } from '../portal-quotation-list/portal-quotation-list.component';

@Component({
  selector: 'app-portal-home',
  imports: [CurrencyPipe, RouterLink, PageHeaderComponent, StatCardComponent, LoadingComponent, EmptyStateComponent, PortalQuotationListComponent],
  templateUrl: './portal-home.component.html',
  styleUrl: './portal-home.component.scss',
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
