import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Primary action(s) rendered on the right (desktop) / below the title (mobile). */
  action?: React.ReactNode;
}

/**
 * Consistent admin page header: title + optional subtitle + primary action.
 * Stacks vertically on mobile, splits horizontally from `sm` upwards.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <Box component="header" sx={{ mb: 3 }}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>{action}</Box>
      )}
    </Stack>
  </Box>
);

export default PageHeader;
