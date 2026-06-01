import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
} from '@mui/material';
import { adminApi } from '../../api/adminApi';
import { Order } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import TableSkeleton from '../../components/common/TableSkeleton';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const ORDER_STATUSES = [
  'PAID',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'PENDING',
] as const;

const clampLimit = (raw: string | null): number => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE;
};

const clampPage = (raw: string | null): number => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
};

const AdminOrdersPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = clampPage(searchParams.get('page')) - 1;
  const limit = clampLimit(searchParams.get('limit'));

  const updateUrlParams = useCallback(
    (patch: Partial<{ page: number; limit: number }>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.page !== undefined) {
            if (patch.page <= 1) next.delete('page');
            else next.set('page', String(patch.page));
          }
          if (patch.limit !== undefined) {
            if (patch.limit === DEFAULT_PAGE_SIZE) next.delete('limit');
            else next.set('limit', String(patch.limit));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllOrders(page, limit, statusFilter || undefined);
      const data = res.data.data;
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load orders').message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, showError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    if (!status) return;
    setUpdatingId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, status);
      showSuccess('Order status updated');
      loadOrders();
    } catch (err) {
      showError(parseApiError(err, 'Failed to update order status').message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Orders</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }} disabled={loading}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              updateUrlParams({ page: 1 });
            }}
          >
            <MenuItem value="">All Orders</MenuItem>
            {ORDER_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Shipping Address</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Shipping</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={10} />
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {statusFilter ? `No orders for status: ${statusFilter.replace('_', ' ')}` : 'No orders yet.'}
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
                  <TableCell>
                    {o.items.length === 0 ? (
                      '—'
                    ) : (
                      <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
                        {o.items.map((item) => (
                          <Box component="li" key={item.id} sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                            {item.productName} × {item.quantity}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {o.totalWeightKg != null
                      ? o.totalWeightKg < 1
                        ? `${(o.totalWeightKg * 1000).toFixed(0)} g`
                        : `${o.totalWeightKg} kg`
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', minWidth: 140 }}>
                    {o.shippingAddress ? (
                      <Box>
                        <Box sx={{ fontWeight: 600 }}>{o.shippingAddress.fullName}</Box>
                        <Box>{o.shippingAddress.street}</Box>
                        <Box>{o.shippingAddress.city}, {o.shippingAddress.state}</Box>
                        <Box>{o.shippingAddress.pincode}</Box>
                        {o.shippingAddress.phone && <Box>📞 {o.shippingAddress.phone}</Box>}
                      </Box>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>₹{o.totalAmount}</TableCell>
                  <TableCell>
                    <Chip label={o.status} size="small" />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', minWidth: 120 }}>
                    {o.awbNumber ? (
                      <Box>
                        {o.courierName && <Box sx={{ fontWeight: 600 }}>{o.courierName}</Box>}
                        <Box>AWB: {o.awbNumber}</Box>
                        {o.shippingStatus && (
                          <Chip label={o.shippingStatus.replace(/_/g, ' ')} size="small" color="info" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    ) : o.shiprocketSynced === false && (o.status === 'PAID' || o.status === 'CONFIRMED') ? (
                      <Chip label="Sync Pending" size="small" color="warning" />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 130 }} disabled={updatingId === o.id}>
                      <InputLabel>Update</InputLabel>
                      <Select label="Update" value="" onChange={(e) => handleUpdateStatus(o.id, e.target.value)}>
                        {['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(totalPages > 1 || totalElements > 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalElements} order{totalElements === 1 ? '' : 's'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Per page</InputLabel>
              <Select label="Per page" value={limit} onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {totalPages > 1 && (
              <Pagination count={totalPages} page={page + 1} onChange={(_, p) => updateUrlParams({ page: p })} />
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AdminOrdersPage;
