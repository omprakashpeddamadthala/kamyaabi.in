import React from 'react';
import { Box, Card, Button, Stack, CircularProgress } from '@mui/material';
import PageHeader from './PageHeader';

interface AdminFormShellProps {
  title: string;
  subtitle?: string;
  onSubmit: () => void;
  onCancel: () => void;
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  /** Disable the submit button (e.g. while loading the entity). */
  submitDisabled?: boolean;
  children: React.ReactNode;
}

/**
 * Standard layout for admin create/edit pages:
 * page header + a single card with grouped form content + a sticky
 * save/cancel footer that stays in view while scrolling long forms.
 */
const AdminFormShell: React.FC<AdminFormShellProps> = ({
  title,
  subtitle,
  onSubmit,
  onCancel,
  saving = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitDisabled = false,
  children,
}) => (
  <Box
    component="form"
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    sx={{ maxWidth: 960, mx: 'auto' }}
  >
    <PageHeader title={title} subtitle={subtitle} />

    <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 }, '&:hover': { transform: 'none', boxShadow: 'none' } }}>
      {children}
    </Card>

    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        mt: 2,
        py: 1.5,
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        zIndex: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column-reverse', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button variant="outlined" onClick={onCancel} disabled={saving} fullWidth={false} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || submitDisabled}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </Stack>
    </Box>
  </Box>
);

export default AdminFormShell;
