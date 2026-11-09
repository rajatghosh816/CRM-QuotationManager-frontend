import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { QuotationDetail } from '../core/models';
import { lineAmount, quotationTotals } from '../core/quotation-math';

/** The quotation as the customer sees it; also what gets printed. */
@Component({
  selector: 'app-quotation-document',
  imports: [CurrencyPipe, DatePipe],
  host: { class: 'block rounded-xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0' },
  template: `
    @let q = quotation();
    @let cur = q.business.currency;
    <div class="p-6 sm:p-10">
      <div class="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div>
          <p class="text-xl font-bold text-slate-900">{{ q.business.name }}</p>
          <p class="mt-1 text-sm whitespace-pre-line text-slate-500">{{ q.business.address }}</p>
          <p class="text-sm text-slate-500">{{ q.business.email }} · {{ q.business.phone }}</p>
        </div>
        <div class="sm:text-right">
          <p class="text-xs font-semibold tracking-widest text-indigo-600 uppercase">Quotation</p>
          <p class="text-lg font-semibold text-slate-900">{{ q.number }}</p>
          <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:justify-end">
            <dt class="text-slate-500">Issued</dt>
            <dd class="text-slate-900">{{ q.issueDate | date: 'mediumDate' }}</dd>
            <dt class="text-slate-500">Valid until</dt>
            <dd class="text-slate-900">{{ q.validUntil | date: 'mediumDate' }}</dd>
          </dl>
        </div>
      </div>

      <div class="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Prepared for</p>
          <p class="mt-1 font-medium text-slate-900">{{ q.customer.name }}</p>
          @if (q.customer.company) {
            <p class="text-sm text-slate-600">{{ q.customer.company }}</p>
          }
          <p class="text-sm text-slate-600">{{ q.customer.address }}</p>
          <p class="text-sm text-slate-600">{{ q.customer.email }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Subject</p>
          <p class="mt-1 font-medium text-slate-900">{{ q.title }}</p>
        </div>
      </div>

      <div class="mt-8 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <th class="py-2 pr-4">Description</th>
              <th class="px-4 py-2 text-right">Qty</th>
              <th class="px-4 py-2 text-right">Unit price</th>
              <th class="px-4 py-2 text-right">Tax</th>
              <th class="py-2 pl-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (item of q.items; track $index) {
              <tr class="border-b border-slate-100">
                <td class="py-3 pr-4 text-slate-900">{{ item.description }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ item.quantity }}</td>
                <td class="px-4 py-3 text-right whitespace-nowrap text-slate-700">{{ item.unitPrice | currency: cur }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ item.taxRate }}%</td>
                <td class="py-3 pl-4 text-right font-medium whitespace-nowrap text-slate-900">{{ amount(item) | currency: cur }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="mt-6 flex justify-end">
        <dl class="w-full max-w-xs space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd class="text-slate-900">{{ totals().subtotal | currency: cur }}</dd></div>
          @if (q.discountPercent) {
            <div class="flex justify-between">
              <dt class="text-slate-500">Discount ({{ q.discountPercent }}%)</dt>
              <dd class="text-emerald-700">−{{ totals().discount | currency: cur }}</dd>
            </div>
          }
          <div class="flex justify-between"><dt class="text-slate-500">Tax</dt><dd class="text-slate-900">{{ totals().tax | currency: cur }}</dd></div>
          <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <dt class="text-slate-900">Total</dt><dd class="text-slate-900">{{ totals().total | currency: cur }}</dd>
          </div>
        </dl>
      </div>

      @if (q.notes) {
        <div class="mt-8">
          <p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Notes</p>
          <p class="mt-1 text-sm whitespace-pre-line text-slate-700">{{ q.notes }}</p>
        </div>
      }
      @if (q.terms) {
        <div class="mt-6">
          <p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Terms &amp; conditions</p>
          <p class="mt-1 text-sm whitespace-pre-line text-slate-700">{{ q.terms }}</p>
        </div>
      }
    </div>
  `,
})
export class QuotationDocumentComponent {
  quotation = input.required<QuotationDetail>();
  totals = computed(() => quotationTotals(this.quotation().items, this.quotation().discountPercent));
  amount = lineAmount;
}
