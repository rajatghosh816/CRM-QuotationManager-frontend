import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Product } from '../../core/models';
import { BusinessApiService, ProductInput } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { ModalComponent } from '../../shared/modal.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

type ProductForm = ProductInput & { id?: string };

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, FormsModule, PageHeaderComponent, LoadingComponent, EmptyStateComponent, IconComponent, ModalComponent],
  template: `
    <app-page-header title="Products & services" subtitle="Your price list. Add these to quotations in one click.">
      <button type="button" [class]="ui.btnPrimary" (click)="openNew()"><app-icon name="plus" size="size-4" />Add product</button>
    </app-page-header>

    <div [class]="ui.card + ' overflow-hidden'">
      <div class="border-b border-slate-200 p-4">
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><app-icon name="search" size="size-4" /></span>
          <input type="search" placeholder="Search by name or SKU" [class]="ui.input + ' pl-9'" [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="cube" title="No products found" message="Add the products and services you usually quote for.">
          <button type="button" [class]="ui.btnPrimary" (click)="openNew()">Add product</button>
        </app-empty-state>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th [class]="ui.th">Product</th><th [class]="ui.th">SKU</th><th [class]="ui.th + ' text-right'">Price</th>
                <th [class]="ui.th + ' text-right'">Tax</th><th [class]="ui.th">Status</th><th [class]="ui.th"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (p of filtered(); track p.id) {
                <tr class="hover:bg-slate-50" [class.opacity-60]="!p.active">
                  <td [class]="ui.td"><p class="font-medium text-slate-900">{{ p.name }}</p><p class="max-w-md truncate text-xs text-slate-500">{{ p.description }}</p></td>
                  <td [class]="ui.td + ' font-mono text-xs'">{{ p.sku || '—' }}</td>
                  <td [class]="ui.td + ' text-right whitespace-nowrap'">{{ p.unitPrice | currency: currency() }} <span class="text-xs text-slate-500">/ {{ p.unit }}</span></td>
                  <td [class]="ui.td + ' text-right'">{{ p.taxRate }}%</td>
                  <td [class]="ui.td">
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ p.active ? 'Active' : 'Hidden' }}</span>
                  </td>
                  <td [class]="ui.td + ' text-right whitespace-nowrap'">
                    <button type="button" [class]="ui.btnGhost" (click)="openEdit(p)">Edit</button>
                    <button type="button" [class]="ui.btnGhostDanger" (click)="remove(p)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (form(); as m) {
      <app-modal [title]="m.id ? 'Edit product' : 'Add product'" (closed)="form.set(null)">
        <form #f="ngForm" (ngSubmit)="save(m)" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="sm:col-span-2">
              <label [class]="ui.label" for="pname">Name *</label>
              <input id="pname" name="name" required [class]="ui.input" [(ngModel)]="m.name" />
            </div>
            <div>
              <label [class]="ui.label" for="sku">SKU</label>
              <input id="sku" name="sku" [class]="ui.input" [(ngModel)]="m.sku" />
            </div>
          </div>
          <div>
            <label [class]="ui.label" for="pdesc">Description</label>
            <textarea id="pdesc" name="description" rows="2" [class]="ui.input" [(ngModel)]="m.description"></textarea>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label [class]="ui.label" for="price">Unit price ({{ currency() }}) *</label>
              <input id="price" name="unitPrice" type="number" min="0" step="any" required [class]="ui.input" [(ngModel)]="m.unitPrice" />
            </div>
            <div>
              <label [class]="ui.label" for="unit">Unit</label>
              <input id="unit" name="unit" placeholder="unit, hour, sq ft…" [class]="ui.input" [(ngModel)]="m.unit" />
            </div>
            <div>
              <label [class]="ui.label" for="ptax">Tax rate (%)</label>
              <input id="ptax" name="taxRate" type="number" min="0" max="100" step="any" [class]="ui.input" [(ngModel)]="m.taxRate" />
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="active" class="size-4 rounded border-slate-300 text-indigo-600" [(ngModel)]="m.active" />
            Show in the quotation editor
          </label>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" [class]="ui.btnSecondary" (click)="form.set(null)">Cancel</button>
            <button type="submit" [class]="ui.btnPrimary" [disabled]="saving() || f.invalid">Save product</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class ProductsComponent {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  ui = ui;

  products = signal<Product[]>([]);
  currency = signal('USD');
  defaultTax = 0;
  loading = signal(true);
  saving = signal(false);
  query = signal('');
  form = signal<ProductForm | null>(null);

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.products().filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });

  constructor() {
    forkJoin({ products: this.api.products(), business: this.api.profile() }).subscribe({
      next: ({ products, business }) => {
        this.products.set(products);
        this.currency.set(business.currency);
        this.defaultTax = business.defaultTaxRate;
        this.loading.set(false);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  load(): void {
    this.api.products().subscribe((p) => this.products.set(p));
  }

  openNew(): void {
    this.form.set({ name: '', sku: '', description: '', unit: 'unit', unitPrice: 0, taxRate: this.defaultTax, active: true });
  }

  openEdit(p: Product): void {
    const { businessId, ...rest } = p;
    this.form.set({ ...rest });
  }

  save(m: ProductForm): void {
    const { id, ...fields } = m;
    const body: ProductInput = { ...fields, unitPrice: Number(fields.unitPrice), taxRate: Number(fields.taxRate) || 0 };
    this.saving.set(true);
    (id ? this.api.updateProduct(id, body) : this.api.createProduct(body)).subscribe({
      next: () => {
        this.toast.success('Product saved.');
        this.form.set(null);
        this.saving.set(false);
        this.load();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }

  remove(p: Product): void {
    if (!confirm(`Delete ${p.name}? Existing quotations keep their lines.`)) return;
    this.api.deleteProduct(p.id).subscribe({
      next: () => {
        this.toast.success('Product deleted.');
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
