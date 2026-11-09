import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withNoXsrfProtection } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { mockBackendInterceptor } from './core/mock/mock-backend.interceptor';
import { authInterceptor } from './core/services/auth.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Route params and route data are passed to components as inputs (e.g. `id`).
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        // MOCK: answers API calls from in-memory data. Toggle with `useMockBackend` in src/environments.
        ...(environment.useMockBackend ? [mockBackendInterceptor] : []),
      ]),
      // CSRF is handled in authInterceptor (Angular's built-in one skips absolute API URLs).
      withNoXsrfProtection(),
    ),
    // Ask the server who is signed in (via the session cookie) before the first route guard runs.
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
