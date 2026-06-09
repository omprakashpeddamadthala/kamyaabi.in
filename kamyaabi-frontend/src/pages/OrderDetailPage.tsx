/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves order detail fetching, invoice/download behavior, payment retry, Razorpay verification, and status/payment rendering.
 * - Visual-only tokenization of Razorpay theme color from design tokens.
 */
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchOrderById } from '../features/order/orderSlice';
import { paymentApi } from '../api/paymentApi';
import { orderApi } from '../api/orderApi';
import Loading from '../components/common/Loading';
import TrackingWidget from '../components/common/TrackingWidget';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';
import { Alert, Button, CircularProgress } from '@mui/material';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

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

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedOrder: order, loading } = useAppSelector((state) => state.orders);
  const { user } = useAppSelector((state) => state.auth);
  const [paymentProcessing, setPaymentProcessing] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = React.useState(false);
  const [invoiceError, setInvoiceError] = React.useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (id) dispatch(fetchOrderById(Number(id)));
  }, [dispatch, id]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(orderApi.downloadInvoiceUrl(order.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error('invoice-download-failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(fetchOrderById(order.id));
    } catch {
      setInvoiceError('Failed to download invoice. Please try again later.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setPaymentProcessing(true);
    setPaymentError(null);
    try {
      const paymentRes = await paymentApi.createOrder(order.id);
      const razorpayOrder = paymentRes.data.data;

      const razorpayThemeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-brand-primary')
        .trim();

      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Kamyaabi',
        description: `Order #${order.id}`,
        order_id: razorpayOrder.razorpayOrderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await paymentApi.verify({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            dispatch(fetchOrderById(order.id));
          } catch {
            setPaymentError('Payment verification failed.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setPaymentError('Payment was cancelled.');
          },
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: order.shippingAddress?.phone,
        },
        theme: { color: razorpayThemeColor },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setPaymentError('Failed to initiate payment retry. Please try again.');
      setPaymentProcessing(false);
    }
  };

  if (loading || !order) return <Loading />;

  const activeStep = getActiveStep(order.status, order.payment?.status);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/orders" underline="hover" color="inherit">Orders</MuiLink>
        <Typography color="text.primary">Order #{order.id}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3">Order #{order.id}</Typography>
        <Chip label={order.status} color="primary" />
      </Box>

      {paymentError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPaymentError(null)}>
          {paymentError}
        </Alert>
      )}
      {invoiceError && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setInvoiceError(null)}>
          {invoiceError}
        </Alert>
      )}

      {order.status !== 'CANCELLED' && (
        <Card sx={{ p: { xs: 2, sm: 3 }, mb: 4, '&:hover': { transform: 'none' }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Invoice</Typography>
            <Typography variant="body2" color="text.secondary">
              {order.invoiceGenerated ? `Ready${order.invoiceNumber ? `: ${order.invoiceNumber}` : ''}` : 'Download your order invoice'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleDownloadInvoice}
            disabled={invoiceLoading}
            startIcon={invoiceLoading ? <CircularProgress size={16} /> : undefined}
          >
            Download Invoice
          </Button>
        </Card>
      )}

      {order.status !== 'CANCELLED' && (
        <Card sx={{ p: { xs: 2, sm: 3 }, mb: 4, '&:hover': { transform: 'none' } }}>
          <Stepper
            activeStep={activeStep}
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {ORDER_STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {}
          <Card sx={{ p: { xs: 1.5, sm: 3 }, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
            {order.items.map((item) => (
              <Box key={item.id}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 1.5, sm: 2 },
                    py: 2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={item.productImageUrl || PRODUCT_PLACEHOLDER_IMAGE}
                    alt={item.productName}
                    sx={{
                      width: { xs: 56, sm: 80 },
                      height: { xs: 56, sm: 80 },
                      borderRadius: 1,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={600} sx={{ fontSize: 'var(--text-base)' }}>
                      {item.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity} x ₹{item.price}
                      {item.weightKg != null && (
                        <> · {item.weightKg < 1 ? `${(item.weightKg * 1000).toFixed(0)} g` : `${item.weightKg} kg`} each</>
                      )}
                    </Typography>
                  </Box>
                  <Typography fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                    ₹{item.subtotal}
                  </Typography>
                </Box>
                <Divider />
              </Box>
            ))}
            {order.totalWeightKg != null && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Weight: {order.totalWeightKg < 1 ? `${(order.totalWeightKg * 1000).toFixed(0)} g` : `${order.totalWeightKg} kg`}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                ₹{order.totalAmount}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {}
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

          {}
          {(order.payment || order.paymentMethod === 'COD') && (
            <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Payment</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Method</Typography>
                <Chip
                  label={order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Razorpay)'}
                  size="small"
                  color={order.paymentMethod === 'COD' ? 'warning' : 'info'}
                  variant="outlined"
                />
              </Box>
              {order.payment && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={order.payment.status}
                    size="small"
                    color={order.payment.status === 'COMPLETED' ? 'success' : 'warning'}
                  />
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography fontWeight={600}>₹{order.payment ? order.payment.amount : order.totalAmount}</Typography>
              </Box>
              {order.payment?.razorpayPaymentId && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Payment ID</Typography>
                  <Typography variant="body2">{order.payment.razorpayPaymentId}</Typography>
                </Box>
              )}

              {order.payment && (order.payment.status === 'PENDING' || order.payment.status === 'FAILED') && order.status !== 'CANCELLED' && order.paymentMethod !== 'COD' && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    color="primary"
                    onClick={handleRetryPayment}
                    disabled={paymentProcessing}
                    startIcon={paymentProcessing ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {paymentProcessing ? 'Processing...' : 'Retry Payment'}
                  </Button>
                </Box>
              )}
            </Card>
          )}

          {}
          {(order.awbNumber || order.shippingStatus) && (
            <Box sx={{ mt: 3 }}>
              <TrackingWidget
                orderId={order.id}
                awbNumber={order.awbNumber}
                courierName={order.courierName}
                shippingStatus={order.shippingStatus}
              />
            </Box>
          )}

          {}
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
