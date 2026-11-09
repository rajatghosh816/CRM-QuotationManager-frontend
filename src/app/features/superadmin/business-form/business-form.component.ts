import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { CURRENCIES, CreateBusinessRequest, Plan } from '../../../core/models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-business-form',
  imports: [FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent],
  templateUrl: './business-form.component.html',
  styleUrl: './business-form.component.scss',
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
