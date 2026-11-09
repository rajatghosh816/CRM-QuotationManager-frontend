import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuotationDetail } from '../../../core/models';
import { quotationTotals } from '../../../core/quotation-math';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

/** Card list of quotations for the customer; reads better on phones than a table. */
@Component({
  selector: 'app-portal-quotation-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent],
  templateUrl: './portal-quotation-list.component.html',
  styleUrl: './portal-quotation-list.component.scss',
})
export class PortalQuotationListComponent {
  quotations = input.required<QuotationDetail[]>();

  total(q: QuotationDetail): number {
    return quotationTotals(q.items, q.discountPercent).total;
  }
}
