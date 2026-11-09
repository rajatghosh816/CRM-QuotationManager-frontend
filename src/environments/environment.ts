import { Environment } from './environment.model';

/**
 * DEV (default). Used by `ng serve` / `ng build --configuration development`.
 * `/api` is forwarded to the local backend by proxy.conf.json.
 * Set `useMockBackend: false` once the backend is running.
 */
export const environment: Environment = {
  name: 'dev',
  production: false,
  apiUrl: '/api',
  useMockBackend: false,
  // Add a prefix here as soon as the backend finishes it, e.g. ['/auth', '/business/customers'].
  liveEndpoints: [],
};
