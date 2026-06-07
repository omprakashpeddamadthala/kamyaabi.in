/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves Shiprocket dashboard API data, metrics, status rendering, and admin actions.
 * - Visual-only tokenization of status colors.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  LocalShippingOutlined,
  AutorenewOutlined,
  Inventory2Outlined,
  CheckCircleOutlined,
  CancelOutlined,
  LocationOnOutlined,
  PaymentsOutlined,
  HourglassEmptyOutlined,
  RefreshOutlined,
  RouteOutlined,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { Order, ShiprocketStats } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import TableSkeleton from '../../components/common/TableSkeleton';

const PAGE_SIZE = 10;

type PaymentFilter = '' | 'PREPAID' | 'COD';

interface StatCardProps {
  icon: SvgIconComponent;
  label: string;
  value: number;
  color: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, loading }) => (
  <Card sx={{ p: 2.5, height: '100%', '&:hover': { transform: 'none' } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}1A`,
          color,
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={700}>
            {value.toLocaleString()}
          </Typography>
        )}
      </Box>
    </Box>
  </Card>
);

const formatStatus = (status: string | null | undefined) => {
  if (!status) return '—';
  return status.replace(/_/g, ' ');
};

const AdminShiprocketDashboardPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState<ShiprocketStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('');
  const [syncingOrderId, setSyncingOrderId] = useState<number | null>(null);

  const [refreshingAll, setRefreshingAll] = useState(false);

  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<Record<string, unknown> | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getShiprocketStats();
      setStats(res.data.data);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load Shiprocket stats').message);
    } finally {
      setStatsLoading(false);
    }
  }, [showError]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await adminApi.getShiprocketOrders(
        page,
        PAGE_SIZE,
        paymentFilter || undefined,
      );
      const data = res.data.data;
      setOrders(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load shipping orders').message);
    } finally {
      setOrdersLoading(false);
    }
  }, [page, paymentFilter, showError]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSync = async (orderId: number) => {
    setSyncingOrderId(orderId);
    try {
      await adminApi.syncShiprocketOrder(orderId);
      showSuccess('Shiprocket sync triggered for order #' + orderId);
      await Promise.all([loadStats(), loadOrders()]);
    } catch (err) {
      showError(parseApiError(err, 'Failed to trigger Shiprocket sync').message);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    try {
      const res = await adminApi.refreshAllShiprocketStatuses();
      const count = res.data.data.refreshedCount;
      showSuccess(`Refreshed shipment status for ${count} order(s)`);
      await Promise.all([loadStats(), loadOrders()]);
    } catch (err) {
      showError(parseApiError(err, 'Failed to refresh shipment statuses').message);
    } finally {
      setRefreshingAll(false);
    }
  };

  const handleTrack = async (order: Order) => {
    setTrackingOrder(order);
    setTrackingData(null);
    setTrackingError(null);
    setTrackingLoading(true);
    try {
      const res = await adminApi.trackShiprocketOrder(order.id);
      setTrackingData(res.data.data);
    } catch (err) {
      setTrackingError(parseApiError(err, 'Failed to fetch tracking information').message);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingOutlined fontSize="large" color="primary" />
            Shiprocket Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor orders placed and shipping started across your Shiprocket account.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={handleRefreshAll}
            disabled={refreshingAll || stats?.shiprocketConfigured === false}
          >
            {refreshingAll ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>
      </Stack>

      {stats && !stats.shiprocketConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Shiprocket integration is not configured. Set <code>SHIPROCKET_API_TOKEN</code> or{' '}
          <code>SHIPROCKET_EMAIL</code> / <code>SHIPROCKET_PASSWORD</code> in your environment to
          enable order sync and tracking.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={Inventory2Outlined}
            label="Orders synced"
            value={stats?.totalSynced ?? 0}
            color="var(--color-brand-accent)"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={HourglassEmptyOutlined}
            label="Sync pending"
            value={stats?.syncPending ?? 0}
            color="#ED6C02"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={LocationOnOutlined}
            label="Pickup scheduled"
            value={stats?.pickupScheduled ?? 0}
            color="#0288D1"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={LocalShippingOutlined}
            label="Shipping started"
            value={(stats?.awbAssigned ?? 0) + (stats?.inTransit ?? 0)}
            color="#1976D2"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={CheckCircleOutlined}
            label="Delivered"
            value={stats?.delivered ?? 0}
            color="var(--color-brand-accent)"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={CancelOutlined}
            label="Cancelled"
            value={stats?.cancelled ?? 0}
            color="#C62828"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={PaymentsOutlined}
            label="COD orders"
            value={stats?.codOrders ?? 0}
            color="#7B1FA2"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      <Card sx={{ p: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Recent Shipments</Typography>
          <Tabs
            value={paymentFilter}
            onChange={(_, v) => {
              setPaymentFilter(v as PaymentFilter);
              setPage(0);
            }}
            sx={{ minHeight: 36 }}
          >
            <Tab label="All" value="" sx={{ minHeight: 36 }} />
            <Tab label="Prepaid" value="PREPAID" sx={{ minHeight: 36 }} />
            <Tab label="COD" value="COD" sx={{ minHeight: 36 }} />
          </Tabs>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Shiprocket ID</TableCell>
                <TableCell>AWB / Courier</TableCell>
                <TableCell>Shipping Status</TableCell>
                <TableCell>Synced</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersLoading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No orders have been pushed to Shiprocket yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>#{o.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={o.paymentMethod === 'COD' ? 'COD' : 'Prepaid'}
                        size="small"
                        color={o.paymentMethod === 'COD' ? 'warning' : 'info'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={o.status} size="small" />
                    </TableCell>
                    <TableCell>{o.shiprocketOrderId ?? '—'}</TableCell>
                    <TableCell>
                      {o.awbNumber ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {o.awbNumber}
                          </Typography>
                          {o.courierName && (
                            <Typography variant="caption" color="text.secondary">
                              {o.courierName}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{formatStatus(o.shippingStatus)}</TableCell>
                    <TableCell>
                      {o.shiprocketSynced ? (
                        <Chip label="Synced" size="small" color="success" />
                      ) : (
                        <Chip label="Pending" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title={o.shiprocketSynced ? 'Refresh status from Shiprocket' : 'Sync to Shiprocket'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleSync(o.id)}
                              disabled={syncingOrderId === o.id || stats?.shiprocketConfigured === false}
                            >
                              <AutorenewOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={o.awbNumber ? 'View tracking' : 'AWB not assigned yet'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleTrack(o)}
                              disabled={!o.awbNumber}
                            >
                              <RouteOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
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
      </Card>

      <Dialog
        open={trackingOrder !== null}
        onClose={() => setTrackingOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Tracking — Order #{trackingOrder?.id}
          {trackingOrder?.awbNumber && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              AWB: {trackingOrder.awbNumber}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {trackingLoading ? (
            <Stack spacing={1}>
              <Skeleton height={28} />
              <Skeleton height={28} />
              <Skeleton height={28} />
            </Stack>
          ) : trackingError ? (
            <Alert severity="error">{trackingError}</Alert>
          ) : trackingData ? (
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {JSON.stringify(trackingData, null, 2)}
            </Box>
          ) : (
            <Typography color="text.secondary">No tracking information available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminShiprocketDashboardPage;
