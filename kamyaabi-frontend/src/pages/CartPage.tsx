import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Button,
  Divider,
  Skeleton,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingBag, LocationOn, Person } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCart, updateCartItem, removeFromCart, optimisticUpdateQuantity } from '../features/cart/cartSlice';
import { addressApi } from '../api/addressApi';
import { Address } from '../types';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';
import AddressFormDialog from '../components/common/AddressFormDialog';
import PageTransition from '../components/common/PageTransition';

const CartSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={200} height={48} sx={{ mb: 4 }} animation="wave" />
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} sx={{ mb: 2, p: 2, '&:hover': { transform: 'none' } }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Skeleton variant="rectangular" width={100} height={100} sx={{ borderRadius: 1 }} animation="wave" />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={24} animation="wave" />
                <Skeleton variant="text" width="30%" height={20} animation="wave" />
              </Box>
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} animation="wave" />
              <Skeleton variant="text" width={60} height={28} animation="wave" />
            </Box>
          </Card>
        ))}
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
          <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} animation="wave" />
          <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} animation="wave" />
          <Skeleton variant="text" width="100%" height={20} sx={{ mb: 2 }} animation="wave" />
          <Skeleton variant="rectangular" height={1} sx={{ mb: 2 }} animation="wave" />
          <Skeleton variant="text" width="100%" height={28} sx={{ mb: 3 }} animation="wave" />
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} animation="wave" />
        </Card>
      </Grid>
    </Grid>
  </Container>
);

const AddressSkeleton: React.FC = () => (
  <Box>
    {[1, 2].map((i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
        <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1.5, mt: 0.5 }} animation="wave" />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="40%" height={22} animation="wave" />
          <Skeleton variant="text" width="70%" height={18} animation="wave" />
          <Skeleton variant="text" width="30%" height={18} animation="wave" />
        </Box>
      </Box>
    ))}
  </Box>
);

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useAppSelector((state) => state.cart);
  const { token } = useAppSelector((state) => state.auth);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const loadAddresses = useCallback(async () => {
    if (!token) return;
    setAddressLoading(true);
    setAddressError(null);
    try {
      const res = await addressApi.getAll();
      const fetchedAddresses = res.data.data;
      setAddresses(fetchedAddresses);
      const defaultAddr = fetchedAddresses.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (fetchedAddresses.length > 0) {
        setSelectedAddressId(fetchedAddresses[0].id);
      } else {
        setSelectedAddressId(null);
      }
    } catch {
      setAddressError('Failed to load addresses');
    } finally {
      setAddressLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleQuantityChange = useCallback(
    (itemId: number, quantity: number) => {
      dispatch(optimisticUpdateQuantity({ itemId, quantity }));
      if (debounceTimers.current[itemId]) {
        clearTimeout(debounceTimers.current[itemId]);
      }
      debounceTimers.current[itemId] = setTimeout(() => {
        dispatch(updateCartItem({ itemId, quantity }));
        delete debounceTimers.current[itemId];
      }, 400);
    },
    [dispatch]
  );

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleAddressSaved = () => {
    loadAddresses();
  };

  if (loading) return <CartSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 2 }}>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Add some delicious dry fruits to your cart
        </Typography>
        <Button component={Link} to="/products" variant="contained" size="large">
          Continue Shopping
        </Button>
      </Container>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const hasAddresses = addresses.length > 0;

  return (
    <PageTransition>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Shopping Cart
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {}
          <Card sx={{ p: 3, mb: 3, '&:hover': { transform: 'none' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                Delivery Address
              </Typography>
              {hasAddresses && (
                <Button
                  size="small"
                  component={Link}
                  to="/profile"
                  startIcon={<Person />}
                  sx={{ textTransform: 'none' }}
                >
                  Manage Addresses
                </Button>
              )}
            </Box>

            {addressError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddressError(null)}>
                {addressError}
              </Alert>
            )}

            {addressLoading ? (
              <AddressSkeleton />
            ) : !hasAddresses ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <LocationOn sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No saved addresses. Please add a delivery address to proceed.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAddressForm(true)}
                >
                  Add Address
                </Button>
              </Box>
            ) : (
              <RadioGroup
                value={selectedAddressId || ''}
                onChange={(e) => setSelectedAddressId(Number(e.target.value))}
              >
                {addresses.map((addr) => (
                  <FormControlLabel
                    key={addr.id}
                    value={addr.id}
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={600} variant="body2">
                            {addr.fullName}
                          </Typography>
                          {addr.isDefault && (
                            <Chip label="Default" color="primary" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {addr.street}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {addr.phone}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      mb: 1,
                      alignItems: 'flex-start',
                      border: '1px solid',
                      borderColor: selectedAddressId === addr.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mx: 0,
                      px: 1,
                      transition: 'border-color 0.2s ease',
                    }}
                  />
                ))}
              </RadioGroup>
            )}
          </Card>

          {}
          {cart.items.map((item) => (
            <Card key={item.id} sx={{ mb: 2, p: 2, '&:hover': { transform: 'none' } }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  image={item.productImageUrl || PRODUCT_PLACEHOLDER_IMAGE}
                  alt={item.productName}
                  sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1rem', cursor: 'pointer' }}
                    onClick={() => navigate(`/products/${item.productId}`)}
                  >
                    {item.productName}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    ₹{item.productDiscountPrice || item.productPrice}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    aria-label={item.quantity === 1 ? 'Remove item from cart' : 'Decrease quantity'}
                    onClick={() => {
                      if (item.quantity <= 1) {
                        if (debounceTimers.current[item.id]) {
                          clearTimeout(debounceTimers.current[item.id]);
                          delete debounceTimers.current[item.id];
                        }
                        dispatch(removeFromCart(item.id));
                        return;
                      }
                      handleQuantityChange(item.id, item.quantity - 1);
                    }}
                  >
                    <Remove />
                  </IconButton>
                  <Typography fontWeight={600}>{item.quantity}</Typography>
                  <IconButton
                    size="small"
                    aria-label="Increase quantity"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                  >
                    <Add />
                  </IconButton>
                </Box>
                <Typography variant="h6" sx={{ minWidth: 80, textAlign: 'right' }}>
                  ₹{item.subtotal}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => dispatch(removeFromCart(item.id))}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Summary
            </Typography>

            {selectedAddress && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  DELIVER TO
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedAddress.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Items ({cart.totalItems})</Typography>
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
              onClick={() => navigate('/checkout')}
              disabled={!selectedAddressId || addressLoading}
              startIcon={addressLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {!hasAddresses ? 'Add Address to Proceed' : 'Proceed to Checkout'}
            </Button>
            {!hasAddresses && !addressLoading && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                Please add a delivery address before checkout
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      {}
      <AddressFormDialog
        open={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSaved={handleAddressSaved}
      />
    </Container>
    </PageTransition>
  );
};

export default CartPage;
