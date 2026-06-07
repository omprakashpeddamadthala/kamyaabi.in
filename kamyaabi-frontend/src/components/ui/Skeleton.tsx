/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Standardizes loading skeleton shape; no data-fetching behavior changes.
 */
import React from 'react';
import MuiSkeleton, { SkeletonProps as MuiSkeletonProps } from '@mui/material/Skeleton';

export type SkeletonProps = MuiSkeletonProps;

export const Skeleton: React.FC<SkeletonProps> = ({ sx, ...props }) => (
  <MuiSkeleton
    animation="wave"
    sx={{
      borderRadius: 'var(--radius-md)',
      ...sx,
    }}
    {...props}
  />
);
