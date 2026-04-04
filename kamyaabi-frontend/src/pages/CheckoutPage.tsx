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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCart } from '../features/cart/cartSlice';
import { createOrder } from '../features/order/orderSlice';
import { addressApi, AddressRequest } from '../api/addressApi';
import { paymentApi } from '../api/paymentApi';
import { Address } from '../types';
import Loading from '../components/common/Loading';

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
  const [formData, setFormData] = useState<AddressRequest>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      await addressApi.create(formData);
      setShowAddDialog(false);
      setFormData({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
      loadAddresses();
    } catch {
      setError('Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }
    if (paymentProcessing) return;
    setLoading(true);
    setError(null);
    try {
      const orderResult = await dispatch(createOrder(selectedAddressId)).unwrap();

      // Create Razorpay order
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Checkout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Shipping Address */}
          <Card sx={{ p: 3, mb: 3, '&:hover': { transform: 'none' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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

          {/* Order Items */}
          <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Items
            </Typography>
            {cart.items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>
                  {item.productName} x {item.quantity}
                </Typography>
                <Typography fontWeight={600}>₹{item.subtotal}</Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
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
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                ₹{cart.totalAmount}
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

      {/* Add Address Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Shipping Address</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Street Address"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              fullWidth
              multiline
              rows={2}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            <TextField
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)} disabled={savingAddress}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAddress} disabled={savingAddress}>
            {savingAddress ? 'Saving...' : 'Save Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CheckoutPage;
