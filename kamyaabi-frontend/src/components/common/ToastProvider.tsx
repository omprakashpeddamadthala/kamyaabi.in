import { ReactNode, useCallback, useMemo, useState } from 'react';
import { Alert, AlertColor, Snackbar } from '@mui/material';

import { ToastContext, ToastContextValue } from './useToast';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ToastState>({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    setState({ open: true, message, severity });
  }, []);
  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, showSuccess, showError }),
    [showToast, showSuccess, showError],
  );

  const handleClose = (_e?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setState((prev) => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={state.severity === 'error' ? 7000 : 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={state.severity}
          variant="filled"
          onClose={() => setState((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
