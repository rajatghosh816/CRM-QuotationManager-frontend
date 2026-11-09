import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../../core/api';
import { QuotationDetail } from '../../core/models';
import { quotationTotals } from '../../core/quotation-math';
import { BusinessApiService } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ActivityLogComponent } from '../../shared/activity-log.component';
import { IconComponent } from '../../shared/icon.component';
import { LoadingComponent } from '../../shared/loading.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { QuotationDocumentComponent } from '../../shared/quotation-document.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ui } from '../../shared/ui';

@Component({
  selector: 'app-quotation-view',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent, StatusBadgeComponent, QuotationDocumentComponent, ActivityLogComponent],
  template: `
    @if (q(); as q) {
      <div class="print:hidden">
        <app-page-header [title]="q.number" [subtitle]="q.title">
          <a back routerLink="/business/quotations" [class]="ui.btnGhost + ' mb-2 -ml-2'"><app-icon name="arrowLeft" size="size-4" />Quotations</a>
          @if (q.status !== 'accepted') {
            <a [routerLink]="['edit']" [class]="ui.btnSecondary"><app-icon name="pencil" size="size-4" />Edit</a>
          }
          <button type="button" [class]="ui.btnSecondary" (click)="duplicate()" [disabled]="busy()"><app-icon name="copy" size="size-4" />Duplicate</button>
          <button type="button" [class]="ui.btnSecondary" (click)="print()"><app-icon name="printer" size="size-4" />Print / PDF</button>
          @if (canSend()) {
            <button type="button" [class]="ui.btnPrimary" (click)="send()" [disabled]="busy()">
              <app-icon name="send" size="size-4" />{{ q.status === 'draft' ? 'Send to customer' : 'Re-send' }}
            </button>
          }
        </app-page-header>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <app-quotation-document [quotation]="q" />
        </div>

        <aside class="space-y-6 print:hidden">
          <section [class]="ui.card + ' p-5'">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-slate-900">Status</h2>
              <app-status-badge [status]="q.status" />
            </div>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">Total</dt><dd class="font-semibold text-slate-900">{{ total() | currency: q.business.currency }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Customer</dt><dd><a [routerLink]="['/business/customers', q.customer.id]" [class]="ui.link">{{ q.customer.name }}</a></dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Valid until</dt><dd class="text-slate-900">{{ q.validUntil | date: 'mediumDate' }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Last updated</dt><dd class="text-slate-900">{{ q.updatedAt | date: 'MMM d, h:mm a' }}</dd></div>
            </dl>
            @if (q.customerComment) {
              <div class="mt-4 rounded-lg p-3 text-sm" [class]="q.status === 'rejected' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'">
                <p class="font-medium">Customer's comment</p>
                <p class="mt-1">“{{ q.customerComment }}”</p>
              </div>
            }
            @if (q.status === 'draft') {
              <p class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">The customer can't see this quotation until you send it.</p>
            }
            @if (q.status === 'expired') {
              <p class="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This quotation expired. Edit it to extend the validity date, then send it again.</p>
            }
          </section>

          <section [class]="ui.card + ' p-5'">
            <h2 class="mb-4 text-base font-semibold text-slate-900">Activity</h2>
            <app-activity-log [activity]="q.activity" />
          </section>

          <button type="button" [class]="ui.btnGhostDanger + ' w-full'" (click)="remove()" [disabled]="busy()">
            <app-icon name="trash" size="size-4" />Delete quotation
          </button>
        </aside>
      </div>
    } @else {
      <app-loading />
    }
  `,
})
export class QuotationViewComponent implements OnInit {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  ui = ui;

  id = input.required<string>();
  q = signal<QuotationDetail | null>(null);
  busy = signal(false);

  total = computed(() => {
    const q = this.q();
    return q ? quotationTotals(q.items, q.discountPercent).total : 0;
  });

  canSend = computed(() => {
    const q = this.q();
    if (!q || q.status === 'accepted') return false;
    return q.validUntil >= new Date().toISOString().slice(0, 10);
  });

  ngOnInit(): void {
    this.api.quotation(this.id()).subscribe({
      next: (q) => this.q.set(q),
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.router.navigateByUrl('/business/quotations');
      },
    });
  }

  send(): void {
    this.run(this.api.sendQuotation(this.id()), (q) => {
      this.q.set(q);
      this.toast.success(`Sent to ${q.customer.name} (${q.customer.email}).`);
    });
  }

  duplicate(): void {
    this.run(this.api.duplicateQuotation(this.id()), (q) => {
      this.toast.success(`Created ${q.number} as a draft copy.`);
      this.router.navigate(['/business/quotations', q.id, 'edit']);
    });
  }

  remove(): void {
    if (!confirm(`Delete ${this.q()?.number}? This cannot be undone.`)) return;
    this.run(this.api.deleteQuotation(this.id()), () => {
      this.toast.success('Quotation deleted.');
      this.router.navigateByUrl('/business/quotations');
    });
  }

  print(): void {
    window.print();
  }

  private run<T>(req: Observable<T>, done: (result: T) => void): void {
    this.busy.set(true);
    req.subscribe({
      next: (r) => {
        this.busy.set(false);
        done(r);
      },
      error: (e) => {
        this.busy.set(false);
        this.toast.error(errorMessage(e));
      },
    });
  }
}
