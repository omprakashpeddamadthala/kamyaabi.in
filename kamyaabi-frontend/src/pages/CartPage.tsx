import React, { useEffect } from 'react';
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
} from '@mui/material';
import { Add, Remove, Delete, ShoppingBag } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCart, updateCartItem, removeFromCart } from '../features/cart/cartSlice';
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

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useAppSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

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

  return (
    <PageTransition>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Shopping Cart
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {cart.items.map((item) => (
            <Card key={item.id} sx={{ mb: 2, p: 2, '&:hover': { transform: 'none' } }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  image={item.productImageUrl || 'https://via.placeholder.com/100'}
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
                    onClick={() =>
                      dispatch(updateCartItem({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) }))
                    }
                  >
                    <Remove />
                  </IconButton>
                  <Typography fontWeight={600}>{item.quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity + 1 }))
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
            >
              Proceed to Checkout
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </PageTransition>
  );
};

export default CartPage;
