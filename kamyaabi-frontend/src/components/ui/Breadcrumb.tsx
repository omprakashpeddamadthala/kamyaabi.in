/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Styled breadcrumbs keep existing link structure and aria behavior.
 */
import React from 'react';
import MuiBreadcrumbs, { BreadcrumbsProps } from '@mui/material/Breadcrumbs';

export type BreadcrumbProps = BreadcrumbsProps;

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ sx, ...props }) => (
  <MuiBreadcrumbs
    sx={{
      color: 'var(--color-text-secondary)',
      '& a': { color: 'inherit', textDecoration: 'none' },
      '& a:hover': { color: 'var(--color-brand-primary)' },
      ...sx,
    }}
    {...props}
  />
);
