import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, Search as SearchIcon } from '@mui/icons-material';
import { adminApi, CouponFormRequest } from '../../api/adminApi';
import { Coupon, PageResponse } from '../../types';
import { useToast } from '../common/ToastProvider';
import { parseApiError } from '../../utils/apiError';
import ConfirmDialog from '../common/ConfirmDialog';
import TableSkeleton from '../common/TableSkeleton';

interface AdminCouponsTabProps {
  active: boolean;
}

const initialForm: CouponFormRequest = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  isActive: true,
  expiresAt: null,
};

const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({ active }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<PageResponse<Coupon> | null>(null);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormRequest>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    couponId: number | null;
    couponCode: string;
    loading: boolean;
  }>({ open: false, couponId: null, couponCode: '', loading: false });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons(page, 10, searchQuery || undefined);
      setCoupons(res.data.data);
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to load coupons').message);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, toast]);

  useEffect(() => {
    if (active) loadCoupons();
  }, [active, loadCoupons]);

  const openCreateDialog = () => {
    setEditingCoupon(null);
    setForm(initialForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = 'Code is required';
    if (form.discountValue <= 0) errors.discountValue = 'Must be > 0';
    if (form.discountType === 'PERCENTAGE' && form.discountValue > 100) {
      errors.discountValue = 'Cannot exceed 100%';
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon.id, form);
        toast.showSuccess('Coupon updated');
      } else {
        await adminApi.createCoupon(form);
        toast.showSuccess('Coupon created');
      }
      setDialogOpen(false);
      loadCoupons();
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to save coupon').message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmState.couponId) return;
    setConfirmState((s) => ({ ...s, loading: true }));
    try {
      await adminApi.deactivateCoupon(confirmState.couponId);
      toast.showSuccess('Coupon deactivated');
      loadCoupons();
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to deactivate coupon').message);
    } finally {
      setConfirmState({ open: false, couponId: null, couponCode: '', loading: false });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Coupons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Create Coupon
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by code..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : (
        <>
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons?.content.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No coupons found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {coupons?.content.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Typography fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {coupon.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{coupon.discountType}</TableCell>
                    <TableCell>
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.isActive ? 'Active' : 'Inactive'}
                        color={coupon.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {coupon.uniqueMembers} members / {coupon.usageCount} uses
                    </TableCell>
                    <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(coupon)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      {coupon.isActive && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setConfirmState({
                              open: true,
                              couponId: coupon.id,
                              couponCode: coupon.code,
                              loading: false,
                            })
                          }
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {coupons && coupons.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={coupons.totalPages}
                page={page + 1}
                onChange={(_, p) => setPage(p - 1)}
              />
            </Box>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Coupon Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              error={!!formErrors.code}
              helperText={formErrors.code}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <FormControl>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={form.discountType}
                label="Discount Type"
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FLAT' })
                }
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
            />
            <TextField
              label="Expires At"
              type="datetime-local"
              value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value || null })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive ?? true}
                  onChange={(_, v) => setForm({ ...form, isActive: v })}
                />
              }
              label={form.isActive ? 'Active' : 'Inactive'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Deactivate Coupon"
        message={`Are you sure you want to deactivate coupon "${confirmState.couponCode}"? It will no longer be usable by customers.`}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmState({ open: false, couponId: null, couponCode: '', loading: false })}
        destructive
        loading={confirmState.loading}
      />
    </Box>
  );
};

export default AdminCouponsTab;
