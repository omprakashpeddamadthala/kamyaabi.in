import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface NotificationState {
  open: boolean;
  severity: 'warning' | 'error';
  message: string;
  traceId?: string;
}

/**
 * Bridges the `api:forbidden` / `api:server-error` window events fired by the
 * axios response interceptor into a user-facing MUI Snackbar toast.
 *
 * Intentionally standalone (no external store) so it can be mounted once at the
 * app root without taking on Redux or a toast library as a peer dependency.
 */
export const ApiErrorNotifier: React.FC = () => {
  const [state, setState] = useState<NotificationState>({
    open: false,
    severity: 'error',
    message: '',
  });

  useEffect(() => {
    const onForbidden = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string; traceId?: string }>).detail;
      setState({
        open: true,
        severity: 'warning',
        message: 'You do not have permission to perform this action.',
        traceId: detail?.traceId,
      });
    };
    const onServerError = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string; status: number; traceId?: string }>).detail;
      setState({
        open: true,
        severity: 'error',
        message: 'Something went wrong on our end. Please try again.',
        traceId: detail?.traceId,
      });
    };
    window.addEventListener('api:forbidden', onForbidden);
    window.addEventListener('api:server-error', onServerError);
    return () => {
      window.removeEventListener('api:forbidden', onForbidden);
      window.removeEventListener('api:server-error', onServerError);
    };
  }, []);

  const handleClose = (): void => setState((prev) => ({ ...prev, open: false }));

  return (
    <Snackbar
      open={state.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={state.severity} onClose={handleClose} variant="filled">
        {state.message}
        {state.traceId ? ` (ref: ${state.traceId})` : ''}
      </Alert>
    </Snackbar>
  );
};

export default ApiErrorNotifier;
