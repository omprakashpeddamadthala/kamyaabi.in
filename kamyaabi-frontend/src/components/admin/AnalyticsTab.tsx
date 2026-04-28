import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../../api/adminApi';
import { AnalyticsResponse } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../common/ToastProvider';

type Metric = 'revenue' | 'orders';

/** ISO (yyyy-mm-dd) for today in the user's local timezone. */
const isoToday = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isoDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Shorter label (dd MMM) so weekly/monthly charts don't get crowded. */
const formatAxisLabel = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

interface AnalyticsTabProps {
  /**
   * Parent passes `active` when the Analytics tab is the currently selected
   * tab. We only fetch when active so switching between other tabs doesn't
   * spam the backend.
   */
  active: boolean;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ active }) => {
  const { showError } = useToast();

  // Default: last 7 days (inclusive of today).
  const [startDate, setStartDate] = useState<string>(isoDaysAgo(6));
  const [endDate, setEndDate] = useState<string>(isoToday());
  const [pendingStart, setPendingStart] = useState<string>(isoDaysAgo(6));
  const [pendingEnd, setPendingEnd] = useState<string>(isoToday());
  const [metric, setMetric] = useState<Metric>('revenue');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAnalytics(startDate, endDate);
      setData(res.data.data);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to load analytics');
      setError(parsed.message);
      showError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, showError]);

  useEffect(() => {
    if (active) fetchAnalytics();
  }, [active, fetchAnalytics]);

  const chartData = useMemo(
    () =>
      (data?.points ?? []).map((p) => ({
        date: p.date,
        label: formatAxisLabel(p.date),
        revenue: Number(p.revenue ?? 0),
        orders: p.orders,
      })),
    [data],
  );

  const applyRange = () => {
    if (!pendingStart || !pendingEnd) {
      setError('Pick both start and end dates');
      return;
    }
    if (pendingEnd < pendingStart) {
      setError('End date must be on or after start date');
      return;
    }
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
  };

  const applyToday = () => {
    const today = isoToday();
    setPendingStart(today);
    setPendingEnd(today);
    setStartDate(today);
    setEndDate(today);
  };

  const applyLastNDays = (n: number) => {
    const end = isoToday();
    const start = isoDaysAgo(n - 1);
    setPendingStart(start);
    setPendingEnd(end);
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { md: 'center' }, flexWrap: 'wrap' }}
      >
        <TextField
          size="small"
          type="date"
          label="Start date"
          InputLabelProps={{ shrink: true }}
          value={pendingStart}
          onChange={(e) => setPendingStart(e.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="End date"
          InputLabelProps={{ shrink: true }}
          value={pendingEnd}
          onChange={(e) => setPendingEnd(e.target.value)}
        />
        <Button variant="contained" onClick={applyRange} disabled={loading}>
          Apply
        </Button>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={applyToday}>
            Today
          </Button>
          <Button size="small" variant="outlined" onClick={() => applyLastNDays(7)}>
            Last 7 days
          </Button>
          <Button size="small" variant="outlined" onClick={() => applyLastNDays(30)}>
            Last 30 days
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Range
              </Typography>
              <Typography variant="h6">
                {data ? `${data.startDate} to ${data.endDate}` : `${startDate} to ${endDate}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {loading ? '—' : (data?.totalOrders ?? 0).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {loading
                  ? '—'
                  : `₹${Number(data?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1">Chart</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={metric}
          onChange={(_, v) => v && setMetric(v)}
        >
          <ToggleButton value="revenue">Revenue</ToggleButton>
          <ToggleButton value="orders">Orders</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : chartData.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 6 }}
            >
              No data for this range.
            </Typography>
          ) : (
            <Box sx={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => {
                      const n = Number(value ?? 0);
                      return metric === 'revenue'
                        ? `₹${n.toLocaleString('en-IN')}`
                        : n.toLocaleString('en-IN');
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey={metric}
                    fill={metric === 'revenue' ? '#1976d2' : '#2e7d32'}
                    name={metric === 'revenue' ? 'Revenue (₹)' : 'Orders'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsTab;
