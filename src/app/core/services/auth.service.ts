import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from '../api';
import { AuthResponse, Role, User } from '../models';

const SESSION_KEY = 'crmqm.session';

interface Session {
  token: string;
  user: User;
}

export const HOME_BY_ROLE: Record<Role, string> = {
  superadmin: '/superadmin',
  business_admin: '/business',
  customer: '/portal',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  get token(): string | null {
    return this.session()?.token ?? null;
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
    );
  }

  /** Re-reads the current user, e.g. after the profile name changes. */
  refreshUser(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/me`).pipe(
      tap((user) => {
        const s = this.session();
        if (s) this.setSession({ token: s.token, user });
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.put(`${API_URL}/auth/password`, { currentPassword, newPassword });
  }

  logout(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    this.router.navigateByUrl('/login');
  }

  homeUrl(role?: Role): string {
    const r = role ?? this.user()?.role;
    return r ? HOME_BY_ROLE[r] : '/login';
  }

  private setSession(s: Session): void {
    this.session.set(s);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
