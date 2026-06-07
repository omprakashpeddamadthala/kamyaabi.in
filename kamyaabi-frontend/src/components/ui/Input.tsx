/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves standard text-field props, refs, validation states, and className extension.
 */
import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export type InputProps = TextFieldProps;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ sx, InputProps, ...props }, ref) => (
    <TextField
      inputRef={ref}
      InputProps={InputProps}
      sx={{
        '& .MuiInputBase-root': {
          minHeight: { xs: 48, md: 42 },
          borderRadius: 'var(--radius-md)',
        },
        ...sx,
      }}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
