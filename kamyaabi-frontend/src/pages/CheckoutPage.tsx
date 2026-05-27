import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Alert,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add, Close, LocalOffer } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCart } from '../features/cart/cartSlice';
import { createOrder } from '../features/order/orderSlice';
import { addressApi } from '../api/addressApi';
import { paymentApi } from '../api/paymentApi';
import { couponApi } from '../api/couponApi';
import { Address, CouponValidationResult } from '../types';
import Loading from '../components/common/Loading';
import AddressFormDialog from '../components/common/AddressFormDialog';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CheckoutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCart());
    loadAddresses();
  }, [dispatch]);

  const loadAddresses = async () => {
    try {
      const res = await addressApi.getAll();
      setAddresses(res.data.data);
      const defaultAddr = res.data.data.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (res.data.data.length > 0) setSelectedAddressId(res.data.data[0].id);
    } catch {
      setError('Failed to load addresses');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const res = await couponApi.validate(couponCode.trim());
      const result = res.data.data;
      if (result.valid) {
        setCouponResult(result);
      } else {
        setCouponError(result.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setCouponError(e.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
    setCouponError(null);
  };

  const discountAmount = couponResult?.discountAmount ?? 0;
  const finalTotal = cart ? cart.totalAmount - discountAmount : 0;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }
    if (paymentProcessing) return;
    setLoading(true);
    setError(null);
    try {
      const orderResult = await dispatch(
        createOrder({
          shippingAddressId: selectedAddressId,
          couponCode: couponResult?.valid ? couponResult.code : undefined,
        }),
      ).unwrap();

      const paymentRes = await paymentApi.createOrder(orderResult.id);
      const razorpayOrder = paymentRes.data.data;

      setPaymentProcessing(true);

      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Kamyaabi',
        description: `Order #${orderResult.id}`,
        order_id: razorpayOrder.razorpayOrderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await paymentApi.verify({
              orderId: orderResult.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/orders/${orderResult.id}`);
          } catch {
            setError('Payment verification failed. If you were charged, a refund will be processed automatically.');
            setTimeout(() => navigate(`/orders/${orderResult.id}`), 3000);
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setError('Payment was cancelled. You can retry from your orders page.');
            setTimeout(() => navigate(`/orders/${orderResult.id}`), 3000);
          },
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#8B6914' },
      };

      const { loadRazorpay } = await import('../utils/loadRazorpay');
      await loadRazorpay();
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Failed to create order');
      setPaymentProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <Loading />;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography
        variant="h3"
        sx={{ mb: { xs: 3, sm: 4 }, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
      >
        Checkout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        <Grid item xs={12} md={8}>
          {}
          <Card sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant="h6">Shipping Address</Typography>
              <Button startIcon={<Add />} onClick={() => setShowAddDialog(true)}>
                Add Address
              </Button>
            </Box>

            {addresses.length === 0 ? (
              <Typography color="text.secondary">
                No addresses found. Please add a shipping address.
              </Typography>
            ) : (
              <RadioGroup
                value={selectedAddressId || ''}
                onChange={(e) => setSelectedAddressId(Number(e.target.value))}
              >
                {addresses.map((addr) => (
                  <FormControlLabel
                    key={addr.id}
                    value={addr.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography fontWeight={600}>{addr.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {addr.phone}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 1, alignItems: 'flex-start' }}
                  />
                ))}
              </RadioGroup>
            )}
          </Card>

          {}
          <Card sx={{ p: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Items
            </Typography>
            {cart.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography sx={{ minWidth: 0, wordBreak: 'break-word' }}>
                  {item.productName} x {item.quantity}
                </Typography>
                <Typography fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                  ₹{item.subtotal}
                </Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>₹{cart.totalAmount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Delivery</Typography>
              <Typography color="success.main">FREE</Typography>
            </Box>

            {/* Coupon / Promo Code Section */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalOffer fontSize="small" /> Promo Code
              </Typography>
              {couponResult ? (
                <Box>
                  <Chip
                    label={`${couponResult.code} — ₹${couponResult.discountAmount} off`}
                    color="success"
                    onDelete={handleRemoveCoupon}
                    deleteIcon={<Close />}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="success.main">
                    {couponResult.message}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Enter promo code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleValidateCoupon();
                    }}
                    error={!!couponError}
                    helperText={couponError}
                    disabled={couponLoading}
                    sx={{ flex: 1 }}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleValidateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    sx={{ minWidth: 80, height: 40 }}
                  >
                    {couponLoading ? <CircularProgress size={20} /> : 'Apply'}
                  </Button>
                </Box>
              )}
            </Box>

            {discountAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="success.main">Discount</Typography>
                <Typography color="success.main" fontWeight={600}>
                  -₹{discountAmount}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                ₹{finalTotal}
              </Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePlaceOrder}
              disabled={loading || paymentProcessing || !selectedAddressId}
            >
              {loading ? 'Processing...' : paymentProcessing ? 'Payment in progress...' : 'Place Order & Pay'}
            </Button>
          </Card>
        </Grid>
      </Grid>

      {}
      <AddressFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={loadAddresses}
      />
    </Container>
  );
};

export default CheckoutPage;
