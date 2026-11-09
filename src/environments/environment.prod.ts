import { Environment } from './environment.model';

/** PRODUCTION. Swapped in for environment.ts by `--configuration production`. */
export const environment: Environment = {
  name: 'prod',
  production: true,
  apiUrl: 'https://api.example.com/api', // TODO: replace with the real production API URL
  useMockBackend: false,
  liveEndpoints: [], // ignored when the mock is off
};
