import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../../core/api';
import { Plan } from '../../../core/models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

type PlanForm = Omit<Plan, 'id' | 'features'> & { id?: string; featuresText: string };

@Component({
  selector: 'app-plans',
  imports: [CurrencyPipe, FormsModule, PageHeaderComponent, LoadingComponent, ModalComponent, IconComponent],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
})
export class PlansComponent {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  ui = ui;
  plans = signal<Plan[]>([]);
  loading = signal(true);
  saving = signal(false);
  form = signal<PlanForm | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.api.plans().subscribe({
      next: (p) => {
        this.plans.set(p);
        this.loading.set(false);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  openNew(): void {
    this.form.set({ name: '', priceMonthly: 0, maxUsers: 5, maxQuotationsPerMonth: 100, featuresText: '' });
  }

  openEdit(p: Plan): void {
    const { features, ...rest } = p;
    this.form.set({ ...rest, featuresText: features.join('\n') });
  }

  save(m: PlanForm): void {
    const body: Omit<Plan, 'id'> = {
      name: m.name.trim(),
      priceMonthly: Number(m.priceMonthly),
      maxUsers: Number(m.maxUsers),
      maxQuotationsPerMonth: Number(m.maxQuotationsPerMonth),
      features: m.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    this.saving.set(true);
    (m.id ? this.api.updatePlan(m.id, body) : this.api.createPlan(body)).subscribe({
      next: () => {
        this.toast.success('Plan saved.');
        this.form.set(null);
        this.saving.set(false);
        this.load();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }

  remove(p: Plan): void {
    if (!confirm(`Delete the ${p.name} plan?`)) return;
    this.api.deletePlan(p.id).subscribe({
      next: () => {
        this.toast.success('Plan deleted.');
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
