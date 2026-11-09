import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { Role, User } from '../../../core/models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

const ROLE_LABEL: Record<Role, string> = { superadmin: 'Super admin', business_admin: 'Business admin', customer: 'Customer' };

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, LoadingComponent, EmptyStateComponent, IconComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
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
