import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Alert,
} from '@mui/material';
import { Refresh, LocalShipping } from '@mui/icons-material';
import { orderApi } from '../../api/orderApi';
import { TrackingInfo } from '../../types';
import { parseApiError } from '../../utils/apiError';

interface TrackingWidgetProps {
  orderId: number;
  awbNumber: string | null;
  courierName: string | null;
  shippingStatus: string | null;
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  AWB_ASSIGNED: 'info',
  PICKUP_SCHEDULED: 'info',
  IN_TRANSIT: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
  RTO: 'error',
};

const formatStatusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const TrackingWidget: React.FC<TrackingWidgetProps> = ({
  orderId,
  awbNumber,
  courierName,
  shippingStatus,
}) => {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!awbNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.trackShipment(orderId);
      setTracking(res.data.data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to fetch tracking info').message);
    } finally {
      setLoading(false);
    }
  }, [orderId, awbNumber]);

  useEffect(() => {
    if (awbNumber) fetchTracking();
  }, [awbNumber, fetchTracking]);

  if (!awbNumber && !shippingStatus) return null;

  const trackData = tracking?.tracking_data;
  const shipmentTrack = trackData?.shipment_track?.[0];
  const activities = trackData?.shipment_track_activities ?? [];
  const currentStatus = shipmentTrack?.current_status ?? shippingStatus ?? 'Pending';
  const courier = shipmentTrack?.courier_name ?? courierName;
  const edd = shipmentTrack?.edd;

  return (
    <Card sx={{ p: 3, '&:hover': { transform: 'none' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping color="primary" />
          <Typography variant="h6">Shipment Tracking</Typography>
        </Box>
        <Button
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
          onClick={fetchTracking}
          disabled={loading || !awbNumber}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Chip
          label={formatStatusLabel(currentStatus)}
          color={STATUS_COLORS[currentStatus.toUpperCase().replace(/\s/g, '_')] ?? 'default'}
          size="small"
        />
        {courier && (
          <Typography variant="body2" color="text.secondary">
            Courier: <strong>{courier}</strong>
          </Typography>
        )}
        {awbNumber && (
          <Typography variant="body2" color="text.secondary">
            AWB: <strong>{awbNumber}</strong>
          </Typography>
        )}
        {edd && (
          <Typography variant="body2" color="text.secondary">
            EDD: <strong>{new Date(edd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
          </Typography>
        )}
      </Box>

      {activities.length > 0 && (
        <Stepper orientation="vertical" activeStep={0} sx={{ mt: 2 }}>
          {activities.map((event, idx) => (
            <Step key={idx} completed={idx > 0}>
              <StepLabel
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {event.date ? new Date(event.date).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : ''}
                    {event.location ? ` — ${event.location}` : ''}
                  </Typography>
                }
              >
                {event.activity || event.status || 'Update'}
              </StepLabel>
              <StepContent />
            </Step>
          ))}
        </Stepper>
      )}

      {!awbNumber && shippingStatus && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your shipment is being prepared. Tracking details will be available once the package is dispatched.
        </Typography>
      )}
    </Card>
  );
};

export default TrackingWidget;
