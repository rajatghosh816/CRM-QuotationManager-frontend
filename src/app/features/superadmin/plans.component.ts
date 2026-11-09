import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { Plan } from '../../core/models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { ModalComponent } from '../../shared/modal.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ui } from '../../shared/ui';

type PlanForm = Omit<Plan, 'id' | 'features'> & { id?: string; featuresText: string };

@Component({
  selector: 'app-plans',
  imports: [CurrencyPipe, FormsModule, PageHeaderComponent, LoadingComponent, ModalComponent, IconComponent],
  template: `
    <app-page-header title="Subscription plans" subtitle="What businesses pay and what they get.">
      <button type="button" [class]="ui.btnPrimary" (click)="openNew()"><app-icon name="plus" size="size-4" />New plan</button>
    </app-page-header>

    @if (loading()) {
      <app-loading />
    } @else {
      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        @for (p of plans(); track p.id) {
          <article [class]="ui.card + ' flex flex-col p-6'">
            <h2 class="text-lg font-semibold text-slate-900">{{ p.name }}</h2>
            <p class="mt-2">
              <span class="text-3xl font-semibold tracking-tight text-slate-900">{{ p.priceMonthly | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
              <span class="text-sm text-slate-500">/month</span>
            </p>
            <dl class="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div><dt class="text-slate-500">Users</dt><dd class="font-medium text-slate-900">{{ p.maxUsers }}</dd></div>
              <div><dt class="text-slate-500">Quotes / month</dt><dd class="font-medium text-slate-900">{{ p.maxQuotationsPerMonth }}</dd></div>
            </dl>
            <ul class="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              @for (f of p.features; track f) {
                <li class="flex gap-2"><app-icon name="check" size="size-4 text-emerald-600 mt-0.5" />{{ f }}</li>
              }
            </ul>
            <div class="mt-6 flex gap-2 border-t border-slate-100 pt-4">
              <button type="button" [class]="ui.btnSecondary" (click)="openEdit(p)">Edit</button>
              <button type="button" [class]="ui.btnGhostDanger" (click)="remove(p)">Delete</button>
            </div>
          </article>
        }
      </div>
    }

    @if (form(); as m) {
      <app-modal [title]="m.id ? 'Edit plan' : 'New plan'" (closed)="form.set(null)">
        <form #f="ngForm" (ngSubmit)="save(m)" class="space-y-4">
          <div>
            <label [class]="ui.label" for="pname">Name *</label>
            <input id="pname" name="name" required [class]="ui.input" [(ngModel)]="m.name" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label [class]="ui.label" for="price">Price (USD) *</label>
              <input id="price" name="price" type="number" min="0" required [class]="ui.input" [(ngModel)]="m.priceMonthly" />
            </div>
            <div>
              <label [class]="ui.label" for="musers">Max users</label>
              <input id="musers" name="maxUsers" type="number" min="1" [class]="ui.input" [(ngModel)]="m.maxUsers" />
            </div>
            <div>
              <label [class]="ui.label" for="mquotes">Quotes / mo</label>
              <input id="mquotes" name="maxQuotes" type="number" min="1" [class]="ui.input" [(ngModel)]="m.maxQuotationsPerMonth" />
            </div>
          </div>
          <div>
            <label [class]="ui.label" for="features">Features (one per line)</label>
            <textarea id="features" name="features" rows="4" [class]="ui.input" [(ngModel)]="m.featuresText"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" [class]="ui.btnSecondary" (click)="form.set(null)">Cancel</button>
            <button type="submit" [class]="ui.btnPrimary" [disabled]="saving() || f.invalid">Save plan</button>
          </div>
        </form>
      </app-modal>
    }
  `,
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
