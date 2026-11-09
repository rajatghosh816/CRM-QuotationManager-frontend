import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { mockBackendInterceptor } from './core/mock/mock-backend.interceptor';
import { authInterceptor } from './core/services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Route params and route data are passed to components as inputs (e.g. `id`).
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        // MOCK: answers /api/** from in-memory data. Remove this line to use the real backend.
        mockBackendInterceptor,
      ]),
    ),
  ],
};
