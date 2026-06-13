import React from 'react';
import { Box, Button, Card, Divider, Typography } from '@mui/material';

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
}) => (
  <Card sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Order Summary
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography color="text.secondary">Subtotal</Typography>
      <Typography>₹{subtotal}</Typography>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography color="text.secondary">Delivery</Typography>
      <Typography color="success.main">FREE</Typography>
    </Box>

    <Divider sx={{ my: 2 }} />
    <CouponSection coupon={coupon} />

    {discountAmount > 0 && (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="success.main" fontWeight={500}>Discount</Typography>
        <Typography color="success.main" fontWeight={600}>
          -₹{discountAmount}
        </Typography>
      </Box>
    )}

    <Divider sx={{ my: 2 }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Typography variant="h6">Total</Typography>
      <Box sx={{ textAlign: 'right' }}>
        {discountAmount > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textDecoration: 'line-through' }}
          >
            ₹{subtotal}
          </Typography>
        )}
        <Typography variant="h6" color="primary" fontWeight={700}>
          ₹{finalTotal}
        </Typography>
      </Box>
    </Box>
    <Button
      variant="contained"
      fullWidth
      size="large"
      onClick={onPlaceOrder}
      disabled={loading || paymentProcessing || !canPlaceOrder}
    >
      {loading
        ? 'Processing...'
        : paymentProcessing
        ? 'Payment in progress...'
        : paymentMethod === 'COD'
        ? 'Place Order (Cash on Delivery)'
        : 'Place Order & Pay'}
    </Button>
    {paymentMethod === 'COD' && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        You'll pay ₹{finalTotal} in cash to the courier on delivery.
      </Typography>
    )}
  </Card>
);

export default OrderSummaryCard;
