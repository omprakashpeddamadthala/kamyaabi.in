/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Visual badge wrapper; existing counts/labels remain caller-controlled.
 */
import React from 'react';
import Chip, { ChipProps } from '@mui/material/Chip';

export type BadgeProps = ChipProps;

export const Badge: React.FC<BadgeProps> = ({ sx, ...props }) => (
  <Chip
    sx={{
      borderRadius: 'var(--radius-full)',
      fontWeight: 800,
      ...sx,
    }}
    {...props}
  />
);
