import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../../core/api';
import { Customer } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ChangePasswordComponent } from '../../../shared/change-password/change-password.component';
import { LoadingComponent } from '../../../shared/loading/loading.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-portal-profile',
  imports: [FormsModule, PageHeaderComponent, LoadingComponent, ChangePasswordComponent],
  templateUrl: './portal-profile.component.html',
  styleUrl: './portal-profile.component.scss',
})
export class PortalProfileComponent {
  private api = inject(PortalApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  ui = ui;
  model = signal<Customer | null>(null);
  saving = signal(false);

  constructor() {
    this.api.profile().subscribe({ next: (c) => this.model.set(c), error: (e) => this.toast.error(errorMessage(e)) });
  }

  save(m: Customer): void {
    this.saving.set(true);
    this.api.updateProfile({ name: m.name, company: m.company, phone: m.phone, address: m.address }).subscribe({
      next: (c) => {
        this.model.set(c);
        this.saving.set(false);
        this.toast.success('Profile saved.');
        this.auth.refreshUser().subscribe();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
