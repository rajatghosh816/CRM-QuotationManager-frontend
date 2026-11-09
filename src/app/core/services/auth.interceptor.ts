import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api';
import { ENDPOINTS } from '../api-endpoints';
import { AuthService } from './auth.service';

/** Cookie the backend sets with a CSRF token (readable, not HttpOnly) and the header it expects back. */
export const XSRF_COOKIE = 'XSRF-TOKEN';
export const XSRF_HEADER = 'X-XSRF-TOKEN';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
/** Calls that may 401 without meaning "your session expired". */
const NO_REDIRECT_ON_401 = [ENDPOINTS.auth.login, ENDPOINTS.auth.me, ENDPOINTS.auth.logout];

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * For API calls: sends the session cookie (`withCredentials`, needed when the API
 * is on another origin), echoes the CSRF cookie as a header on state-changing
 * requests, and signs the user out when the server says the session is gone.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const xsrf = SAFE_METHODS.includes(req.method) ? null : readCookie(XSRF_COOKIE);
  const authed = req.clone({
    withCredentials: true,
    ...(xsrf ? { setHeaders: { [XSRF_HEADER]: xsrf } } : {}),
  });

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !NO_REDIRECT_ON_401.includes(req.url)) {
        auth.clearSession();
      }
      return throwError(() => err);
    }),
  );
};
