import { Component, computed, inject, signal } from '@angular/core';
import { errorMessage } from '../../../core/api';
import { QuotationDetail } from '../../../core/models';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';
import { PortalQuotationListComponent } from '../portal-quotation-list/portal-quotation-list.component';

type Filter = 'all' | 'open' | 'accepted' | 'closed';

@Component({
  selector: 'app-portal-quotations',
  imports: [PageHeaderComponent, LoadingComponent, EmptyStateComponent, PortalQuotationListComponent],
  templateUrl: './portal-quotations.component.html',
  styleUrl: './portal-quotations.component.scss',
})
export class PortalQuotationsComponent {
  private api = inject(PortalApiService);
  private toast = inject(ToastService);
  ui = ui;
  tabs: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Awaiting response' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Declined / expired' },
  ];

  quotations = signal<QuotationDetail[]>([]);
  loading = signal(true);
  filter = signal<Filter>('all');

  filtered = computed(() =>
    this.quotations().filter((q) => {
      switch (this.filter()) {
        case 'open':
          return q.status === 'sent' || q.status === 'viewed';
        case 'accepted':
          return q.status === 'accepted';
        case 'closed':
          return q.status === 'rejected' || q.status === 'expired';
        default:
          return true;
      }
    }),
  );

  constructor() {
    this.api.quotations().subscribe({
      next: (list) => {
        this.quotations.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
