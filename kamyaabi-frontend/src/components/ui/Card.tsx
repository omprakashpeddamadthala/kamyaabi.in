/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Tokenized card wrapper only; children and click behavior remain unchanged.
 */
import React from 'react';
import MuiCard, { CardProps as MuiCardProps } from '@mui/material/Card';

export type CardProps = MuiCardProps;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ sx, ...props }, ref) => (
    <MuiCard
      ref={ref}
      sx={{
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        ...sx,
      }}
      {...props}
    />
  ),
);

Card.displayName = 'Card';
