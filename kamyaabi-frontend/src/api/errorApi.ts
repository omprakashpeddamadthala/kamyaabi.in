import axios from 'axios';

import { config } from '../config';

export interface ClientErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  /** Origin of the report — e.g. "react-error-boundary", "window.onerror". */
  source: string;
  /** Optional cross-stack correlation id. */
  traceId?: string;
}

/**
 * Best-effort POST of a client-side error to the backend error sink. Uses a
 * raw axios call (not the shared instance) so we never trigger the auth
 * interceptor's redirect-on-401 — an error report from the login screen would
 * otherwise bounce the user into a redirect loop.
 *
 * Always resolves; never throws. If reporting fails (network, CORS, anything),
 * we silently drop on the floor — the frontend boundary still renders the
 * fallback UI either way.
 */
export const errorApi = {
  async report(payload: ClientErrorReport): Promise<void> {
    const baseUrl = config.apiBaseUrl;
    const url = `${baseUrl}/api/errors/report`;
    const body = {
      message: truncate(payload.message, 2000),
      stack: truncate(payload.stack, 16000),
      componentStack: truncate(payload.componentStack, 16000),
      url: payload.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
      userAgent:
        payload.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      source: payload.source,
      traceId: payload.traceId,
    };
    try {
      await axios.post(url, body, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
        // Anonymous endpoint; cookies aren't required and would only invite
        // CORS-preflight friction.
        withCredentials: false,
      });
    } catch {
      // Swallow: we never want error reporting to break the app it's reporting on.
    }
  },
};

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return value;
  return value.length <= max ? value : value.slice(0, max) + '\n…(truncated)';
}
