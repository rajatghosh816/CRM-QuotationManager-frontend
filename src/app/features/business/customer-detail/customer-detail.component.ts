import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { Customer, QuotationDetail } from '../../../core/models';
import { quotationTotals } from '../../../core/quotation-math';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

@Component({
  selector: 'app-customer-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, LoadingComponent, EmptyStateComponent, IconComponent, StatusBadgeComponent, StatCardComponent, CustomerFormComponent],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
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
