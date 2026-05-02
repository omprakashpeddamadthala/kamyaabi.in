import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../common/ToastProvider';
import { parseApiError } from '../../utils/apiError';

interface SettingsTabProps {
  active: boolean;
}

const LOW_STOCK_THRESHOLD = 'low_stock_threshold';
const PRODUCTS_PER_PAGE = 'products_per_page';
const SHOW_BOUGHT_RECENTLY_BADGE = 'show_bought_recently_badge';

const SettingsTab: React.FC<SettingsTabProps> = ({ active }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lowStock, setLowStock] = useState('10');
  const [productsPerPage, setProductsPerPage] = useState('8');
  const [showBoughtRecently, setShowBoughtRecently] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    adminApi
      .getSettings()
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data ?? {};
        if (data[LOW_STOCK_THRESHOLD]) setLowStock(data[LOW_STOCK_THRESHOLD]);
        if (data[PRODUCTS_PER_PAGE]) setProductsPerPage(data[PRODUCTS_PER_PAGE]);
        if (data[SHOW_BOUGHT_RECENTLY_BADGE] !== undefined) {
          setShowBoughtRecently(
            String(data[SHOW_BOUGHT_RECENTLY_BADGE]).toLowerCase() === 'true',
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast.showError(parseApiError(err, 'Failed to load settings').message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [active, toast]);

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const lowN = Number(lowStock);
    if (!Number.isInteger(lowN) || lowN < 1) {
      next[LOW_STOCK_THRESHOLD] = 'Must be a positive integer (≥ 1)';
    }
    const pppN = Number(productsPerPage);
    if (!Number.isInteger(pppN) || pppN < 1) {
      next[PRODUCTS_PER_PAGE] = 'Must be a positive integer (≥ 1)';
    }
    return next;
  };

  const onSave = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.showToast('Please fix the highlighted fields before saving', 'warning');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSettings({
        [LOW_STOCK_THRESHOLD]: String(Number(lowStock)),
        [PRODUCTS_PER_PAGE]: String(Number(productsPerPage)),
        [SHOW_BOUGHT_RECENTLY_BADGE]: showBoughtRecently ? 'true' : 'false',
      });
      toast.showSuccess('Settings updated');
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to update settings').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Platform Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tune storefront behavior without redeploying. Changes apply immediately.
        </Typography>

        <Stack spacing={3} divider={<Divider flexItem />}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Low Stock Alert Threshold
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Products with stock below this number are flagged as low stock on the dashboard.
            </Typography>
            <TextField
              type="number"
              size="small"
              value={lowStock}
              onChange={(e) => setLowStock(e.target.value)}
              error={!!errors[LOW_STOCK_THRESHOLD]}
              helperText={errors[LOW_STOCK_THRESHOLD] ?? 'Default: 10'}
              inputProps={{ min: 1, step: 1 }}
              sx={{ maxWidth: 240 }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Products Per Page (Product Listing)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Default page size on the public product listing page.
            </Typography>
            <TextField
              type="number"
              size="small"
              value={productsPerPage}
              onChange={(e) => setProductsPerPage(e.target.value)}
              error={!!errors[PRODUCTS_PER_PAGE]}
              helperText={errors[PRODUCTS_PER_PAGE] ?? 'Default: 8'}
              inputProps={{ min: 1, step: 1 }}
              sx={{ maxWidth: 240 }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Show &apos;Bought Recently&apos; Badge on Product Page
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              When enabled, product detail pages show a &quot;X people bought this in the last 7 days&quot; badge.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showBoughtRecently}
                  onChange={(_, v) => setShowBoughtRecently(v)}
                />
              }
              label={showBoughtRecently ? 'Enabled' : 'Disabled'}
            />
          </Box>
        </Stack>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
