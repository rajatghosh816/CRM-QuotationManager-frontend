import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Role, User } from '../../core/models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ui } from '../../shared/ui';

const ROLE_LABEL: Record<Role, string> = { superadmin: 'Super admin', business_admin: 'Business admin', customer: 'Customer' };

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, LoadingComponent, EmptyStateComponent, IconComponent],
  template: `
    <app-page-header title="Users" subtitle="Everyone who can sign in to the platform." />

    <div [class]="ui.card + ' overflow-hidden'">
      <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
        <div class="relative flex-1">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><app-icon name="search" size="size-4" /></span>
          <input type="search" placeholder="Search by name or email" [class]="ui.input + ' pl-9'"
            [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
        <select [class]="ui.input + ' sm:w-48'" [ngModel]="role()" (ngModelChange)="role.set($event)" aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="superadmin">Super admins</option>
          <option value="business_admin">Business admins</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="users" title="No users match" />
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th [class]="ui.th">Name</th><th [class]="ui.th">Role</th><th [class]="ui.th">Business</th>
                <th [class]="ui.th">Status</th><th [class]="ui.th">Created</th><th [class]="ui.th"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (u of filtered(); track u.id) {
                <tr class="hover:bg-slate-50">
                  <td [class]="ui.td"><p class="font-medium text-slate-900">{{ u.name }}</p><p class="text-xs text-slate-500">{{ u.email }}</p></td>
                  <td [class]="ui.td">{{ roleLabel[u.role] }}</td>
                  <td [class]="ui.td">{{ u.businessId ? (businessNames()[u.businessId] ?? '—') : '—' }}</td>
                  <td [class]="ui.td"><app-status-badge [status]="u.status" /></td>
                  <td [class]="ui.td + ' whitespace-nowrap'">{{ u.createdAt | date: 'mediumDate' }}</td>
                  <td [class]="ui.td + ' text-right'">
                    @if (u.id !== me()?.id) {
                      <button type="button" [class]="u.status === 'active' ? ui.btnGhostDanger : ui.btnGhost" (click)="toggle(u)">
                        {{ u.status === 'active' ? 'Disable' : 'Enable' }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class UsersComponent {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  me = inject(AuthService).user;
  ui = ui;
  roleLabel = ROLE_LABEL;

  users = signal<User[]>([]);
  businessNames = signal<Record<string, string>>({});
  loading = signal(true);
  query = signal('');
  role = signal('');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.users().filter(
      (u) => (!this.role() || u.role === this.role()) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  });

  constructor() {
    forkJoin([this.api.users(), this.api.businesses()]).subscribe({
      next: ([users, businesses]) => {
        this.users.set(users);
        this.businessNames.set(Object.fromEntries(businesses.map((b) => [b.id, b.name])));
        this.loading.set(false);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  toggle(u: User): void {
    const status = u.status === 'active' ? 'disabled' : 'active';
    this.api.setUserStatus(u.id, status).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.toast.success(`${u.name} ${status === 'active' ? 'enabled' : 'disabled'}.`);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
