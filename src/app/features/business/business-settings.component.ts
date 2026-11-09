import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { Business, CURRENCIES } from '../../core/models';
import { BusinessApiService } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ChangePasswordComponent } from '../../shared/change-password.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-business-settings',
  imports: [FormsModule, PageHeaderComponent, LoadingComponent, ChangePasswordComponent],
  template: `
    <app-page-header title="Settings" subtitle="Your company details appear on every quotation." />

    @if (model(); as m) {
      <div class="space-y-6">
        <form #f="ngForm" (ngSubmit)="save(m)" [class]="ui.card">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-base font-semibold text-slate-900">Business profile</h2>
          </div>
          <div class="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label [class]="ui.label" for="name">Business name *</label>
              <input id="name" name="name" required [class]="ui.input" [(ngModel)]="m.name" />
            </div>
            <div>
              <label [class]="ui.label" for="industry">Industry</label>
              <input id="industry" name="industry" [class]="ui.input" [(ngModel)]="m.industry" />
            </div>
            <div>
              <label [class]="ui.label" for="email">Email *</label>
              <input id="email" name="email" type="email" required email [class]="ui.input" [(ngModel)]="m.email" />
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
          <div class="border-y border-slate-200 px-5 py-4">
            <h2 class="text-base font-semibold text-slate-900">Quotation defaults</h2>
          </div>
          <div class="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <label [class]="ui.label" for="currency">Currency *</label>
              <select id="currency" name="currency" required [class]="ui.input" [(ngModel)]="m.currency">
                @for (c of currencies; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div>
              <label [class]="ui.label" for="tax">Default tax rate (%)</label>
              <input id="tax" name="defaultTaxRate" type="number" min="0" max="100" [class]="ui.input" [(ngModel)]="m.defaultTaxRate" />
            </div>
            <div>
              <label [class]="ui.label" for="prefix">Number prefix *</label>
              <input id="prefix" name="quotePrefix" required maxlength="6" [class]="ui.input + ' uppercase'" [(ngModel)]="m.quotePrefix" />
            </div>
            <div class="sm:col-span-3">
              <label [class]="ui.label" for="terms">Default terms &amp; conditions</label>
              <textarea id="terms" name="defaultTerms" rows="3" [class]="ui.input" [(ngModel)]="m.defaultTerms"></textarea>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            <p class="text-xs text-slate-500">Plan and account status are managed by the platform administrator.</p>
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
export class BusinessSettingsComponent {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  ui = ui;
  currencies = CURRENCIES;
  model = signal<Business | null>(null);
  saving = signal(false);

  constructor() {
    this.api.profile().subscribe({ next: (b) => this.model.set(b), error: (e) => this.toast.error(errorMessage(e)) });
  }

  save(m: Business): void {
    this.saving.set(true);
    this.api.updateProfile(m).subscribe({
      next: (b) => {
        this.model.set(b);
        this.toast.success('Settings saved.');
        this.saving.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
