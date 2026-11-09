import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ENDPOINTS } from '../api-endpoints';
import { AuthResponse, Role, User } from '../models';

export const HOME_BY_ROLE: Record<Role, string> = {
  superadmin: '/superadmin',
  business_admin: '/business',
  customer: '/portal',
};

/**
 * Cookie-based authentication.
 *
 * The backend sets an HttpOnly session cookie on login and clears it on logout,
 * so no token is ever readable by (or stored in) the browser app. The app only
 * keeps the current user in memory and asks `/auth/me` who is signed in at startup.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /**
   * Restores the session from the cookie. Runs once before the first navigation
   * (see app.config.ts) so route guards know who is signed in. Never errors.
   */
  init(): Observable<User | null> {
    return this.http.get<User>(ENDPOINTS.auth.me).pipe(
      catchError(() => of(null)),
      tap((user) => this.currentUser.set(user)),
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(ENDPOINTS.auth.login, { email, password }).pipe(
      map((res) => res.user),
      tap((user) => this.currentUser.set(user)),
    );
  }

  /** Re-reads the current user, e.g. after the profile name changes. */
  refreshUser(): Observable<User> {
    return this.http.get<User>(ENDPOINTS.auth.me).pipe(tap((user) => this.currentUser.set(user)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.put(ENDPOINTS.auth.password, { currentPassword, newPassword });
  }

  /** Asks the server to clear the session cookie, then leaves the app either way. */
  logout(): void {
    this.http
      .post(ENDPOINTS.auth.logout, {})
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.clearSession()),
      )
      .subscribe();
  }

  /** Forgets the user locally (the cookie is already gone or invalid) and goes to login. */
  clearSession(): void {
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  homeUrl(role?: Role): string {
    const r = role ?? this.user()?.role;
    return r ? HOME_BY_ROLE[r] : '/login';
  }
}
