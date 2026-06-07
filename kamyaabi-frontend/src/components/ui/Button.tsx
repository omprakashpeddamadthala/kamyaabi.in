/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Atomic visual wrapper only; existing callers can still use native button props and className.
 */
import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export type ButtonProps = MuiButtonProps;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ sx, ...props }, ref) => (
    <MuiButton
      ref={ref}
      sx={{
        minHeight: 44,
        borderRadius: 'var(--radius-full)',
        ...sx,
      }}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
