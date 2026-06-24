import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  Chip,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepConnector,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  LocalShipping,
  CheckCircle,
  RadioButtonUnchecked,
  Inventory2,
  Payment,
  Settings,
  FlightTakeoff,
  Home,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { trackingApi } from '../api/trackingApi';
import Seo from '../components/common/Seo';
import { PublicOrderTracking, TrackingEvent } from '../types';
import { parseApiError } from '../utils/apiError';
import PageTransition from '../components/common/PageTransition';

/* ── Order lifecycle steps ────────────────────────────────── */

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: <Inventory2 /> },
  { key: 'PAID', label: 'Payment Confirmed', icon: <Payment /> },
  { key: 'PROCESSING', label: 'Processing', icon: <Settings /> },
  { key: 'SHIPPED', label: 'Shipped', icon: <FlightTakeoff /> },
  { key: 'DELIVERED', label: 'Delivered', icon: <Home /> },
];

const STATUS_TO_STEP: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  PAYMENT_FAILED: -1,
  RTO: -1,
};

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PAID: 'info',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'info',
  IN_TRANSIT: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
  PAYMENT_FAILED: 'error',
  RTO: 'error',
};

const formatLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ── Styled stepper connector ─────────────────────────────── */

const LifecycleConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.grey[300],
    borderTopWidth: 3,
    borderRadius: 1,
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.success.main,
  },
}));

/* ── Component ────────────────────────────────────────────── */

const TrackOrderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState(searchParams.get('orderId') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<PublicOrderTracking | null>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setTracking(null);
    try {
      const res =
        tab === 0
          ? await trackingApi.trackByOrderId(Number(trimmed))
          : await trackingApi.trackByAwb(trimmed);
      setTracking(res.data.data);
      if (tab === 0) setSearchParams({ orderId: trimmed });
      else setSearchParams({ awb: trimmed });
    } catch (err) {
      setError(parseApiError(err, 'Order not found. Please check your order ID or tracking number.').message);
    } finally {
      setLoading(false);
    }
  }, [query, tab, setSearchParams]);

  useEffect(() => {
    const oid = searchParams.get('orderId');
    const awb = searchParams.get('awb');
    if (oid) {
      setTab(0);
      setQuery(oid);
      trackingApi.trackByOrderId(Number(oid))
        .then((r) => setTracking(r.data.data))
        .catch((e) => setError(parseApiError(e).message));
    } else if (awb) {
      setTab(1);
      setQuery(awb);
      trackingApi.trackByAwb(awb)
        .then((r) => setTracking(r.data.data))
        .catch((e) => setError(parseApiError(e).message));
    }
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeStep =
    tracking
      ? STATUS_TO_STEP[tracking.orderStatus] ?? 0
      : -1;
  const isCancelled =
    tracking?.orderStatus === 'CANCELLED' ||
    tracking?.orderStatus === 'PAYMENT_FAILED' ||
    tracking?.orderStatus === 'RTO';

  const activities: TrackingEvent[] =
    tracking?.trackingData?.tracking_data?.shipment_track_activities ?? [];
  const shipmentTrack = tracking?.trackingData?.tracking_data?.shipment_track?.[0];
  const edd = shipmentTrack?.edd;

  return (
    <PageTransition>
      {/* GSC FIX: public order-tracking tool — indexable with canonical/OG. */}
      <Seo
        title="Track Your Order"
        description="Track your Kamyaabi order in real time. Enter your order ID or AWB number to see the latest shipment status and estimated delivery date."
        canonicalPath="/track-order"
      />
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '80vh', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LocalShipping sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Track Your Order
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your order number or tracking code to see the latest status
            </Typography>
          </Box>

          {/* Search Card */}
          <Card sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setQuery(''); setError(null); setTracking(null); }}
              sx={{ mb: 2 }}
              variant="fullWidth"
            >
              <Tab label="Order ID" />
              <Tab label="Tracking Number (AWB)" />
            </Tabs>
            <Box
              component="form"
              onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSearch(); }}
              sx={{ display: 'flex', gap: 1.5 }}
            >
              <TextField
                fullWidth
                placeholder={tab === 0 ? 'Enter your Order ID (e.g. 1001)' : 'Enter AWB / tracking number'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type={tab === 0 ? 'number' : 'text'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !query.trim()}
                sx={{
                  px: 4,
                  borderRadius: 2,
                  minWidth: 120,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Track'}
              </Button>
            </Box>
          </Card>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Results */}
          {tracking && (
            <Box>
              {/* Order Status Chip Bar */}
              <Card sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Order #{tracking.orderId}
                  </Typography>
                  <Chip
                    label={formatLabel(tracking.orderStatus)}
                    color={STATUS_COLORS[tracking.orderStatus] ?? 'default'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 1 }}>
                  {tracking.placedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Placed:{' '}
                      <strong>
                        {new Date(tracking.placedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </Typography>
                  )}
                  {tracking.courierName && (
                    <Typography variant="body2" color="text.secondary">
                      Courier: <strong>{tracking.courierName}</strong>
                    </Typography>
                  )}
                  {tracking.awbNumber && (
                    <Typography variant="body2" color="text.secondary">
                      AWB: <strong>{tracking.awbNumber}</strong>
                    </Typography>
                  )}
                  {edd && (
                    <Typography variant="body2" color="text.secondary">
                      Expected Delivery:{' '}
                      <strong>
                        {new Date(edd).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </Typography>
                  )}
                </Box>
              </Card>

              {/* Order Lifecycle Stepper (horizontal) */}
              {!isCancelled && (
                <Card sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, overflowX: 'auto' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Order Progress
                  </Typography>
                  <Stepper
                    activeStep={activeStep}
                    alternativeLabel
                    connector={<LifecycleConnector />}
                  >
                    {ORDER_STEPS.map((step) => (
                      <Step key={step.key}>
                        <StepLabel
                          StepIconComponent={() => {
                            const idx = ORDER_STEPS.findIndex((s) => s.key === step.key);
                            const done = idx <= activeStep;
                            return done ? (
                              <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
                            ) : (
                              <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: 28 }} />
                            );
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: ORDER_STEPS.findIndex((s) => s.key === step.key) <= activeStep ? 700 : 400,
                              color:
                                ORDER_STEPS.findIndex((s) => s.key === step.key) <= activeStep
                                  ? 'text.primary'
                                  : 'text.secondary',
                            }}
                          >
                            {step.label}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              )}

              {/* Cancelled / RTO banner */}
              {isCancelled && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {tracking.orderStatus === 'CANCELLED'
                    ? 'This order has been cancelled.'
                    : tracking.orderStatus === 'PAYMENT_FAILED'
                      ? 'Payment failed for this order.'
                      : 'This shipment is being returned to origin (RTO).'}
                </Alert>
              )}

              {/* Shipment Tracking Activities (vertical) */}
              {activities.length > 0 && (
                <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <LocalShipping color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Shipment Activity
                    </Typography>
                  </Box>
                  <Stepper orientation="vertical" activeStep={0}>
                    {activities.map((evt, idx) => (
                      <Step key={idx} completed={idx > 0}>
                        <StepLabel
                          optional={
                            <Typography variant="caption" color="text.secondary">
                              {evt.date
                                ? new Date(evt.date).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                              {evt.location ? ` — ${evt.location}` : ''}
                            </Typography>
                          }
                        >
                          {evt.activity || evt.status || 'Update'}
                        </StepLabel>
                        <StepContent />
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              )}

              {/* No tracking yet */}
              {!isCancelled && activities.length === 0 && !tracking.awbNumber && (
                <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Your order is being prepared. Detailed shipment tracking will appear here once the package is dispatched.
                  </Typography>
                </Card>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </PageTransition>
  );
};

export default TrackOrderPage;
