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
import { useToast } from '../common/useToast';
import { parseApiError } from '../../utils/apiError';

interface SettingsTabProps {
  active: boolean;
}

const LOW_STOCK_THRESHOLD = 'low_stock_threshold';
const PRODUCTS_PER_PAGE = 'products_per_page';
const SHOW_BOUGHT_RECENTLY_BADGE = 'show_bought_recently_badge';
const WHATSAPP_OTP_AUTH_ENABLED = 'whatsapp_otp_auth_enabled';
const CHATMITRA_API_TOKEN = 'chatmitra_api_token';
const COUPON_ENABLED = 'coupon_enabled';
const COUPON_MAX_USES_PER_USER = 'coupon_max_uses_per_user';
const COUPON_MAX_USES_PER_USER_PER_DAY = 'coupon_max_uses_per_user_per_day';
const COUPON_MAX_TOTAL_MEMBERS = 'coupon_max_total_members';
const COUPON_DEFAULT_EXPIRY_DAYS = 'coupon_default_expiry_days';
const COUPON_ALLOW_STACKING = 'coupon_allow_stacking';
const AMAZON_STORE_URL = 'amazon_store_url';

const SettingsTab: React.FC<SettingsTabProps> = ({ active }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lowStock, setLowStock] = useState('10');
  const [productsPerPage, setProductsPerPage] = useState('8');
  const [showBoughtRecently, setShowBoughtRecently] = useState(true);
  const [whatsappOtpAuthEnabled, setWhatsappOtpAuthEnabled] = useState(false);
  const [chatmitraApiToken, setChatmitraApiToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coupon settings
  const [couponEnabled, setCouponEnabled] = useState(true);
  const [couponMaxUsesPerUser, setCouponMaxUsesPerUser] = useState('1');
  const [couponMaxUsesPerUserPerDay, setCouponMaxUsesPerUserPerDay] = useState('1');
  const [couponMaxTotalMembers, setCouponMaxTotalMembers] = useState('20');
  const [couponDefaultExpiryDays, setCouponDefaultExpiryDays] = useState('30');
  const [couponAllowStacking, setCouponAllowStacking] = useState(false);
  const [amazonStoreUrl, setAmazonStoreUrl] = useState('');

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
        if (data[WHATSAPP_OTP_AUTH_ENABLED] !== undefined) {
          setWhatsappOtpAuthEnabled(
            String(data[WHATSAPP_OTP_AUTH_ENABLED]).toLowerCase() === 'true',
          );
        }
        if (data[CHATMITRA_API_TOKEN] !== undefined) {
          setChatmitraApiToken(data[CHATMITRA_API_TOKEN]);
        }
        if (data[COUPON_ENABLED] !== undefined) {
          setCouponEnabled(String(data[COUPON_ENABLED]).toLowerCase() === 'true');
        }
        if (data[COUPON_MAX_USES_PER_USER]) setCouponMaxUsesPerUser(data[COUPON_MAX_USES_PER_USER]);
        if (data[COUPON_MAX_USES_PER_USER_PER_DAY]) setCouponMaxUsesPerUserPerDay(data[COUPON_MAX_USES_PER_USER_PER_DAY]);
        if (data[COUPON_MAX_TOTAL_MEMBERS]) setCouponMaxTotalMembers(data[COUPON_MAX_TOTAL_MEMBERS]);
        if (data[COUPON_DEFAULT_EXPIRY_DAYS]) setCouponDefaultExpiryDays(data[COUPON_DEFAULT_EXPIRY_DAYS]);
        if (data[COUPON_ALLOW_STACKING] !== undefined) {
          setCouponAllowStacking(String(data[COUPON_ALLOW_STACKING]).toLowerCase() === 'true');
        }
        if (data[AMAZON_STORE_URL] !== undefined) setAmazonStoreUrl(data[AMAZON_STORE_URL]);
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
      next[LOW_STOCK_THRESHOLD] = 'Must be a positive integer (\u2265 1)';
    }
    const pppN = Number(productsPerPage);
    if (!Number.isInteger(pppN) || pppN < 1) {
      next[PRODUCTS_PER_PAGE] = 'Must be a positive integer (\u2265 1)';
    }
    const cpuN = Number(couponMaxUsesPerUser);
    if (!Number.isInteger(cpuN) || cpuN < 1) {
      next[COUPON_MAX_USES_PER_USER] = 'Must be a positive integer (\u2265 1)';
    }
    const cpdN = Number(couponMaxUsesPerUserPerDay);
    if (!Number.isInteger(cpdN) || cpdN < 1) {
      next[COUPON_MAX_USES_PER_USER_PER_DAY] = 'Must be a positive integer (\u2265 1)';
    }
    const cmtN = Number(couponMaxTotalMembers);
    if (!Number.isInteger(cmtN) || cmtN < 1) {
      next[COUPON_MAX_TOTAL_MEMBERS] = 'Must be a positive integer (\u2265 1)';
    }
    const cedN = Number(couponDefaultExpiryDays);
    if (!Number.isInteger(cedN) || cedN < 1) {
      next[COUPON_DEFAULT_EXPIRY_DAYS] = 'Must be a positive integer (\u2265 1)';
    }
    const url = amazonStoreUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      next[AMAZON_STORE_URL] = 'Must be empty or start with http:// or https://';
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
        [WHATSAPP_OTP_AUTH_ENABLED]: whatsappOtpAuthEnabled ? 'true' : 'false',
        [CHATMITRA_API_TOKEN]: chatmitraApiToken.trim(),
        [COUPON_ENABLED]: couponEnabled ? 'true' : 'false',
        [COUPON_MAX_USES_PER_USER]: String(Number(couponMaxUsesPerUser)),
        [COUPON_MAX_USES_PER_USER_PER_DAY]: String(Number(couponMaxUsesPerUserPerDay)),
        [COUPON_MAX_TOTAL_MEMBERS]: String(Number(couponMaxTotalMembers)),
        [COUPON_DEFAULT_EXPIRY_DAYS]: String(Number(couponDefaultExpiryDays)),
        [COUPON_ALLOW_STACKING]: couponAllowStacking ? 'true' : 'false',
        [AMAZON_STORE_URL]: amazonStoreUrl.trim(),
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
              WhatsApp OTP Login/Signup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Show the WhatsApp login option on the public sign-in page and
              allow the backend OTP endpoints to accept requests.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappOtpAuthEnabled}
                  onChange={(_, checked) => setWhatsappOtpAuthEnabled(checked)}
                />
              }
              label={whatsappOtpAuthEnabled ? 'Enabled' : 'Disabled'}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ChatMitra API Token
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Required to send the OTP template through ChatMitra. Stored for backend use only.
              </Typography>
              <TextField
                type="password"
                size="small"
                value={chatmitraApiToken}
                onChange={(e) => setChatmitraApiToken(e.target.value)}
                helperText="Leave blank only if the backend should keep using the env fallback."
                sx={{ maxWidth: 420, width: '100%' }}
              />
            </Box>
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

          {/* ── Coupon Settings ─────────────────────────────── */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
              Coupon Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure coupon/promo code system behavior. Changes take effect immediately.
            </Typography>

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Enable Coupon System
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Master switch — disables all coupon input if off.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={couponEnabled}
                      onChange={(_, v) => setCouponEnabled(v)}
                    />
                  }
                  label={couponEnabled ? 'Enabled' : 'Disabled'}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Max Uses Per User (All Time)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  How many times one user can use any single coupon.
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={couponMaxUsesPerUser}
                  onChange={(e) => setCouponMaxUsesPerUser(e.target.value)}
                  error={!!errors[COUPON_MAX_USES_PER_USER]}
                  helperText={errors[COUPON_MAX_USES_PER_USER] ?? 'Default: 1'}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ maxWidth: 240 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Max Uses Per User Per Day
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Daily usage cap per user per coupon.
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={couponMaxUsesPerUserPerDay}
                  onChange={(e) => setCouponMaxUsesPerUserPerDay(e.target.value)}
                  error={!!errors[COUPON_MAX_USES_PER_USER_PER_DAY]}
                  helperText={errors[COUPON_MAX_USES_PER_USER_PER_DAY] ?? 'Default: 1'}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ maxWidth: 240 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Max Total Members Per Coupon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Hard cap on unique users who can redeem a coupon.
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={couponMaxTotalMembers}
                  onChange={(e) => setCouponMaxTotalMembers(e.target.value)}
                  error={!!errors[COUPON_MAX_TOTAL_MEMBERS]}
                  helperText={errors[COUPON_MAX_TOTAL_MEMBERS] ?? 'Default: 20'}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ maxWidth: 240 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Default Coupon Expiry (Days)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Pre-fills expiry when creating new coupons.
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={couponDefaultExpiryDays}
                  onChange={(e) => setCouponDefaultExpiryDays(e.target.value)}
                  error={!!errors[COUPON_DEFAULT_EXPIRY_DAYS]}
                  helperText={errors[COUPON_DEFAULT_EXPIRY_DAYS] ?? 'Default: 30'}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ maxWidth: 240 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Allow Stacking Multiple Coupons
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Whether users can apply more than one coupon per order.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={couponAllowStacking}
                      onChange={(_, v) => setCouponAllowStacking(v)}
                    />
                  }
                  label={couponAllowStacking ? 'Enabled' : 'Disabled'}
                />
              </Box>
            </Stack>
          </Box>

          {/* ── Amazon Storefront ─────────────────────── */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
              Amazon Storefront
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              URL used by the &quot;Also Available on Amazon&quot; banners on product pages and the
              &quot;Find Us on Amazon&quot; section on the homepage. Leave blank to hide these banners.
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="https://www.amazon.in/s?k=kamyaabi"
              value={amazonStoreUrl}
              onChange={(e) => setAmazonStoreUrl(e.target.value)}
              error={!!errors[AMAZON_STORE_URL]}
              helperText={errors[AMAZON_STORE_URL] ?? 'Full Amazon store or product/search URL'}
              sx={{ maxWidth: 560 }}
            />
          </Box>
        </Stack>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {saving ? 'Saving\u2026' : 'Save Settings'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
