import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api';
import { Customer } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

@Component({
  selector: 'app-customers',
  imports: [DatePipe, FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, EmptyStateComponent, IconComponent, CustomerFormComponent],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  ui = ui;

  customers = signal<Customer[]>([]);
  loading = signal(true);
  query = signal('');
  editing = signal<Customer | 'new' | null>(this.route.snapshot.queryParamMap.has('new') ? 'new' : null);

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.customers().filter((c) => !q || [c.name, c.company, c.email].some((v) => v.toLowerCase().includes(q)));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.customers().subscribe({
      next: (list) => {
        this.customers.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  closeForm(): void {
    this.editing.set(null);
    if (this.route.snapshot.queryParamMap.has('new')) this.router.navigate([], { queryParams: {} });
  }

  onSaved(): void {
    this.closeForm();
    this.load();
  }

  remove(c: Customer): void {
    if (!confirm(`Delete ${c.name}? Their portal login will be removed too.`)) return;
    this.api.deleteCustomer(c.id).subscribe({
      next: () => {
        this.toast.success(`${c.name} deleted.`);
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
