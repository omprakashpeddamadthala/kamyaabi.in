/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Keeps MUI tooltip semantics while applying shared radius and typography.
 */
import React from 'react';
import MuiTooltip, { TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

export type TooltipProps = MuiTooltipProps;

export const Tooltip: React.FC<TooltipProps> = (props) => <MuiTooltip arrow {...props} />;
