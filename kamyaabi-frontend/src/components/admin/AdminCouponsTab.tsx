import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Edit, Delete, Search as SearchIcon } from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { Coupon, PageResponse } from '../../types';
import { useToast } from '../common/useToast';
import { parseApiError } from '../../utils/apiError';
import InlineConfirmBar from './InlineConfirmBar';
import TableSkeleton from '../common/TableSkeleton';

interface AdminCouponsTabProps {
  active: boolean;
}

const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({ active }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<PageResponse<Coupon> | null>(null);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
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
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Coupons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/coupons/new')}>
          Create Coupon
        </Button>
      </Box>

      <InlineConfirmBar
        open={confirmState.open}
        title="Deactivate coupon?"
        message={`"${confirmState.couponCode}" will no longer be usable by customers.`}
        confirmLabel="Deactivate"
        loading={confirmState.loading}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmState({ open: false, couponId: null, couponCode: '', loading: false })}
      />

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search coupons"
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
          <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
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
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
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
                      <IconButton
                        size="small"
                        aria-label={`Edit coupon ${coupon.code}`}
                        onClick={() => navigate(`/admin/coupons/edit/${coupon.id}`, { state: { coupon } })}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      {coupon.isActive && (
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Deactivate coupon ${coupon.code}`}
                          onClick={() =>
                            setConfirmState({ open: true, couponId: coupon.id, couponCode: coupon.code, loading: false })
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
              <Pagination count={coupons.totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AdminCouponsTab;
