import React from 'react';
import { Box, Typography } from '@mui/material';

interface CheckoutProgressProps {
  hasAddress: boolean;
  hasPaymentMethod: boolean;
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ hasAddress, hasPaymentMethod }) => {
  const steps = [
    { label: 'Address', active: true, complete: hasAddress },
    { label: 'Payment', active: hasAddress, complete: hasPaymentMethod },
    { label: 'Review', active: hasAddress && hasPaymentMethod, complete: false },
  ];

  return (
    <Box
      aria-label="Checkout progress"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 1.5,
        mb: { xs: 3, sm: 4 },
      }}
    >
      {steps.map((step, index) => (
        <Box
          key={step.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            p: 1.5,
            borderRadius: 'var(--radius-full)',
            bgcolor: step.active ? 'rgba(29, 78, 216,0.08)' : 'var(--color-surface-card)',
            border: '1px solid',
            borderColor: step.active ? 'rgba(29, 78, 216,0.24)' : 'rgba(29, 78, 216,0.10)',
            boxShadow: step.active ? 'var(--shadow-card)' : 'none',
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-full)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              bgcolor: step.complete ? 'var(--color-brand-accent)' : step.active ? 'var(--color-brand-primary)' : 'var(--color-surface-bg)',
              color: step.active || step.complete ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            {step.complete ? '✓' : index + 1}
          </Box>
          <Typography fontWeight={800} color={step.active ? 'text.primary' : 'text.secondary'}>
            {step.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default CheckoutProgress;
