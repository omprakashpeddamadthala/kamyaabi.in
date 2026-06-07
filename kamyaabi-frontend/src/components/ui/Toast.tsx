/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Styled snackbar/alert composition; caller controls message, severity, and open state.
 */
import React from 'react';
import Alert, { AlertProps } from '@mui/material/Alert';
import Snackbar, { SnackbarProps } from '@mui/material/Snackbar';

export interface ToastProps extends SnackbarProps {
  severity?: AlertProps['severity'];
  message: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({ severity = 'info', message, ...props }) => (
  <Snackbar {...props}>
    <Alert severity={severity} sx={{ borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
      {message}
    </Alert>
  </Snackbar>
);
