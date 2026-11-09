import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuotationDetail } from '../../core/models';
import { quotationTotals } from '../../core/quotation-math';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

/** Card list of quotations for the customer; reads better on phones than a table. */
@Component({
  selector: 'app-portal-quotation-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <ul class="divide-y divide-slate-100">
      @for (q of quotations(); track q.id) {
        <li>
          <a [routerLink]="['/portal/quotations', q.id]" class="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-6">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-slate-900">{{ q.number }}</span>
                <app-status-badge [status]="q.status" [customerView]="true" />
              </div>
              <p class="mt-0.5 truncate text-sm text-slate-600">{{ q.title }}</p>
            </div>
            <div class="flex items-center justify-between gap-6 sm:justify-end">
              <span class="text-xs text-slate-500">
                @if (q.status === 'sent' || q.status === 'viewed') {
                  Respond by {{ q.validUntil | date: 'MMM d' }}
                } @else {
                  Issued {{ q.issueDate | date: 'MMM d, y' }}
                }
              </span>
              <span class="text-sm font-semibold whitespace-nowrap text-slate-900">{{ total(q) | currency: q.business.currency }}</span>
            </div>
          </a>
        </li>
      }
    </ul>
  `,
})
export class PortalQuotationListComponent {
  quotations = input.required<QuotationDetail[]>();

  total(q: QuotationDetail): number {
    return quotationTotals(q.items, q.discountPercent).total;
  }
}
