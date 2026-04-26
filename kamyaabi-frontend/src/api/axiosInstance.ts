import axios, { AxiosError } from 'axios';

import { config } from '../config';
import { logger } from '../utils/logger';

/** Absolute session lifetime — must match the backend JWT expiration. */
const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000;
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

/**
 * Persist the absolute expiry timestamp when a new token is obtained.
 * Called once at login time — not on every user interaction.
 */
const setTokenExpiry = (): void => {
  localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + SESSION_LIFETIME_MS).toString());
};

/**
 * Check whether the current session has exceeded the absolute 2-hour lifetime.
 * Returns true when the token is known to be expired (or when no expiry was
 * recorded, which means the token predates this fix and should be treated as
 * expired).
 */
const isSessionExpired = (): boolean => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= parseInt(expiry, 10);
};

const clearSession = (sessionExpired = false): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  if (sessionExpired) {
    sessionStorage.setItem('sessionExpired', 'true');
  } else {
    sessionStorage.removeItem('sessionExpired');
  }
};

interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  traceId?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Extracts the backend-assigned correlation id from either the response header
 * set by CorrelationIdFilter or the {@code traceId} field on the error body.
 */
export const extractTraceId = (error: AxiosError): string | undefined => {
  const headerId = error.response?.headers?.['x-correlation-id'];
  if (typeof headerId === 'string' && headerId.length > 0) return headerId;
  const body = error.response?.data as ApiErrorBody | undefined;
  return body?.traceId;
};

const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isSessionExpired()) {
        clearSession(true);
        window.location.href = '/login';
        return Promise.reject(new axios.Cancel('Session expired'));
      }
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '<unknown>';
    const traceId = extractTraceId(error);

    if (status === 401) {
      logger.warn('Authentication expired / invalid token; clearing session', { url, traceId });
      clearSession(true);
      window.location.href = '/login';
    } else if (status === 403) {
      logger.warn('Access denied by server', { url, traceId });
      window.dispatchEvent(
        new CustomEvent('api:forbidden', { detail: { url, traceId } })
      );
    } else if (status !== undefined && status >= 500) {
      logger.error('Server error', { status, url, traceId });
      window.dispatchEvent(
        new CustomEvent('api:server-error', { detail: { url, status, traceId } })
      );
    } else if (!error.response) {
      logger.error('Network / transport error', { url, message: error.message });
    }

    return Promise.reject(error);
  }
);

export { setTokenExpiry, isSessionExpired, clearSession, SESSION_LIFETIME_MS };
export default axiosInstance;
