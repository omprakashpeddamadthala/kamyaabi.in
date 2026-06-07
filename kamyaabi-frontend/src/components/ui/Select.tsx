/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Provides a styled select shell without changing option values or form behavior.
 */
import React from 'react';
import MuiSelect, { SelectProps as MuiSelectProps } from '@mui/material/Select';

export type SelectProps = MuiSelectProps;

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ sx, ...props }, ref) => (
    <MuiSelect
      ref={ref}
      sx={{
        minHeight: { xs: 48, md: 42 },
        borderRadius: 'var(--radius-md)',
        ...sx,
      }}
      {...props}
    />
  ),
);

Select.displayName = 'Select';
