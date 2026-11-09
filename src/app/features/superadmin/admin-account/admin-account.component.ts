import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordComponent } from '../../../shared/change-password/change-password.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ui } from '../../../shared/ui';

@Component({
  selector: 'app-admin-account',
  imports: [PageHeaderComponent, ChangePasswordComponent],
  templateUrl: './admin-account.component.html',
  styleUrl: './admin-account.component.scss',
})
export class AdminAccountComponent {
  user = inject(AuthService).user;
  ui = ui;
}
