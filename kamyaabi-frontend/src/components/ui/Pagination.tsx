/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Pagination wrapper preserves count/page/onChange semantics.
 */
import React from 'react';
import MuiPagination, { PaginationProps as MuiPaginationProps } from '@mui/material/Pagination';

export type PaginationProps = MuiPaginationProps;

export const Pagination: React.FC<PaginationProps> = ({ sx, ...props }) => (
  <MuiPagination
    sx={{
      '& .MuiPaginationItem-root': {
        borderRadius: 'var(--radius-full)',
        minWidth: 38,
        minHeight: 38,
        fontWeight: 750,
      },
      ...sx,
    }}
    {...props}
  />
);
