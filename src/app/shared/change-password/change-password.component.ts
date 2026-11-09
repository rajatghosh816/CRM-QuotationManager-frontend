import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ui } from '../ui';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule],
  host: { class: 'block rounded-xl bg-white shadow-sm ring-1 ring-slate-200' },
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  ui = ui;
  current = '';
  next = '';
  confirm = '';
  busy = signal(false);

  save(form: NgForm): void {
    this.busy.set(true);
    this.auth.changePassword(this.current, this.next).subscribe({
      next: () => {
        this.toast.success('Password updated.');
        form.resetForm();
        this.busy.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
