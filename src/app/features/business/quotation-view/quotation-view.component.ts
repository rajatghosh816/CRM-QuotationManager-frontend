import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../../../core/api';
import { QuotationDetail } from '../../../core/models';
import { quotationTotals } from '../../../core/quotation-math';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ActivityLogComponent } from '../../../shared/activity-log/activity-log.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { QuotationDocumentComponent } from '../../../shared/quotation-document/quotation-document.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-quotation-view',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent, StatusBadgeComponent, QuotationDocumentComponent, ActivityLogComponent],
  templateUrl: './quotation-view.component.html',
  styleUrl: './quotation-view.component.scss',
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
