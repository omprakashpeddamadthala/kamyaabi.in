import axios, { AxiosError } from 'axios';

import { config } from '../config';
import { logger } from '../utils/logger';

/** Session inactivity timeout. 2 hours. */
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'lastActivity';

const updateLastActivity = (): void => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

const isSessionExpired = (): boolean => {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivity) return false;
  return Date.now() - parseInt(lastActivity, 10) > SESSION_TIMEOUT_MS;
};

const clearSession = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(LAST_ACTIVITY_KEY);
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
        clearSession();
        window.location.href = '/login';
        return Promise.reject(new axios.Cancel('Session expired due to inactivity'));
      }
      requestConfig.headers.Authorization = `Bearer ${token}`;
      updateLastActivity();
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
      clearSession();
      window.location.href = '/login';
    } else if (status === 403) {
      logger.warn('Access denied by server', { url, traceId });
      // Page-level surface: dispatch a window event so UI (toasts, banners) can react without
      // coupling axios to any particular notification library.
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

if (localStorage.getItem('token')) {
  updateLastActivity();
}

export { updateLastActivity, isSessionExpired, clearSession, SESSION_TIMEOUT_MS };
export default axiosInstance;
