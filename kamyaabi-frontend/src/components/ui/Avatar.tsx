/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Visual avatar wrapper; existing user image/name data remains caller-controlled.
 */
import React from 'react';
import MuiAvatar, { AvatarProps as MuiAvatarProps } from '@mui/material/Avatar';

export type AvatarProps = MuiAvatarProps;

export const Avatar: React.FC<AvatarProps> = ({ sx, ...props }) => (
  <MuiAvatar
    sx={{
      boxShadow: '0 0 0 3px rgba(108,71,255,0.12)',
      ...sx,
    }}
    {...props}
  />
);
