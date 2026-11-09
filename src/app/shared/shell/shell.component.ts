import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

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
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
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
