import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { QuotationDetail } from '../../core/models';
import { lineAmount, quotationTotals } from '../../core/quotation-math';

/** The quotation as the customer sees it; also what gets printed. */
@Component({
  selector: 'app-quotation-document',
  imports: [CurrencyPipe, DatePipe],
  host: { class: 'block rounded-xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0' },
  templateUrl: './quotation-document.component.html',
  styleUrl: './quotation-document.component.scss',
})
export class QuotationDocumentComponent {
  quotation = input.required<QuotationDetail>();
  totals = computed(() => quotationTotals(this.quotation().items, this.quotation().discountPercent));
  amount = lineAmount;
}
