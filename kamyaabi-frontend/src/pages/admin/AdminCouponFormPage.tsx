import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Skeleton,
} from '@mui/material';
import { adminApi, CouponFormRequest } from '../../api/adminApi';
import { Coupon } from '../../types';
import { useToast } from '../../components/common/ToastProvider';
import { parseApiError } from '../../utils/apiError';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';

const initialForm: CouponFormRequest = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  isActive: true,
  expiresAt: null,
};

const LIST_PATH = '/admin/coupons';

const AdminCouponFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const prefill = (location.state as { coupon?: Coupon } | null)?.coupon ?? null;

  const [loading, setLoading] = useState<boolean>(Boolean(editingId) && !prefill);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CouponFormRequest>(
    prefill
      ? {
          code: prefill.code,
          discountType: prefill.discountType,
          discountValue: prefill.discountValue,
          isActive: prefill.isActive,
          expiresAt: prefill.expiresAt,
        }
      : initialForm,
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editingId || prefill) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    // No single-coupon endpoint exists; locate the coupon within the admin list.
    adminApi
      .getCoupons(0, 200)
      .then((res) => {
        if (!active) return;
        const found = res.data.data.content.find((c) => c.id === editingId);
        if (found) {
          setForm({
            code: found.code,
            discountType: found.discountType,
            discountValue: found.discountValue,
            isActive: found.isActive,
            expiresAt: found.expiresAt,
          });
        } else {
          setLoadError('Coupon not found. It may have been removed.');
        }
      })
      .catch((err) => {
        if (active) setLoadError(parseApiError(err, 'Failed to load coupon').message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editingId, prefill]);

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = 'Code is required';
    if (form.discountValue <= 0) errors.discountValue = 'Must be > 0';
    if (form.discountType === 'PERCENTAGE' && form.discountValue > 100) errors.discountValue = 'Cannot exceed 100%';
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateCoupon(editingId, form);
        toast.showSuccess('Coupon updated');
      } else {
        await adminApi.createCoupon(form);
        toast.showSuccess('Coupon created');
      }
      navigate(LIST_PATH);
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to save coupon').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={320} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <AdminFormShell
      title={editingId ? 'Edit Coupon' : 'Create Coupon'}
      subtitle="Discount codes customers can apply at checkout."
      onSubmit={handleSave}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingId ? 'Update coupon' : 'Create coupon'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load coupon"
          message={loadError}
          confirmLabel="Retry"
          cancelLabel="Back to list"
          onConfirm={() => navigate(0)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Coupon Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          error={!!formErrors.code}
          helperText={formErrors.code ?? 'Customers enter this code at checkout.'}
          required
          inputProps={{ style: { textTransform: 'uppercase' } }}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel>Discount Type</InputLabel>
          <Select
            value={form.discountType}
            label="Discount Type"
            onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FLAT' })}
          >
            <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
            <MenuItem value="FLAT">Flat Amount (₹)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={form.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}
          type="number"
          value={form.discountValue}
          onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
          error={!!formErrors.discountValue}
          helperText={formErrors.discountValue}
          inputProps={{ min: 0.01, step: 0.01 }}
          fullWidth
        />
        <TextField
          label="Expires At"
          type="datetime-local"
          value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value || null })}
          InputLabelProps={{ shrink: true }}
          helperText="Optional. Leave blank for no expiry."
          fullWidth
        />
        <FormControlLabel
          control={<Switch checked={form.isActive ?? true} onChange={(_, v) => setForm({ ...form, isActive: v })} />}
          label={form.isActive ? 'Active' : 'Inactive'}
        />
      </Box>
    </AdminFormShell>
  );
};

export default AdminCouponFormPage;
