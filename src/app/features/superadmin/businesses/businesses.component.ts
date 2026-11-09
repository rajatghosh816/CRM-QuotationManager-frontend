import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api';
import { BusinessOverview, BusinessStatus } from '../../../core/models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-businesses',
  imports: [DatePipe, FormsModule, RouterLink, PageHeaderComponent, StatusBadgeComponent, LoadingComponent, EmptyStateComponent, IconComponent],
  templateUrl: './businesses.component.html',
  styleUrl: './businesses.component.scss',
})
export class BusinessesComponent {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  ui = ui;

  businesses = signal<BusinessOverview[]>([]);
  loading = signal(true);
  query = signal('');
  status = signal('');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.businesses().filter(
      (b) =>
        (!this.status() || b.status === this.status()) &&
        (!q || [b.name, b.adminName, b.adminEmail, b.email].some((v) => v.toLowerCase().includes(q))),
    );
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.businesses().subscribe({
      next: (list) => {
        this.businesses.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  setStatus(b: BusinessOverview, status: BusinessStatus): void {
    const done = status === 'suspended' ? 'Suspended' : 'Activated';
    if (status === 'suspended' && !confirm(`Suspend ${b.name}? Its admins and customers will not be able to sign in.`)) return;
    const { id, createdAt, planName, adminName, adminEmail, customerCount, quotationCount, ...fields } = b;
    this.api.updateBusiness(id, { ...fields, status }).subscribe({
      next: () => {
        this.toast.success(`${done} ${b.name}.`);
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  remove(b: BusinessOverview): void {
    if (!confirm(`Delete ${b.name}? This removes all its customers, products, quotations and users. This cannot be undone.`)) return;
    this.api.deleteBusiness(b.id).subscribe({
      next: () => {
        this.toast.success(`${b.name} deleted.`);
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
