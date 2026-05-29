import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Stack,
} from '@mui/material';
import {
  LocalShipping,
  Inventory,
  CreditCard,
  Money,
  SyncProblem,
  CheckCircle,
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { ShiprocketDashboard, Order } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import TableSkeleton from '../../components/common/TableSkeleton';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'> = {
  AWB_ASSIGNED: 'info',
  PICKUP_SCHEDULED: 'info',
  PICKED_UP: 'primary',
  IN_TRANSIT: 'primary',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'error',
  RETURN_INITIATED: 'error',
};

const AdminShiprocketPage: React.FC = () => {
  const { showError } = useToast();
  const [dashboard, setDashboard] = useState<ShiprocketDashboard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getShiprocketDashboard();
      setDashboard(res.data.data);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load Shiprocket dashboard').message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await adminApi.getShiprocketOrders(page, 10);
      const data = res.data.data;
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load Shiprocket orders').message);
    } finally {
      setOrdersLoading(false);
    }
  }, [page, showError]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const statCards = [
    {
      icon: <Inventory sx={{ fontSize: 36, color: 'primary.main' }} />,
      value: loading ? '—' : (dashboard?.totalOrders ?? 0).toLocaleString('en-IN'),
      label: 'Total Orders',
    },
    {
      icon: <CheckCircle sx={{ fontSize: 36, color: 'success.main' }} />,
      value: loading ? '—' : (dashboard?.shiprocketSyncedOrders ?? 0).toLocaleString('en-IN'),
      label: 'Shiprocket Synced',
    },
    {
      icon: <SyncProblem sx={{ fontSize: 36, color: 'warning.main' }} />,
      value: loading ? '—' : (dashboard?.pendingSyncOrders ?? 0).toLocaleString('en-IN'),
      label: 'Pending Sync',
    },
    {
      icon: <CreditCard sx={{ fontSize: 36, color: 'info.main' }} />,
      value: loading ? '—' : (dashboard?.onlineOrders ?? 0).toLocaleString('en-IN'),
      label: 'Online Payments',
    },
    {
      icon: <Money sx={{ fontSize: 36, color: 'secondary.main' }} />,
      value: loading ? '—' : (dashboard?.codOrders ?? 0).toLocaleString('en-IN'),
      label: 'Cash on Delivery',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <LocalShipping sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Shiprocket Dashboard
        </Typography>
      </Stack>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={4} md key={card.label}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
              {card.icon}
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                {card.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Shipping Status Breakdown */}
      {dashboard && Object.keys(dashboard.shippingStatusBreakdown).length > 0 && (
        <Card sx={{ p: 3, mb: 4, '&:hover': { transform: 'none' } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Shipping Status Breakdown
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(dashboard.shippingStatusBreakdown).map(([status, count]) => (
              <Chip
                key={status}
                label={`${status.replace(/_/g, ' ')} (${count})`}
                color={STATUS_COLORS[status] || 'default'}
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.85rem' }}
              />
            ))}
          </Box>
        </Card>
      )}

      {/* Order Status Breakdown */}
      {dashboard && Object.keys(dashboard.ordersByStatus).length > 0 && (
        <Card sx={{ p: 3, mb: 4, '&:hover': { transform: 'none' } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Synced Orders by Status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(dashboard.ordersByStatus).map(([status, count]) => (
              <Chip
                key={status}
                label={`${status.replace(/_/g, ' ')} (${count})`}
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.85rem' }}
              />
            ))}
          </Box>
        </Card>
      )}

      {/* Shiprocket Orders Table */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Shiprocket Orders ({totalElements})
      </Typography>
      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Courier</TableCell>
              <TableCell>AWB</TableCell>
              <TableCell>Shipping Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordersLoading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No Shiprocket orders yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>#{o.id}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.paymentMethod === 'COD' ? 'COD' : 'Online'}
                      size="small"
                      color={o.paymentMethod === 'COD' ? 'warning' : 'info'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>₹{o.totalAmount}</TableCell>
                  <TableCell>
                    <Chip label={o.status} size="small" />
                  </TableCell>
                  <TableCell>{o.courierName || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {o.awbNumber || '—'}
                  </TableCell>
                  <TableCell>
                    {o.shippingStatus ? (
                      <Chip
                        label={o.shippingStatus.replace(/_/g, ' ')}
                        size="small"
                        color={STATUS_COLORS[o.shippingStatus] || 'default'}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
          />
        </Box>
      )}
    </Container>
  );
};

export default AdminShiprocketPage;
