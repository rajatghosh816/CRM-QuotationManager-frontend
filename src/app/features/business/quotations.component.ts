import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { QuotationDetail, QuotationStatus } from '../../core/models';
import { quotationTotals } from '../../core/quotation-math';
import { BusinessApiService } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ui } from '../../shared/ui';

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
  template: `
    <app-page-header title="Quotations" subtitle="Create, send and track your quotations.">
      <a routerLink="new" [class]="ui.btnPrimary"><app-icon name="plus" size="size-4" />New quotation</a>
    </app-page-header>

    <div [class]="ui.card + ' overflow-hidden'">
      <div class="space-y-3 border-b border-slate-200 p-4">
        <div class="flex gap-1 overflow-x-auto">
          @for (t of tabs; track t.value) {
            <button type="button" (click)="status.set(t.value)"
              class="rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap"
              [class]="status() === t.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'">
              {{ t.label }} <span class="ml-1 text-xs opacity-70">{{ count(t.value) }}</span>
            </button>
          }
        </div>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><app-icon name="search" size="size-4" /></span>
          <input type="search" placeholder="Search number, title or customer" [class]="ui.input + ' pl-9'"
            [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (filtered().length === 0) {
        <app-empty-state title="No quotations here" message="Change the filter, or create a new quotation.">
          <a routerLink="new" [class]="ui.btnPrimary">New quotation</a>
        </app-empty-state>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th [class]="ui.th">Number</th><th [class]="ui.th">Title</th><th [class]="ui.th">Customer</th>
                <th [class]="ui.th + ' text-right'">Total</th><th [class]="ui.th">Status</th>
                <th [class]="ui.th">Issued</th><th [class]="ui.th">Valid until</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (q of filtered(); track q.id) {
                <tr class="cursor-pointer hover:bg-slate-50" (click)="open(q)">
                  <td [class]="ui.td + ' font-medium text-slate-900 whitespace-nowrap'">
                    <a [routerLink]="[q.id]" (click)="$event.stopPropagation()" class="hover:text-indigo-600">{{ q.number }}</a>
                  </td>
                  <td [class]="ui.td"><p class="max-w-xs truncate">{{ q.title }}</p></td>
                  <td [class]="ui.td"><p>{{ q.customer.name }}</p><p class="text-xs text-slate-500">{{ q.customer.company }}</p></td>
                  <td [class]="ui.td + ' text-right font-medium whitespace-nowrap'">{{ total(q) | currency: q.business.currency }}</td>
                  <td [class]="ui.td"><app-status-badge [status]="q.status" /></td>
                  <td [class]="ui.td + ' whitespace-nowrap'">{{ q.issueDate | date: 'mediumDate' }}</td>
                  <td [class]="ui.td + ' whitespace-nowrap'">{{ q.validUntil | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
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
