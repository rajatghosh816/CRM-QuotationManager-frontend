import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { Customer } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PortalApiService } from '../../core/services/portal-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ChangePasswordComponent } from '../../shared/change-password.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-portal-profile',
  imports: [FormsModule, PageHeaderComponent, LoadingComponent, ChangePasswordComponent],
  template: `
    <app-page-header title="My profile" subtitle="Your contact details appear on the quotations you receive." />
    @if (model(); as m) {
      <div class="space-y-6">
        <form #f="ngForm" (ngSubmit)="save(m)" [class]="ui.card">
          <div class="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label [class]="ui.label" for="name">Name *</label>
              <input id="name" name="name" required [class]="ui.input" [(ngModel)]="m.name" />
            </div>
            <div>
              <label [class]="ui.label" for="company">Company</label>
              <input id="company" name="company" [class]="ui.input" [(ngModel)]="m.company" />
            </div>
            <div>
              <label [class]="ui.label" for="email">Email</label>
              <input id="email" name="email" disabled [class]="ui.input" [ngModel]="m.email" />
              <p class="mt-1 text-xs text-slate-500">To change your sign-in email, contact the business.</p>
            </div>
            <div>
              <label [class]="ui.label" for="phone">Phone</label>
              <input id="phone" name="phone" [class]="ui.input" [(ngModel)]="m.phone" />
            </div>
            <div class="sm:col-span-2">
              <label [class]="ui.label" for="address">Address</label>
              <textarea id="address" name="address" rows="2" [class]="ui.input" [(ngModel)]="m.address"></textarea>
            </div>
          </div>
          <div class="flex justify-end border-t border-slate-200 px-5 py-3">
            <button type="submit" [class]="ui.btnPrimary" [disabled]="saving() || f.invalid">Save changes</button>
          </div>
        </form>
        <app-change-password />
      </div>
    } @else {
      <app-loading />
    }
  `,
})
export class PortalProfileComponent {
  private api = inject(PortalApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  ui = ui;
  model = signal<Customer | null>(null);
  saving = signal(false);

  constructor() {
    this.api.profile().subscribe({ next: (c) => this.model.set(c), error: (e) => this.toast.error(errorMessage(e)) });
  }

  save(m: Customer): void {
    this.saving.set(true);
    this.api.updateProfile({ name: m.name, company: m.company, phone: m.phone, address: m.address }).subscribe({
      next: (c) => {
        this.model.set(c);
        this.saving.set(false);
        this.toast.success('Profile saved.');
        this.auth.refreshUser().subscribe();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
