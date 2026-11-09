import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { Business, Customer, Product, QuotationInput, QuotationItem, QuotationStatus } from '../../../core/models';
import { lineAmount, quotationTotals } from '../../../core/quotation-math';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

@Component({
  selector: 'app-quotation-editor',
  imports: [CurrencyPipe, FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent],
  templateUrl: './quotation-editor.component.html',
  styleUrl: './quotation-editor.component.scss',
})
export class QuotationEditorComponent implements OnInit {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  ui = ui;
  amount = lineAmount;

  /** Route param; empty when creating. */
  id = input<string>();

  loading = signal(true);
  saving = signal(false);
  business = signal<Business | null>(null);
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  number = signal('');
  status = signal<QuotationStatus>('draft');

  model: QuotationInput = {
    customerId: '',
    title: '',
    issueDate: addDays(0),
    validUntil: addDays(30),
    items: [],
    discountPercent: 0,
    notes: '',
    terms: '',
  };

  ngOnInit(): void {
    const id = this.id();
    forkJoin({
      business: this.api.profile(),
      customers: this.api.customers(),
      products: this.api.products(),
      quotation: id ? this.api.quotation(id) : of(null),
    }).subscribe({
      next: ({ business, customers, products, quotation }) => {
        this.business.set(business);
        this.customers.set(customers);
        this.products.set(products.filter((p) => p.active));
        if (quotation) {
          if (quotation.status === 'accepted') {
            this.toast.info('Accepted quotations cannot be edited.');
            this.router.navigate(['/business/quotations', quotation.id]);
            return;
          }
          this.number.set(quotation.number);
          this.status.set(quotation.status);
          this.model = {
            customerId: quotation.customerId,
            title: quotation.title,
            issueDate: quotation.issueDate,
            validUntil: quotation.validUntil,
            items: quotation.items.map((i) => ({ ...i })),
            discountPercent: quotation.discountPercent,
            notes: quotation.notes,
            terms: quotation.terms,
          };
        } else {
          this.model.terms = business.defaultTerms;
          this.model.customerId = this.route.snapshot.queryParamMap.get('customerId') ?? '';
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.router.navigateByUrl('/business/quotations');
      },
    });
  }

  totals() {
    return quotationTotals(this.model.items, this.model.discountPercent);
  }

  addProduct(productId: string): void {
    const p = this.products().find((x) => x.id === productId);
    if (!p) return;
    this.model.items = [
      ...this.model.items,
      { productId: p.id, description: p.name, quantity: 1, unitPrice: p.unitPrice, taxRate: p.taxRate },
    ];
  }

  addBlank(): void {
    const item: QuotationItem = { description: '', quantity: 1, unitPrice: 0, taxRate: this.business()?.defaultTaxRate ?? 0 };
    this.model.items = [...this.model.items, item];
  }

  removeItem(index: number): void {
    this.model.items = this.model.items.filter((_, i) => i !== index);
  }

  save(send: boolean): void {
    this.saving.set(true);
    const id = this.id();
    const req = id ? this.api.updateQuotation(id, this.model, send) : this.api.createQuotation(this.model, send);
    req.subscribe({
      next: (q) => {
        this.toast.success(send ? `${q.number} sent to ${q.customer.name}.` : `${q.number} saved as draft.`);
        this.router.navigate(['/business/quotations', q.id]);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
