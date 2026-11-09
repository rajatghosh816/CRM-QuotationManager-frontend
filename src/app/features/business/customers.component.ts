import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { Customer } from '../../core/models';
import { BusinessApiService } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';
import { CustomerFormComponent } from './customer-form.component';

@Component({
  selector: 'app-customers',
  imports: [DatePipe, FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, EmptyStateComponent, IconComponent, CustomerFormComponent],
  template: `
    <app-page-header title="Customers" subtitle="The people and companies you send quotations to.">
      <button type="button" [class]="ui.btnPrimary" (click)="editing.set('new')"><app-icon name="plus" size="size-4" />Add customer</button>
    </app-page-header>

    <div [class]="ui.card + ' overflow-hidden'">
      <div class="border-b border-slate-200 p-4">
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><app-icon name="search" size="size-4" /></span>
          <input type="search" placeholder="Search by name, company or email" [class]="ui.input + ' pl-9'"
            [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="users" title="No customers found" message="Add a customer to start sending quotations.">
          <button type="button" [class]="ui.btnPrimary" (click)="editing.set('new')">Add customer</button>
        </app-empty-state>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th [class]="ui.th">Name</th><th [class]="ui.th">Company</th><th [class]="ui.th">Contact</th>
                <th [class]="ui.th">Added</th><th [class]="ui.th"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (c of filtered(); track c.id) {
                <tr class="hover:bg-slate-50">
                  <td [class]="ui.td"><a [routerLink]="[c.id]" class="font-medium text-slate-900 hover:text-indigo-600">{{ c.name }}</a></td>
                  <td [class]="ui.td">{{ c.company || '—' }}</td>
                  <td [class]="ui.td"><p>{{ c.email }}</p><p class="text-xs text-slate-500">{{ c.phone }}</p></td>
                  <td [class]="ui.td + ' whitespace-nowrap'">{{ c.createdAt | date: 'mediumDate' }}</td>
                  <td [class]="ui.td + ' text-right whitespace-nowrap'">
                    <a routerLink="/business/quotations/new" [queryParams]="{ customerId: c.id }" [class]="ui.btnGhost">New quote</a>
                    <button type="button" [class]="ui.btnGhost" (click)="editing.set(c)">Edit</button>
                    <button type="button" [class]="ui.btnGhostDanger" (click)="remove(c)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (editing(); as e) {
      <app-customer-form [customer]="e === 'new' ? null : e" (closed)="closeForm()" (saved)="onSaved()" />
    }
  `,
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
