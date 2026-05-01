import axios from 'axios';

import { config } from '../config';

export interface ClientErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  source: string;
  traceId?: string;
}

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
        withCredentials: false,
      });
    } catch {
    }
  },
};

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return value;
  return value.length <= max ? value : value.slice(0, max) + '\n…(truncated)';
}
