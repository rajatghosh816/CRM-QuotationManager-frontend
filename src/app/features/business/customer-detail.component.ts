import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Customer, QuotationDetail } from '../../core/models';
import { quotationTotals } from '../../core/quotation-math';
import { BusinessApiService } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatCardComponent } from '../../shared/stat-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ui } from '../../shared/ui';
import { CustomerFormComponent } from './customer-form.component';

@Component({
  selector: 'app-customer-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, LoadingComponent, EmptyStateComponent, IconComponent, StatusBadgeComponent, StatCardComponent, CustomerFormComponent],
  template: `
    @if (customer(); as c) {
      <app-page-header [title]="c.name" [subtitle]="c.company">
        <a back routerLink="/business/customers" [class]="ui.btnGhost + ' mb-2 -ml-2'"><app-icon name="arrowLeft" size="size-4" />Customers</a>
        <button type="button" [class]="ui.btnSecondary" (click)="editing.set(true)"><app-icon name="pencil" size="size-4" />Edit</button>
        <a routerLink="/business/quotations/new" [queryParams]="{ customerId: c.id }" [class]="ui.btnPrimary"><app-icon name="plus" size="size-4" />New quotation</a>
      </app-page-header>

      <div class="grid gap-6 lg:grid-cols-3">
        <section [class]="ui.card + ' p-5'">
          <h2 class="text-base font-semibold text-slate-900">Contact</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div><dt class="text-slate-500">Email</dt><dd class="text-slate-900">{{ c.email }}</dd></div>
            <div><dt class="text-slate-500">Phone</dt><dd class="text-slate-900">{{ c.phone || '—' }}</dd></div>
            <div><dt class="text-slate-500">Address</dt><dd class="whitespace-pre-line text-slate-900">{{ c.address || '—' }}</dd></div>
            <div><dt class="text-slate-500">Customer since</dt><dd class="text-slate-900">{{ c.createdAt | date: 'mediumDate' }}</dd></div>
          </dl>
          <p class="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Signs in to the customer portal with <span class="font-medium">{{ c.email }}</span>.
          </p>
        </section>

        <div class="space-y-6 lg:col-span-2">
          <div class="grid gap-4 sm:grid-cols-3">
            <app-stat-card label="Quotations" [value]="quotes().length" />
            <app-stat-card label="Accepted" [value]="won().count" />
            <app-stat-card label="Accepted value" [value]="won().value | currency: currency() : 'symbol' : '1.0-0'" />
          </div>

          <section [class]="ui.card + ' overflow-hidden'">
            <h2 class="px-5 py-4 text-base font-semibold text-slate-900">Quotations</h2>
            @if (quotes().length === 0) {
              <app-empty-state title="No quotations for this customer yet">
                <a routerLink="/business/quotations/new" [queryParams]="{ customerId: c.id }" [class]="ui.btnPrimary">New quotation</a>
              </app-empty-state>
            } @else {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead class="bg-slate-50">
                    <tr><th [class]="ui.th">Quotation</th><th [class]="ui.th + ' text-right'">Total</th><th [class]="ui.th">Status</th><th [class]="ui.th">Issued</th></tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (q of quotes(); track q.id) {
                      <tr class="hover:bg-slate-50">
                        <td [class]="ui.td">
                          <a [routerLink]="['/business/quotations', q.id]" class="font-medium text-slate-900 hover:text-indigo-600">{{ q.number }}</a>
                          <p class="max-w-xs truncate text-xs text-slate-500">{{ q.title }}</p>
                        </td>
                        <td [class]="ui.td + ' text-right font-medium whitespace-nowrap'">{{ total(q) | currency: currency() }}</td>
                        <td [class]="ui.td"><app-status-badge [status]="q.status" /></td>
                        <td [class]="ui.td + ' whitespace-nowrap'">{{ q.issueDate | date: 'mediumDate' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        </div>
      </div>

      @if (editing()) {
        <app-customer-form [customer]="c" (closed)="editing.set(false)" (saved)="customer.set($event); editing.set(false)" />
      }
    } @else {
      <app-loading />
    }
  `,
})
export class CustomerDetailComponent implements OnInit {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  ui = ui;

  id = input.required<string>();
  customer = signal<Customer | null>(null);
  quotes = signal<QuotationDetail[]>([]);
  currency = signal('USD');
  editing = signal(false);

  won = computed(() => {
    const accepted = this.quotes().filter((q) => q.status === 'accepted');
    return { count: accepted.length, value: accepted.reduce((s, q) => s + this.total(q), 0) };
  });

  ngOnInit(): void {
    forkJoin({ customer: this.api.customer(this.id()), quotes: this.api.quotations(), business: this.api.profile() }).subscribe({
      next: ({ customer, quotes, business }) => {
        this.customer.set(customer);
        this.quotes.set(quotes.filter((q) => q.customerId === customer.id));
        this.currency.set(business.currency);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.router.navigateByUrl('/business/customers');
      },
    });
  }

  total(q: QuotationDetail): number {
    return quotationTotals(q.items, q.discountPercent).total;
  }
}
