import { errorApi } from '../api/errorApi';
import { logger } from './logger';

let installed = false;

export function installGlobalErrorReporter(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : undefined;
    const message = error?.message ?? event.message ?? 'Unhandled window error';
    logger.error('window.onerror', { message, filename: event.filename });
    void errorApi.report({
      message,
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      source: 'window.onerror',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.error('window.unhandledrejection', { message });
    void errorApi.report({
      message,
      stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      source: 'unhandledrejection',
    });
  });
}
