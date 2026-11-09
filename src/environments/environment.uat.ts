import { Environment } from './environment.model';

/** UAT. Swapped in for environment.ts by `--configuration uat`. */
export const environment: Environment = {
  name: 'uat',
  production: true,
  apiUrl: 'https://uat-api.example.com/api', // TODO: replace with the real UAT API URL
  useMockBackend: false,
  liveEndpoints: [], // ignored when the mock is off
};
