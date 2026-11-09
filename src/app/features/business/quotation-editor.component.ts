import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Business, Customer, Product, QuotationInput, QuotationItem, QuotationStatus } from '../../core/models';
import { lineAmount, quotationTotals } from '../../core/quotation-math';
import { BusinessApiService } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

@Component({
  selector: 'app-quotation-editor',
  imports: [CurrencyPipe, FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent],
  template: `
    <app-page-header [title]="id() ? 'Edit ' + number() : 'New quotation'"
      [subtitle]="id() ? 'Saving changes to a sent quotation moves it back to draft until you send it again.' : 'Fill in the details, then save as a draft or send it straight away.'">
      <a back [routerLink]="id() ? ['/business/quotations', id()] : '/business/quotations'" [class]="ui.btnGhost + ' mb-2 -ml-2'">
        <app-icon name="arrowLeft" size="size-4" />Back
      </a>
    </app-page-header>

    @if (loading()) {
      <app-loading />
    } @else if (business(); as biz) {
      <form #f="ngForm" (ngSubmit)="save(false)" class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <section [class]="ui.card + ' p-5'">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label [class]="ui.label" for="title">Title *</label>
                <input id="title" name="title" required placeholder="e.g. Office renovation – phase 1" [class]="ui.input" [(ngModel)]="model.title" />
              </div>
              <div class="sm:col-span-2">
                <label [class]="ui.label" for="customer">Customer *</label>
                <div class="flex gap-2">
                  <select id="customer" name="customerId" required [class]="ui.input" [(ngModel)]="model.customerId">
                    <option value="" disabled>Select a customer</option>
                    @for (c of customers(); track c.id) {
                      <option [value]="c.id">{{ c.name }}{{ c.company ? ' — ' + c.company : '' }}</option>
                    }
                  </select>
                  <a routerLink="/business/customers" [queryParams]="{ new: 1 }" [class]="ui.btnSecondary + ' shrink-0'">Add</a>
                </div>
              </div>
              <div>
                <label [class]="ui.label" for="issue">Issue date *</label>
                <input id="issue" name="issueDate" type="date" required [class]="ui.input" [(ngModel)]="model.issueDate" />
              </div>
              <div>
                <label [class]="ui.label" for="valid">Valid until *</label>
                <input id="valid" name="validUntil" type="date" required [min]="model.issueDate" [class]="ui.input" [(ngModel)]="model.validUntil" />
              </div>
            </div>
          </section>

          <section [class]="ui.card">
            <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 class="text-base font-semibold text-slate-900">Line items</h2>
              <div class="flex gap-2">
                <select [class]="ui.input + ' sm:w-60'" [ngModel]="''" name="addProduct" (ngModelChange)="addProduct($event)" aria-label="Add a product">
                  <option value="">+ Add from catalog…</option>
                  @for (p of products(); track p.id) {
                    <option [value]="p.id">{{ p.name }} ({{ p.unitPrice | currency: biz.currency : 'symbol' : '1.0-0' }}/{{ p.unit }})</option>
                  }
                </select>
                <button type="button" [class]="ui.btnSecondary + ' shrink-0'" (click)="addBlank()">Custom line</button>
              </div>
            </div>

            @if (model.items.length) {
              <div class="hidden grid-cols-12 gap-3 border-b border-slate-100 px-5 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase md:grid">
                <span class="col-span-4">Description</span>
                <span class="col-span-2">Qty</span>
                <span class="col-span-2">Unit price</span>
                <span class="col-span-2">Tax %</span>
                <span class="col-span-2 pr-9 text-right">Amount</span>
              </div>
            }
            <div class="divide-y divide-slate-100">
              @for (item of model.items; track $index; let i = $index) {
                <div class="grid grid-cols-12 gap-3 px-5 py-4">
                  <div class="col-span-12 md:col-span-4">
                    <label [class]="ui.label + ' md:sr-only'" [for]="'desc' + i">Description</label>
                    <input [id]="'desc' + i" [name]="'desc' + i" required placeholder="Description" [class]="ui.input" [(ngModel)]="item.description" />
                  </div>
                  <div class="col-span-4 md:col-span-2">
                    <label [class]="ui.label + ' md:sr-only'" [for]="'qty' + i">Qty</label>
                    <input [id]="'qty' + i" [name]="'qty' + i" type="number" min="0.01" step="any" required [class]="ui.input" [(ngModel)]="item.quantity" />
                  </div>
                  <div class="col-span-4 md:col-span-2">
                    <label [class]="ui.label + ' md:sr-only'" [for]="'price' + i">Unit price</label>
                    <input [id]="'price' + i" [name]="'price' + i" type="number" min="0" step="any" required [class]="ui.input" [(ngModel)]="item.unitPrice" />
                  </div>
                  <div class="col-span-4 md:col-span-2">
                    <label [class]="ui.label + ' md:sr-only'" [for]="'tax' + i">Tax %</label>
                    <input [id]="'tax' + i" [name]="'tax' + i" type="number" min="0" max="100" step="any" [class]="ui.input" [(ngModel)]="item.taxRate" />
                  </div>
                  <div class="col-span-12 flex items-center justify-between gap-2 md:col-span-2 md:justify-end">
                    <span class="text-sm font-medium whitespace-nowrap text-slate-900">{{ amount(item) | currency: biz.currency }}</span>
                    <button type="button" class="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" (click)="removeItem(i)"
                      aria-label="Remove line">
                      <app-icon name="trash" size="size-4" />
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="px-5 py-10 text-center text-sm text-slate-500">No items yet. Add a product from your catalog or a custom line.</p>
              }
            </div>
          </section>

          <section [class]="ui.card + ' grid gap-4 p-5'">
            <div>
              <label [class]="ui.label" for="notes">Notes for the customer</label>
              <textarea id="notes" name="notes" rows="3" [class]="ui.input" [(ngModel)]="model.notes"></textarea>
            </div>
            <div>
              <label [class]="ui.label" for="terms">Terms &amp; conditions</label>
              <textarea id="terms" name="terms" rows="3" [class]="ui.input" [(ngModel)]="model.terms"></textarea>
            </div>
          </section>
        </div>

        <aside class="lg:sticky lg:top-6 lg:self-start">
          <section [class]="ui.card + ' p-5'">
            <h2 class="text-base font-semibold text-slate-900">Summary</h2>
            @let t = totals();
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>{{ t.subtotal | currency: biz.currency }}</dd></div>
              <div class="flex items-center justify-between gap-3">
                <dt class="whitespace-nowrap text-slate-500"><label for="discount">Discount %</label></dt>
                <dd><input id="discount" name="discount" type="number" min="0" max="100" step="any" [class]="ui.input + ' w-24 text-right'" [(ngModel)]="model.discountPercent" /></dd>
              </div>
              @if (t.discount) {
                <div class="flex justify-between"><dt class="text-slate-500">Discount</dt><dd class="text-emerald-700">−{{ t.discount | currency: biz.currency }}</dd></div>
              }
              <div class="flex justify-between"><dt class="text-slate-500">Tax</dt><dd>{{ t.tax | currency: biz.currency }}</dd></div>
              <div class="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                <dt>Total</dt><dd>{{ t.total | currency: biz.currency }}</dd>
              </div>
            </dl>
            <div class="mt-6 grid gap-2">
              <button type="button" [class]="ui.btnPrimary" [disabled]="saving() || f.invalid || model.items.length === 0" (click)="save(true)">
                <app-icon name="send" size="size-4" />{{ status() === 'draft' || !id() ? 'Save & send' : 'Save & re-send' }}
              </button>
              <button type="submit" [class]="ui.btnSecondary" [disabled]="saving() || f.invalid || model.items.length === 0">Save as draft</button>
            </div>
            @if (f.invalid || model.items.length === 0) {
              <p class="mt-3 text-xs text-slate-500">Fill in the title, customer, dates and at least one complete line item to save.</p>
            }
          </section>
        </aside>
      </form>
    }
  `,
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
