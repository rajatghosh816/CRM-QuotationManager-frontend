import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../../core/api';
import { Business, CURRENCIES } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ChangePasswordComponent } from '../../../shared/change-password/change-password.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-business-settings',
  imports: [FormsModule, PageHeaderComponent, LoadingComponent, ChangePasswordComponent],
  templateUrl: './business-settings.component.html',
  styleUrl: './business-settings.component.scss',
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
