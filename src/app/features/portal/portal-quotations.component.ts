import { Component, computed, inject, signal } from '@angular/core';
import { errorMessage } from '../../core/api';
import { QuotationDetail } from '../../core/models';
import { PortalApiService } from '../../core/services/portal-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';
import { PortalQuotationListComponent } from './portal-quotation-list.component';

type Filter = 'all' | 'open' | 'accepted' | 'closed';

@Component({
  selector: 'app-portal-quotations',
  imports: [PageHeaderComponent, LoadingComponent, EmptyStateComponent, PortalQuotationListComponent],
  template: `
    <app-page-header title="My quotations" subtitle="Every quotation that has been sent to you." />

    <div [class]="ui.card + ' overflow-hidden'">
      <div class="flex gap-1 overflow-x-auto border-b border-slate-200 p-4">
        @for (t of tabs; track t.value) {
          <button type="button" (click)="filter.set(t.value)" class="rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap"
            [class]="filter() === t.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'">{{ t.label }}</button>
        }
      </div>
      @if (loading()) {
        <app-loading />
      } @else if (filtered().length) {
        <app-portal-quotation-list [quotations]="filtered()" />
      } @else {
        <app-empty-state title="Nothing here" message="No quotations match this filter." />
      }
    </div>
  `,
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
