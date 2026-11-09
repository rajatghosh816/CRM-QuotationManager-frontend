import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { IconComponent } from './icon.component';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

/** App frame shared by the three areas: sidebar navigation, user box and page outlet. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="min-h-dvh bg-slate-50">
      <!-- Mobile top bar -->
      <div class="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden print:hidden">
        <button type="button" class="-m-1.5 rounded-md p-1.5 text-slate-600 hover:bg-slate-100" (click)="open.set(true)"
          aria-label="Open menu">
          <app-icon name="menu" />
        </button>
        <span class="font-semibold text-slate-900">{{ areaLabel() }}</span>
      </div>

      @if (open()) {
        <div class="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" (click)="open.set(false)"></div>
      }

      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 print:hidden"
        [class.-translate-x-full]="!open()">
        <div class="flex items-center gap-3 px-5 py-5">
          <span class="grid size-9 place-items-center rounded-lg bg-indigo-500 text-sm font-bold text-white">QM</span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">Quotation Manager</p>
            <p class="truncate text-xs text-slate-400">{{ areaLabel() }}</p>
          </div>
          <button type="button" class="ml-auto rounded-md p-1 text-slate-400 hover:text-white lg:hidden"
            (click)="open.set(false)" aria-label="Close menu">
            <app-icon name="x" />
          </button>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          @for (item of nav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-slate-800 text-white"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white"
              (click)="open.set(false)">
              <app-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="border-t border-slate-800 p-3">
          <div class="flex items-center gap-3 rounded-lg px-2 py-2">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              {{ initials() }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-white">{{ auth.user()?.name }}</p>
              <p class="truncate text-xs text-slate-400">{{ auth.user()?.email }}</p>
            </div>
            <button type="button" class="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              (click)="auth.logout()" title="Sign out" aria-label="Sign out">
              <app-icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      <main class="lg:pl-64 print:p-0">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  areaLabel = input.required<string>();
  nav = input.required<NavItem[]>();
  open = signal(false);

  initials = computed(() =>
    (this.auth.user()?.name ?? '?')
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}
