import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api';
import { QuotationDetail } from '../../../core/models';
import { quotationTotals } from '../../../core/quotation-math';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { QuotationDocumentComponent } from '../../../shared/quotation-document/quotation-document.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-portal-quotation',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, PageHeaderComponent, LoadingComponent, IconComponent, ModalComponent, StatusBadgeComponent, QuotationDocumentComponent],
  templateUrl: './portal-quotation.component.html',
  styleUrl: './portal-quotation.component.scss',
})
export class PortalQuotationComponent implements OnInit {
  private api = inject(PortalApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  ui = ui;

  id = input.required<string>();
  q = signal<QuotationDetail | null>(null);
  decision = signal<'accept' | 'reject' | null>(null);
  busy = signal(false);
  comment = '';

  total = computed(() => {
    const q = this.q();
    return q ? quotationTotals(q.items, q.discountPercent).total : 0;
  });
  open = computed(() => this.q()?.status === 'sent' || this.q()?.status === 'viewed');

  ngOnInit(): void {
    this.api.quotation(this.id()).subscribe({
      next: (q) => this.q.set(q),
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.router.navigateByUrl('/portal/quotations');
      },
    });
  }

  submit(d: 'accept' | 'reject'): void {
    this.busy.set(true);
    const req = d === 'accept' ? this.api.accept(this.id(), this.comment) : this.api.reject(this.id(), this.comment);
    req.subscribe({
      next: (q) => {
        this.q.set(q);
        this.decision.set(null);
        this.busy.set(false);
        this.comment = '';
        this.toast.success(d === 'accept' ? 'Quotation accepted. Thank you!' : 'Your response has been sent.');
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.busy.set(false);
      },
    });
  }

  print(): void {
    window.print();
  }
}
