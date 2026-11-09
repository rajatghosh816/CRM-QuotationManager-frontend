export interface Environment {
  /** Short name of the target environment. */
  name: 'dev' | 'uat' | 'prod';
  production: boolean;
  /** Base URL of the REST API (no trailing slash). Relative URLs go through the dev proxy. */
  apiUrl: string;
  /** When true, /api calls are answered by the in-memory mock backend instead of the server. */
  useMockBackend: boolean;
  /**
   * Endpoints the real backend already serves, as path prefixes relative to `apiUrl`
   * (e.g. '/auth', '/business/customers'). While `useMockBackend` is true, requests
   * matching these go to the server and everything else stays mocked, so endpoints
   * can be switched over one by one as the backend delivers them.
   */
  liveEndpoints: string[];
}
