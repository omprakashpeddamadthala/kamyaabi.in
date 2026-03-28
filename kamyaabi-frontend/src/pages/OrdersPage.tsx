import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  Box,
  Chip,
  Button,
  Pagination,
} from '@mui/material';
import { Receipt } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchOrders } from '../features/order/orderSlice';
import Loading from '../components/common/Loading';

const statusColors: Record<string, 'warning' | 'info' | 'primary' | 'secondary' | 'success' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orders, totalPages, loading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders({}));
  }, [dispatch]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    dispatch(fetchOrders({ page: page - 1 }));
  };

  if (loading) return <Loading />;

  if (orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Receipt sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 2 }}>
          No orders yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start shopping to see your orders here
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')} size="large">
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 4 }}>
        My Orders
      </Typography>

      {orders.map((order) => (
        <Card
          key={order.id}
          sx={{ mb: 2, p: 3, cursor: 'pointer', '&:hover': { transform: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } }}
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                {order.items.length} item(s)
              </Typography>
            </Box>
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
          </Box>
        </Card>
      ))}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Container>
  );
};

export default OrdersPage;
