import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import {
  Inventory,
  ShoppingCart as CartIcon,
  CurrencyRupee,
  Warning,
} from '@mui/icons-material';
import { adminApi } from '../api/adminApi';
import { DashboardStats } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import { ADMIN_NAV } from '../components/admin/layout/adminNav';

const AdminPage: React.FC = () => {
  const { showError } = useToast();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getDashboardStats();
      setDashboardStats(res.data.data);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load dashboard stats').message);
    } finally {
      setStatsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const statCards = [
    { icon: <Inventory sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />, value: statsLoading ? '—' : (dashboardStats?.totalProducts ?? 0).toLocaleString('en-IN'), label: 'Total Products' },
    { icon: <CartIcon sx={{ fontSize: 36, color: 'info.main', mb: 1 }} />, value: statsLoading ? '—' : (dashboardStats?.totalOrders ?? 0).toLocaleString('en-IN'), label: 'Total Orders' },
    { icon: <CurrencyRupee sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />, value: statsLoading ? '—' : `₹${(dashboardStats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, label: 'Total Revenue' },
    { icon: <Warning sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />, value: statsLoading ? '—' : (dashboardStats?.lowStockCount ?? 0).toLocaleString('en-IN'), label: 'Low Stock Alerts' },
  ];

  // Launcher tiles: every admin section except the dashboard itself.
  const sections = ADMIN_NAV
    .map((section) => ({
      heading: section.heading,
      items: section.items.filter((item) => item.to !== '/admin'),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
              {card.icon}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={3}>
        {sections.map((section) => (
          <Box key={section.heading}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              {section.heading}
            </Typography>
            <Grid container spacing={2}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid item xs={6} sm={4} md={3} key={item.to}>
                    <Paper
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        textDecoration: 'none',
                        color: 'text.primary',
                        minHeight: 64,
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                      }}
                    >
                      <Icon sx={{ color: 'primary.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </Stack>
    </Container>
  );
};

export default AdminPage;
