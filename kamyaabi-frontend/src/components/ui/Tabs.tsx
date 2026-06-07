/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Re-exports styled tab primitives without changing selected values or handlers.
 */
import React from 'react';
import MuiTab, { TabProps } from '@mui/material/Tab';
import MuiTabs, { TabsProps as MuiTabsProps } from '@mui/material/Tabs';

export type TabsProps = MuiTabsProps;

export const Tabs: React.FC<TabsProps> = ({ sx, ...props }) => (
  <MuiTabs
    sx={{
      '& .MuiTabs-indicator': { height: 3, borderRadius: 'var(--radius-full)' },
      ...sx,
    }}
    {...props}
  />
);

export const Tab: React.FC<TabProps> = ({ sx, ...props }) => (
  <MuiTab
    sx={{
      minHeight: 44,
      fontWeight: 800,
      textTransform: 'none',
      ...sx,
    }}
    {...props}
  />
);
