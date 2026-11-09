import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { errorMessage } from '../../../core/api';
import { mockDb } from '../../../core/mock/mock-db';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ui } from '../../../shared/ui';

interface DemoAccount {
  area: string;
  who: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  ui = ui;

  email = '';
  password = '';
  busy = signal(false);
  error = signal('');

  demos: DemoAccount[] = [
    { area: 'Super admin', who: 'Platform Admin', email: 'admin@crm.test', password: 'admin123' },
    { area: 'Business admin', who: 'Acme Interiors', email: 'owner@acme.test', password: 'admin123' },
    { area: 'Business admin', who: 'BrightWave Solar', email: 'owner@brightwave.test', password: 'admin123' },
    { area: 'Customer', who: 'John Carter (Acme)', email: 'john@carterhomes.test', password: 'customer123' },
    { area: 'Customer', who: 'Rahul Mehta (BrightWave)', email: 'rahul@mehtatextiles.test', password: 'customer123' },
  ];

  useDemo(a: DemoAccount): void {
    this.email = a.email;
    this.password = a.password;
    this.submit();
  }

  submit(): void {
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (user) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const home = this.auth.homeUrl(user.role);
        this.router.navigateByUrl(returnUrl?.startsWith(home) ? returnUrl : home);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }

  resetDemo(): void {
    mockDb.reset();
    this.toast.success('Demo data has been reset.');
  }
}
