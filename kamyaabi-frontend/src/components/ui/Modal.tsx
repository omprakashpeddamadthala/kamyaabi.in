/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Uses existing MUI dialog focus management while standardizing modal visuals.
 */
import React from 'react';
import Dialog, { DialogProps } from '@mui/material/Dialog';

export type ModalProps = DialogProps;

export const Modal: React.FC<ModalProps> = ({ PaperProps, ...props }) => (
  <Dialog
    PaperProps={{
      ...PaperProps,
      sx: {
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-modal)',
        ...(PaperProps?.sx ?? {}),
      },
    }}
    {...props}
  />
);
