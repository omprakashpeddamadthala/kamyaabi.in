/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves MUI drawer accessibility/focus behavior and only tokenizes paper styling.
 */
import React from 'react';
import MuiDrawer, { DrawerProps as MuiDrawerProps } from '@mui/material/Drawer';

export type DrawerProps = MuiDrawerProps;

export const Drawer: React.FC<DrawerProps> = ({ PaperProps, ...props }) => (
  <MuiDrawer
    PaperProps={{
      ...PaperProps,
      sx: {
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
        ...(PaperProps?.sx ?? {}),
      },
    }}
    {...props}
  />
);
