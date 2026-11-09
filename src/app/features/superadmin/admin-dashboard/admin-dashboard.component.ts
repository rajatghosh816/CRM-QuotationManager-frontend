import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api';
import { PlatformStats } from '../../../core/models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, StatCardComponent, StatusBadgeComponent, LoadingComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  ui = ui;
  stats = signal<PlatformStats | null>(null);

  constructor() {
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: (e) => this.toast.error(errorMessage(e)) });
  }
}
