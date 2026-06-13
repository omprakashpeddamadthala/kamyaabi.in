import React from 'react';
import { Box, Typography } from '@mui/material';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, label }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
    flex: '1 1 0',
    minWidth: 80,
    textAlign: 'center',
  }}>
    <Box sx={{ color: 'secondary.main', fontSize: 28, display: 'flex' }}>{icon}</Box>
    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ lineHeight: 1.2 }}>
      {label}
    </Typography>
  </Box>
);

export default TrustBadge;
