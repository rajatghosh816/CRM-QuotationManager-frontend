import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordComponent } from '../../shared/change-password.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-admin-account',
  imports: [PageHeaderComponent, ChangePasswordComponent],
  template: `
    <app-page-header title="My account" />
    <div class="space-y-6">
      <section [class]="ui.card + ' p-5'">
        <dl class="grid gap-4 sm:grid-cols-3">
          <div><dt class="text-sm text-slate-500">Name</dt><dd class="font-medium text-slate-900">{{ user()?.name }}</dd></div>
          <div><dt class="text-sm text-slate-500">Email</dt><dd class="font-medium text-slate-900">{{ user()?.email }}</dd></div>
          <div><dt class="text-sm text-slate-500">Role</dt><dd class="font-medium text-slate-900">Super admin</dd></div>
        </dl>
      </section>
      <app-change-password />
    </div>
  `,
})
export class AdminAccountComponent {
  user = inject(AuthService).user;
  ui = ui;
}
