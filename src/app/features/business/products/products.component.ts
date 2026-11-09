import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { Product } from '../../../core/models';
import { BusinessApiService, ProductInput } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

type ProductForm = ProductInput & { id?: string };

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, FormsModule, PageHeaderComponent, LoadingComponent, EmptyStateComponent, IconComponent, ModalComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
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
