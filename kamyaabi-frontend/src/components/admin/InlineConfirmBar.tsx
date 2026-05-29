import React from 'react';
import { Alert, AlertTitle, Button, Stack, CircularProgress } from '@mui/material';

interface InlineConfirmBarProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  severity?: 'warning' | 'error' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Non-blocking inline confirmation banner used in place of blocking modal
 * dialogs for destructive actions. Announced to assistive tech via the
 * Alert's implicit `role="alert"`.
 */
const InlineConfirmBar: React.FC<InlineConfirmBarProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  severity = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <Alert
      severity={severity}
      sx={{ mb: 2, alignItems: 'flex-start' }}
      action={
        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
          <Button color="inherit" size="small" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            color={severity === 'info' ? 'info' : 'error'}
            size="small"
            variant="contained"
            onClick={onConfirm}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </Stack>
      }
    >
      <AlertTitle sx={{ fontWeight: 700, mb: message ? 0.5 : 0 }}>{title}</AlertTitle>
      {message}
    </Alert>
  );
};

export default InlineConfirmBar;
