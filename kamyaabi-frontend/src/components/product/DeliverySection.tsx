import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { CheckCircle, Close, LocalShippingOutlined, LocationOnOutlined, PaymentOutlined } from '@mui/icons-material';
import type { PincodeServiceability } from '../../api/shippingApi';
import type { User } from '../../types';

interface DeliverySectionProps {
  user: User | null;
  pincodeResult: PincodeServiceability | null;
  pincodeLoading: boolean;
  pincodeError: string;
  hasNoAddress: boolean;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  user,
  pincodeResult,
  pincodeLoading,
  pincodeError,
  hasNoAddress,
}) => (
  <Box sx={{ mt: 3, mb: 2 }}>
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: 700,
        mb: 1.5,
        color: 'var(--color-surface-dark)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <LocalShippingOutlined sx={{ color: 'var(--color-brand-primary)', fontSize: 22 }} />
      Delivery
    </Typography>

    {/* Loading state */}
    {pincodeLoading && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="rounded" height={22} width="70%" />
        <Skeleton variant="rounded" height={18} width="55%" />
        <Skeleton variant="rounded" height={18} width="40%" />
      </Box>
    )}

    {/* Result from Shiprocket */}
    {!pincodeLoading && pincodeResult && (
      <Box
        sx={{
          p: 2,
          borderRadius: '12px',
          bgcolor: pincodeResult.serviceable ? '#F0FFF4' : '#FFF5F5',
          border: '1px solid',
          borderColor: pincodeResult.serviceable ? '#C6F6D5' : '#FED7D7',
        }}
      >
        {pincodeResult.serviceable ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle sx={{ color: '#38A169', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#276749' }}>
                Delivery available to {pincodeResult.pincode}
              </Typography>
            </Box>

            {pincodeResult.city && pincodeResult.state && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 3.5, mb: 0.75 }}>
                <LocationOnOutlined sx={{ fontSize: 15, color: '#4A5568' }} />
                <Typography variant="body2" color="text.secondary">
                  {pincodeResult.city}, {pincodeResult.state}
                </Typography>
              </Box>
            )}

            {pincodeResult.estimatedDays ? (
              (() => {
                const edd = new Date();
                edd.setDate(edd.getDate() + pincodeResult.estimatedDays!);
                const formatted = edd.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 3.5, mb: 0.75 }}>
                    <LocalShippingOutlined sx={{ fontSize: 15, color: '#276749' }} />
                    <Typography variant="body2" sx={{ color: '#276749', fontWeight: 600 }}>
                      Estimated delivery by <strong>{formatted}</strong>
                    </Typography>
                  </Box>
                );
              })()
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 3.5, mb: 0.75 }}>
                <LocalShippingOutlined sx={{ fontSize: 15, color: '#276749' }} />
                <Typography variant="body2" sx={{ color: '#276749', fontWeight: 600 }}>
                  Standard delivery available
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 3.5 }}>
              <PaymentOutlined sx={{ fontSize: 15, color: '#4A5568' }} />
              <Typography variant="body2" color="text.secondary">
                Cash on Delivery:{' '}
                <strong style={{ color: pincodeResult.codAvailable === 'Yes' ? '#276749' : '#C53030' }}>
                  {pincodeResult.codAvailable === 'Yes' ? 'Available' : 'Not Available'}
                </strong>
              </Typography>
            </Box>

            {pincodeResult.courierName && (
              <Typography
                variant="caption"
                sx={{ display: 'block', ml: 3.5, mt: 1, color: 'text.secondary', fontStyle: 'italic' }}
              >
                Shipping via {pincodeResult.courierName}
              </Typography>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Close sx={{ color: '#E53E3E', fontSize: 20, mt: '2px' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#9B2C2C' }}>
                Delivery not available
              </Typography>
              <Typography variant="caption" sx={{ color: '#C53030', display: 'block', mt: 0.5 }}>
                {pincodeResult.message || 'Delivery is currently not available to your address.'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    )}

    {/* Error from API call */}
    {!pincodeLoading && !pincodeResult && pincodeError && (
      <Box
        sx={{
          p: 1.5,
          borderRadius: '10px',
          bgcolor: 'var(--color-surface-bg)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Usually delivered in 3–5 business days.
          </Typography>
        </Box>
      </Box>
    )}

    {/* No address saved */}
    {!pincodeLoading && !pincodeResult && !pincodeError && user && hasNoAddress && (
      <Box
        sx={{
          p: 2,
          borderRadius: '12px',
          bgcolor: '#FFFBEB',
          border: '1px solid #FEF3C7',
          textAlign: 'center',
        }}
      >
        <LocationOnOutlined sx={{ fontSize: 26, color: '#D97706', mb: 0.5 }} />
        <Typography variant="body2" sx={{ color: '#92400E', mb: 1.5, fontWeight: 500 }}>
          Add a delivery address to see estimated delivery date
        </Typography>
        <Button
          component={Link}
          to="/profile"
          variant="contained"
          size="small"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            px: 3,
            bgcolor: '#D97706',
            '&:hover': { bgcolor: '#B45309' },
          }}
        >
          Add Address
        </Button>
      </Box>
    )}

    {/* Guest / not logged in */}
    {!user && (
      <Box
        sx={{
          p: 1.5,
          borderRadius: '12px',
          bgcolor: 'var(--color-surface-bg)',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <LocalShippingOutlined sx={{ fontSize: 24, color: 'text.secondary' }} />
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Usually delivered in 3–5 business days.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <Box
              component={Link}
              to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
              sx={{
                color: 'var(--color-brand-primary)',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Login
            </Box>{' '}
            to see exact delivery date for your address.
          </Typography>
        </Box>
      </Box>
    )}
  </Box>
);

export default DeliverySection;
