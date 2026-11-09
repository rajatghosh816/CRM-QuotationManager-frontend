import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { errorMessage } from '../../core/api';
import { mockDb } from '../../core/mock/mock-db';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ui } from '../../shared/ui';

interface DemoAccount {
  area: string;
  who: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="flex min-h-dvh flex-col bg-slate-50 lg:flex-row">
      <section class="relative hidden flex-1 overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-lg bg-indigo-500 font-bold">QM</span>
          <span class="text-lg font-semibold">CRM Quotation Manager</span>
        </div>
        <div class="max-w-md">
          <h2 class="text-3xl font-semibold tracking-tight">Quotes out faster. Answers back sooner.</h2>
          <p class="mt-4 text-slate-300">
            One platform for the platform owner, the businesses that send quotations and the customers who approve them.
          </p>
          <ul class="mt-8 space-y-3 text-sm text-slate-300">
            <li><span class="font-semibold text-white">Super admin</span> — onboard businesses, manage plans and users.</li>
            <li><span class="font-semibold text-white">Business admin</span> — customers, product catalog, quotations.</li>
            <li><span class="font-semibold text-white">Customer</span> — review, accept or decline quotations online.</li>
          </ul>
        </div>
        <p class="text-xs text-slate-500">Demo build · running on mock data</p>
      </section>

      <section class="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div class="w-full max-w-md">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p class="mt-1 text-sm text-slate-500">Use your work email, or pick a demo account below.</p>

          <form class="mt-8 space-y-4" (ngSubmit)="submit()" #f="ngForm">
            <div>
              <label for="email" [class]="ui.label">Email</label>
              <input id="email" name="email" type="email" required autocomplete="username" [class]="ui.input"
                [(ngModel)]="email" />
            </div>
            <div>
              <label for="password" [class]="ui.label">Password</label>
              <input id="password" name="password" type="password" required autocomplete="current-password"
                [class]="ui.input" [(ngModel)]="password" />
            </div>
            @if (error()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</p>
            }
            <button type="submit" [class]="ui.btnPrimary + ' w-full'" [disabled]="busy() || f.invalid">
              {{ busy() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <div class="mt-10">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-900">Demo accounts</h2>
              <button type="button" [class]="ui.btnGhost + ' text-xs'" (click)="resetDemo()">Reset demo data</button>
            </div>
            <ul class="mt-3 divide-y divide-slate-200 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              @for (a of demos; track a.email) {
                <li>
                  <button type="button" class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
                    (click)="useDemo(a)" [disabled]="busy()">
                    <span class="min-w-0">
                      <span class="block text-sm font-medium text-slate-900">{{ a.area }}</span>
                      <span class="block truncate text-xs text-slate-500">{{ a.who }} · {{ a.email }}</span>
                    </span>
                    <span class="shrink-0 text-xs font-medium text-indigo-600">Sign in →</span>
                  </button>
                </li>
              }
            </ul>
          </div>
        </div>
      </section>
    </div>
  `,
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
