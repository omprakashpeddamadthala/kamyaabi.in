import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, AlertColor, Snackbar } from '@mui/material';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Lightweight global toast surface used by admin forms (and any other feature
 * that needs to confirm/inform without owning its own Snackbar). Stays in-tree
 * with MUI to avoid taking on a new toast dependency.
 */
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

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
