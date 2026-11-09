import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { CURRENCIES, CreateBusinessRequest, Plan } from '../../core/models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-business-form',
  imports: [FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent],
  template: `
    <app-page-header [title]="id() ? 'Edit business' : 'Add business'"
      [subtitle]="id() ? model.name : 'Create the company account and its first admin login.'">
      <a back routerLink="/superadmin/businesses" [class]="ui.btnGhost + ' mb-2 -ml-2'"><app-icon name="arrowLeft" size="size-4" />Businesses</a>
    </app-page-header>

    @if (loading()) {
      <app-loading />
    } @else {
      <form #f="ngForm" (ngSubmit)="save()" class="space-y-6">
        <section [class]="ui.card">
          <h2 class="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">Company</h2>
          <div class="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label [class]="ui.label" for="name">Business name *</label>
              <input id="name" name="name" required [class]="ui.input" [(ngModel)]="model.name" />
            </div>
            <div>
              <label [class]="ui.label" for="industry">Industry</label>
              <input id="industry" name="industry" [class]="ui.input" [(ngModel)]="model.industry" />
            </div>
            <div>
              <label [class]="ui.label" for="email">Company email *</label>
              <input id="email" name="email" type="email" required email [class]="ui.input" [(ngModel)]="model.email" />
            </div>
            <div>
              <label [class]="ui.label" for="phone">Phone</label>
              <input id="phone" name="phone" [class]="ui.input" [(ngModel)]="model.phone" />
            </div>
            <div class="sm:col-span-2">
              <label [class]="ui.label" for="address">Address</label>
              <textarea id="address" name="address" rows="2" [class]="ui.input" [(ngModel)]="model.address"></textarea>
            </div>
          </div>
        </section>

        <section [class]="ui.card">
          <h2 class="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">Subscription &amp; defaults</h2>
          <div class="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <label [class]="ui.label" for="plan">Plan *</label>
              <select id="plan" name="planId" required [class]="ui.input" [(ngModel)]="model.planId">
                @for (p of plans(); track p.id) {
                  <option [value]="p.id">{{ p.name }} — {{ '$' + p.priceMonthly }}/mo</option>
                }
              </select>
            </div>
            <div>
              <label [class]="ui.label" for="status">Status *</label>
              <select id="status" name="status" required [class]="ui.input" [(ngModel)]="model.status">
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label [class]="ui.label" for="currency">Currency *</label>
              <select id="currency" name="currency" required [class]="ui.input" [(ngModel)]="model.currency">
                @for (c of currencies; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div>
              <label [class]="ui.label" for="prefix">Quotation prefix *</label>
              <input id="prefix" name="quotePrefix" required maxlength="6" [class]="ui.input + ' uppercase'" [(ngModel)]="model.quotePrefix" />
              <p class="mt-1 text-xs text-slate-500">Numbers look like {{ (model.quotePrefix || 'QUO').toUpperCase() }}-0001</p>
            </div>
            <div>
              <label [class]="ui.label" for="tax">Default tax rate (%)</label>
              <input id="tax" name="defaultTaxRate" type="number" min="0" max="100" [class]="ui.input" [(ngModel)]="model.defaultTaxRate" />
            </div>
            <div class="sm:col-span-3">
              <label [class]="ui.label" for="terms">Default terms</label>
              <textarea id="terms" name="defaultTerms" rows="2" [class]="ui.input" [(ngModel)]="model.defaultTerms"></textarea>
            </div>
          </div>
        </section>

        @if (!id()) {
          <section [class]="ui.card">
            <div class="border-b border-slate-200 px-5 py-4">
              <h2 class="text-base font-semibold text-slate-900">Business admin login</h2>
              <p class="text-sm text-slate-500">The person who will manage this business's quotations.</p>
            </div>
            <div class="grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <label [class]="ui.label" for="adminName">Full name *</label>
                <input id="adminName" name="adminName" required [class]="ui.input" [(ngModel)]="model.adminName" />
              </div>
              <div>
                <label [class]="ui.label" for="adminEmail">Email *</label>
                <input id="adminEmail" name="adminEmail" type="email" required email [class]="ui.input" [(ngModel)]="model.adminEmail" />
              </div>
              <div>
                <label [class]="ui.label" for="adminPassword">Temporary password *</label>
                <input id="adminPassword" name="adminPassword" required minlength="6" [class]="ui.input" [(ngModel)]="model.adminPassword" />
              </div>
            </div>
          </section>
        }

        <div class="flex justify-end gap-3">
          <a routerLink="/superadmin/businesses" [class]="ui.btnSecondary">Cancel</a>
          <button type="submit" [class]="ui.btnPrimary" [disabled]="saving() || f.invalid">
            {{ saving() ? 'Saving…' : id() ? 'Save changes' : 'Create business' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class BusinessFormComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  ui = ui;
  currencies = CURRENCIES;

  /** Route param; empty when creating. */
  id = input<string>();

  plans = signal<Plan[]>([]);
  loading = signal(true);
  saving = signal(false);

  model: CreateBusinessRequest = {
    name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    planId: '',
    status: 'trial',
    currency: 'INR',
    defaultTaxRate: 18,
    quotePrefix: '',
    defaultTerms: 'Prices valid until the expiry date shown on this quotation.',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  };

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      forkJoin([this.api.plans(), this.api.business(id)]).subscribe({
        next: ([plans, b]) => {
          this.plans.set(plans);
          Object.assign(this.model, b);
          this.loading.set(false);
        },
        error: (e) => {
          this.toast.error(errorMessage(e));
          this.router.navigateByUrl('/superadmin/businesses');
        },
      });
    } else {
      this.api.plans().subscribe((plans) => {
        this.plans.set(plans);
        this.model.planId = plans[0]?.id ?? '';
        this.loading.set(false);
      });
    }
  }

  save(): void {
    this.saving.set(true);
    const id = this.id();
    const { adminName, adminEmail, adminPassword, ...fields } = this.model;
    const req = id
      ? this.api.updateBusiness(id, {
          name: fields.name, email: fields.email, phone: fields.phone, address: fields.address,
          industry: fields.industry, planId: fields.planId, status: fields.status, currency: fields.currency,
          defaultTaxRate: Number(fields.defaultTaxRate) || 0, quotePrefix: fields.quotePrefix, defaultTerms: fields.defaultTerms,
        })
      : this.api.createBusiness({ ...this.model, defaultTaxRate: Number(this.model.defaultTaxRate) || 0 });
    req.subscribe({
      next: (b) => {
        this.toast.success(id ? 'Business updated.' : `${b.name} created. ${adminEmail} can now sign in.`);
        this.router.navigateByUrl('/superadmin/businesses');
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
