import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { errorMessage } from '../core/api';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { ui } from './ui';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule],
  host: { class: 'block rounded-xl bg-white shadow-sm ring-1 ring-slate-200' },
  template: `
    <form #f="ngForm" (ngSubmit)="save(f)">
      <div class="border-b border-slate-200 px-5 py-4">
        <h2 class="text-base font-semibold text-slate-900">Password</h2>
        <p class="text-sm text-slate-500">Change the password you sign in with.</p>
      </div>
      <div class="grid gap-4 px-5 py-5 sm:grid-cols-3">
        <div>
          <label [class]="ui.label" for="cur-pw">Current password</label>
          <input id="cur-pw" name="current" type="password" required autocomplete="current-password" [class]="ui.input" [(ngModel)]="current" />
        </div>
        <div>
          <label [class]="ui.label" for="new-pw">New password</label>
          <input id="new-pw" name="next" type="password" required minlength="6" autocomplete="new-password" [class]="ui.input" [(ngModel)]="next" />
        </div>
        <div>
          <label [class]="ui.label" for="confirm-pw">Confirm new password</label>
          <input id="confirm-pw" name="confirm" type="password" required autocomplete="new-password" [class]="ui.input" [(ngModel)]="confirm" />
        </div>
      </div>
      <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3">
        @if (confirm && next !== confirm) {
          <p class="mr-auto text-sm text-rose-600">Passwords do not match.</p>
        }
        <button type="submit" [class]="ui.btnPrimary" [disabled]="busy() || f.invalid || next !== confirm">Update password</button>
      </div>
    </form>
  `,
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
