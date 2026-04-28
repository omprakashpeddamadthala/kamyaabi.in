import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirm dialog. Replaces native `window.confirm` for destructive
 * admin actions so we can show clearer copy, disable the button while a
 * request is in-flight, and stay consistent with the rest of the MUI UI.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        color={destructive ? 'error' : 'primary'}
        variant="contained"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
