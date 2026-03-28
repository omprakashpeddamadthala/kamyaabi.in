import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  Box,
  Chip,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchOrderById } from '../features/order/orderSlice';
import Loading from '../components/common/Loading';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedOrder: order, loading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    if (id) dispatch(fetchOrderById(Number(id)));
  }, [dispatch, id]);

  if (loading || !order) return <Loading />;

  const activeStep = ORDER_STATUSES.indexOf(order.status);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/orders" underline="hover" color="inherit">Orders</MuiLink>
        <Typography color="text.primary">Order #{order.id}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3">Order #{order.id}</Typography>
        <Chip label={order.status} color="primary" />
      </Box>

      {/* Order Progress */}
      {order.status !== 'CANCELLED' && (
        <Card sx={{ p: 3, mb: 4, '&:hover': { transform: 'none' } }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {ORDER_STATUSES.map((status) => (
              <Step key={status}>
                <StepLabel>{status}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Order Items */}
          <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
            {order.items.map((item) => (
              <Box key={item.id}>
                <Box sx={{ display: 'flex', gap: 2, py: 2, alignItems: 'center' }}>
                  <Box
                    component="img"
                    src={item.productImageUrl || 'https://via.placeholder.com/80'}
                    alt={item.productName}
                    sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600}>{item.productName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity} x ₹{item.price}
                    </Typography>
                  </Box>
                  <Typography fontWeight={600}>₹{item.subtotal}</Typography>
                </Box>
                <Divider />
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                ₹{order.totalAmount}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card sx={{ p: 3, mb: 3, '&:hover': { transform: 'none' } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Shipping Address</Typography>
              <Typography fontWeight={600}>{order.shippingAddress.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shippingAddress.street}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {order.shippingAddress.phone}
              </Typography>
            </Card>
          )}

          {/* Payment Info */}
          {order.payment && (
            <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Payment</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={order.payment.status}
                  size="small"
                  color={order.payment.status === 'COMPLETED' ? 'success' : 'warning'}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography fontWeight={600}>₹{order.payment.amount}</Typography>
              </Box>
              {order.payment.razorpayPaymentId && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Payment ID</Typography>
                  <Typography variant="body2">{order.payment.razorpayPaymentId}</Typography>
                </Box>
              )}
            </Card>
          )}

          {/* Order Info */}
          <Card sx={{ p: 3, mt: 3, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Order Info</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Order Date</Typography>
              <Typography variant="body2">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Last Updated</Typography>
              <Typography variant="body2">
                {new Date(order.updatedAt).toLocaleDateString('en-IN')}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetailPage;
