import React from 'react';
import { Box, Button, Card, Divider, Typography, useMediaQuery, useTheme } from '@mui/material';

import { PaymentMethod } from '../../types';
import { useCheckoutCoupons } from '../../hooks/useCheckoutCoupons';
import CouponSection from './CouponSection';

interface OrderSummaryCardProps {
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  coupon: ReturnType<typeof useCheckoutCoupons>;
  loading: boolean;
  paymentProcessing: boolean;
  canPlaceOrder: boolean;
  onPlaceOrder: () => void;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  subtotal,
  discountAmount,
  finalTotal,
  paymentMethod,
  coupon,
  loading,
  paymentProcessing,
  canPlaceOrder,
  onPlaceOrder,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <Card sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 0, sm: 3 }, 
        '&:hover': { transform: 'none' },
        borderRadius: { xs: 'var(--radius-3xl) var(--radius-3xl) 0 0', md: 'var(--radius-2xl)' },
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: { xs: '0 -10px 40px rgba(0,0,0,0.1)', md: '0 4px 20px rgba(0,0,0,0.03)' },
        position: { xs: 'fixed', md: 'sticky' },
        bottom: { xs: 0, md: 'auto' },
        top: { md: 90 },
        left: 0,
        right: 0,
        zIndex: 1000,
        bgcolor: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)',
      }}>
        <Box sx={{ display: { xs: 'flex', md: 'block' }, justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 2 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-display)', display: { xs: 'none', md: 'block' } }}>
            Order Summary
          </Typography>
          {isMobile && (
            <Box>
              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>₹{finalTotal}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Subtotal</Typography>
            <Typography sx={{ fontWeight: 700 }}>₹{subtotal}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Delivery</Typography>
            <Typography sx={{ color: 'var(--color-success)', fontWeight: 800 }}>FREE</Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.06)' }} />
          <CouponSection coupon={coupon} />

          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
              <Typography sx={{ color: 'var(--color-success)', fontWeight: 700 }}>Discount</Typography>
              <Typography sx={{ color: 'var(--color-success)', fontWeight: 800 }}>
                -₹{discountAmount}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.06)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Total</Typography>
            <Box sx={{ textAlign: 'right' }}>
              {discountAmount > 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--color-text-muted)', textDecoration: 'line-through', fontWeight: 600 }}
                >
                  ₹{subtotal}
                </Typography>
              )}
              <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                ₹{finalTotal}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={onPlaceOrder}
          disabled={loading || paymentProcessing || !canPlaceOrder}
          sx={{
            bgcolor: 'var(--color-brand-secondary)',
            color: 'var(--color-surface-dark)',
            fontWeight: 800,
            py: 1.5,
            borderRadius: 'var(--radius-full)',
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
            '&:hover': {
              bgcolor: '#d97706',
              boxShadow: '0 12px 24px rgba(245, 158, 11, 0.35)',
              transform: 'translateY(-2px)'
            },
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
          {loading
            ? 'Processing...'
            : paymentProcessing
            ? 'Payment in progress...'
            : paymentMethod === 'COD'
            ? 'Place Order (COD)'
            : 'Place Order & Pay'}
        </Button>
        {paymentMethod === 'COD' && (
          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block', mt: 1.5, textAlign: 'center', fontWeight: 600 }}>
            You'll pay ₹{finalTotal} in cash to the courier on delivery.
          </Typography>
        )}
      </Card>
      
      {/* Spacer for mobile to prevent content hiding behind fixed card */}
      {isMobile && <Box sx={{ height: 100 }} />}
    </>
  );
};

export default OrderSummaryCard;
