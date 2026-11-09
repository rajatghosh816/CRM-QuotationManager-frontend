import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api';
import { QuotationDetail, QuotationStatus } from '../../../core/models';
import { quotationTotals } from '../../../core/quotation-math';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

const TABS: { value: QuotationStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

@Component({
  selector: 'app-quotations',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, PageHeaderComponent, StatusBadgeComponent, LoadingComponent, EmptyStateComponent, IconComponent],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.scss',
})
export class QuotationsComponent {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  ui = ui;
  tabs = TABS;

  quotations = signal<QuotationDetail[]>([]);
  loading = signal(true);
  status = signal<QuotationStatus | ''>('');
  query = signal('');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.quotations().filter(
      (x) =>
        (!this.status() || x.status === this.status()) &&
        (!q || [x.number, x.title, x.customer.name, x.customer.company].some((v) => v.toLowerCase().includes(q))),
    );
  });

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

  count(status: QuotationStatus | ''): number {
    return status ? this.quotations().filter((q) => q.status === status).length : this.quotations().length;
  }

  total(q: QuotationDetail): number {
    return quotationTotals(q.items, q.discountPercent).total;
  }

  open(q: QuotationDetail): void {
    this.router.navigate(['/business/quotations', q.id]);
  }
}
