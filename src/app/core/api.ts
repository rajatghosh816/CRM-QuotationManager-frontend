import { HttpErrorResponse } from '@angular/common/http';

/** Base URL of the REST API. Point this at the real backend when it is ready. */
export const API_URL = '/api';

/** Turns any HTTP error into a sentence that can be shown to the user. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Check your connection.';
    return err.error?.message ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
