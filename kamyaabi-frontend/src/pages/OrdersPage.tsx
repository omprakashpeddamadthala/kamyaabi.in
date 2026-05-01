import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  Box,
  Chip,
  Button,
  Pagination,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
} from '@mui/material';
import { Receipt, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchOrders } from '../features/order/orderSlice';
import Loading from '../components/common/Loading';

const statusColors: Record<string, 'warning' | 'info' | 'primary' | 'secondary' | 'success' | 'error'> = {
  PENDING: 'warning',
  PAID: 'info',
  CONFIRMED: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'error',
  PAYMENT_FAILED: 'error',
};

const ORDER_STEP_LABELS = ['Placed', 'Paid', 'Processing', 'Shipped', 'Delivered'] as const;

const PAID_STEP_INDEX = 1;

const getActiveStep = (status: string, paymentStatus?: string): number => {
  if (paymentStatus === 'COMPLETED' && status === 'PENDING') {
    return PAID_STEP_INDEX + 1;
  }
  switch (status) {
    case 'PENDING': return 0;
    case 'PAID': return PAID_STEP_INDEX + 1;
    case 'CONFIRMED':
    case 'PROCESSING': return 2;
    case 'SHIPPED': return 3;
    case 'DELIVERED': return ORDER_STEP_LABELS.length;
    default: return -1;
  }
};

const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orders, totalPages, totalElements, currentPage, pageSize, loading } =
    useAppSelector((state) => state.orders);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchOrders({}));
  }, [dispatch]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    dispatch(fetchOrders({ page: page - 1 }));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) return <Loading />;

  if (orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Receipt sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 2 }}>
          {"You haven't placed any orders yet."}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start shopping to see your orders here
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')} size="large">
          Shop Now
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        My Orders
      </Typography>
      {totalElements > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Showing {currentPage * pageSize + 1}
          –{Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
          {' '}{totalElements === 1 ? 'order' : 'orders'}
        </Typography>
      )}

      {orders.map((order) => (
        <Card
          key={order.id}
          sx={{ mb: 2, p: 3, '&:hover': { transform: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, cursor: 'pointer' }}
            onClick={(e) => toggleExpand(order.id, e)}
          >
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                Order #{order.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  label={order.status}
                  color={statusColors[order.status] || 'default'}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h6" color="primary">
                  ₹{order.totalAmount}
                </Typography>
              </Box>
              {expandedOrderId === order.id ? <ExpandLess /> : <ExpandMore />}
            </Box>
          </Box>

          <Collapse in={expandedOrderId === order.id}>
            <Divider sx={{ my: 2 }} />

            {order.status !== 'CANCELLED' && (
              <Box sx={{ mb: 3 }}>
                <Stepper
                  activeStep={getActiveStep(order.status, order.payment?.status)}
                  alternativeLabel
                >
                  {ORDER_STEP_LABELS.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}
            {order.status === 'CANCELLED' && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Chip label="Order Cancelled" color="error" />
              </Box>
            )}

            {}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Items</Typography>
            {order.items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                {item.productImageUrl && (
                  <Box
                    component="img"
                    src={item.productImageUrl}
                    alt={item.productName}
                    sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.productName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Qty: {item.quantity} × ₹{item.price}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{item.subtotal}</Typography>
              </Box>
            ))}

            {}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {order.shippingAddress && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Delivery Address</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.street}, {order.shippingAddress.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </Typography>
                  {order.shippingAddress.phone && (
                    <Typography variant="body2" color="text.secondary">
                      Phone: {order.shippingAddress.phone}
                    </Typography>
                  )}
                </Grid>
              )}
              {order.payment && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Payment</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {order.payment.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amount: ₹{order.payment.amount}
                  </Typography>
                  {order.payment.razorpayPaymentId && (
                    <Typography variant="body2" color="text.secondary">
                      Payment ID: {order.payment.razorpayPaymentId}
                    </Typography>
                  )}
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button size="small" variant="outlined" onClick={() => navigate(`/orders/${order.id}`)}>
                View Full Details
              </Button>
            </Box>
          </Collapse>
        </Card>
      ))}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage + 1}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
};

export default OrdersPage;
