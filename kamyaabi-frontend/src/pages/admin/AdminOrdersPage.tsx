import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Link,
} from '@mui/material';
import {
  AutorenewOutlined,
  VisibilityOutlined,
  LocalShippingOutlined,
  InventoryOutlined,
  PhoneOutlined,
  CloseOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { Order } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { triggerBlobDownload } from '../../utils/download';
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
  const [statusFilter, setStatusFilter] = useState('PAID,SHIPPED,DELIVERED');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailTab, setDetailTab] = useState<'items' | 'address'>('items');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const openDetail = (order: Order, tab: 'items' | 'address') => {
    setDetailOrder(order);
    setDetailTab(tab);
  };

  const closeDetail = () => setDetailOrder(null);

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

  const handleDownloadInvoice = async (orderId: number) => {
    setDownloadingId(orderId);
    try {
      const response = await adminApi.downloadInvoice(orderId);
      triggerBlobDownload(response.data, `invoice_${orderId}.pdf`);
      loadOrders();
    } catch (err) {
      showError(parseApiError(err, 'Failed to download invoice').message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRefreshShipment = async (orderId: number) => {
    setRefreshingId(orderId);
    try {
      await adminApi.syncShiprocketOrder(orderId);
      showSuccess('Shipment status refreshed for order #' + orderId);
      loadOrders();
    } catch (err) {
      showError(parseApiError(err, 'Failed to refresh shipment status').message);
    } finally {
      setRefreshingId(null);
    }
  };

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await adminApi.exportOrdersCsv();
      triggerBlobDownload(response.data, `orders_export_${Date.now()}.csv`);
      showSuccess('Orders exported successfully');
    } catch (err) {
      showError(parseApiError(err, 'Failed to export orders').message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const response = await adminApi.importOrdersCsv(file);
      const result = response.data.data;
      showSuccess(
        `Import complete: ${result.updatedOrders} orders updated, ${result.skippedRows} skipped.`,
      );
      if (result.errors?.length) {
        console.warn('Import warnings:', result.errors);
      }
      loadOrders();
    } catch (err) {
      showError(parseApiError(err, 'Import failed. Please check your CSV format.').message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleImport}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Orders</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadOutlined />}
            onClick={handleExport}
            disabled={exporting || loading}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={importing ? <CircularProgress size={16} /> : <FileUploadOutlined />}
            onClick={() => importInputRef.current?.click()}
            disabled={importing || loading}
          >
            Import
          </Button>
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
              <MenuItem value="PAID,SHIPPED,DELIVERED">Active Orders (Paid / Shipped / Delivered)</MenuItem>
              {ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Order ID</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Date</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Items</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Shipping</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {statusFilter ? `No orders for status: ${statusFilter.replace('_', ' ')}` : 'No orders yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>#{o.id}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
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
                      <Tooltip title="View items">
                        <Link
                          component="button"
                          underline="hover"
                          variant="body2"
                          onClick={() => openDetail(o, 'items')}
                          sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <InventoryOutlined sx={{ fontSize: 14 }} />
                          {o.items.length} item{o.items.length > 1 ? 's' : ''}
                        </Link>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>₹{o.totalAmount}</TableCell>
                  <TableCell>
                    <Chip label={o.status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {o.shippingAddress ? (
                        <Tooltip title="View address">
                          <Link
                            component="button"
                            underline="hover"
                            variant="body2"
                            onClick={() => openDetail(o, 'address')}
                            sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <LocalShippingOutlined sx={{ fontSize: 14 }} />
                            {o.shippingAddress.city}
                          </Link>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                      {o.shippingStatus && (
                        <Chip label={o.shippingStatus.replace(/_/g, ' ')} size="small" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 110 }} disabled={updatingId === o.id}>
                        <InputLabel>Update</InputLabel>
                        <Select label="Update" value="" onChange={(e) => handleUpdateStatus(o.id, e.target.value)}>
                          {['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Tooltip title="Download Invoice">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadInvoice(o.id)}
                            disabled={downloadingId === o.id}
                          >
                            {downloadingId === o.id ? <CircularProgress size={16} /> : <VisibilityOutlined fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      {o.shiprocketSynced && (
                        <Tooltip title="Refresh shipping status">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleRefreshShipment(o.id)}
                              disabled={refreshingId === o.id}
                            >
                              {refreshingId === o.id ? <CircularProgress size={16} /> : <AutorenewOutlined fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail popup for Items / Shipping Address */}
      <Dialog open={!!detailOrder} onClose={closeDetail} maxWidth="sm" fullWidth>
        {detailOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Order #{detailOrder.id} — {detailTab === 'items' ? 'Items' : 'Shipping Address'}
              <IconButton size="small" onClick={closeDetail}><CloseOutlined fontSize="small" /></IconButton>
            </DialogTitle>
            <Box sx={{ display: 'flex', gap: 1, px: 3, pb: 1 }}>
              <Chip
                label="Items"
                size="small"
                variant={detailTab === 'items' ? 'filled' : 'outlined'}
                color={detailTab === 'items' ? 'primary' : 'default'}
                onClick={() => setDetailTab('items')}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="Address"
                size="small"
                variant={detailTab === 'address' ? 'filled' : 'outlined'}
                color={detailTab === 'address' ? 'primary' : 'default'}
                onClick={() => setDetailTab('address')}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
            <DialogContent dividers>
              {detailTab === 'items' ? (
                detailOrder.items.length === 0 ? (
                  <Typography color="text.secondary">No items</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Weight</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {item.productWeight
                              ? `${item.productWeight} ${item.productUnit || ''}`
                              : '—'}
                          </TableCell>
                          <TableCell align="right">₹{item.price}</TableCell>
                          <TableCell align="right">₹{item.subtotal}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : (
                detailOrder.shippingAddress ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {detailOrder.shippingAddress.fullName}
                    </Typography>
                    <Divider />
                    <Typography variant="body2">{detailOrder.shippingAddress.street}</Typography>
                    {detailOrder.shippingAddress.addressLine2 && (
                      <Typography variant="body2">{detailOrder.shippingAddress.addressLine2}</Typography>
                    )}
                    <Typography variant="body2">
                      {detailOrder.shippingAddress.city}, {detailOrder.shippingAddress.state} — {detailOrder.shippingAddress.pincode}
                    </Typography>
                    {detailOrder.shippingAddress.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PhoneOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{detailOrder.shippingAddress.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No address</Typography>
                )
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetail}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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
