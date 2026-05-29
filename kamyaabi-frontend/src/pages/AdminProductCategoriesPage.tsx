import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminApi } from '../api/adminApi';
import { Category } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import InlineConfirmBar from '../components/admin/InlineConfirmBar';
import TableSkeleton from '../components/common/TableSkeleton';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { fetchCategories } from '../features/product/productSlice';

const AdminProductCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategoriesPaged(0, 100);
      setRows(res.data.data.content);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load categories').message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    dispatch(fetchCategories());
    loadRows();
  }, [dispatch, loadRows]);

  const requestDelete = (cat: Category) => {
    if (cat.productCount > 0) {
      showError(`Cannot delete "${cat.name}" — ${cat.productCount} product(s) assigned.`);
      return;
    }
    setDeleteTarget(cat);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setConfirmLoading(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showSuccess('Category deleted');
      dispatch(fetchCategories());
      loadRows();
    } catch (err) {
      showError(parseApiError(err, 'Failed to delete category').message);
    } finally {
      setConfirmLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Product Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/categories/new')}>Add Category</Button>
      </Stack>

      <InlineConfirmBar
        open={!!deleteTarget}
        title="Delete category?"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Products</TableCell>
              <TableCell sx={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No categories yet</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell>{cat.parentName || '—'}</TableCell>
                  <TableCell>{cat.productCount}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" aria-label={`Edit ${cat.name}`} onClick={() => navigate(`/admin/categories/edit/${cat.id}`)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" aria-label={`Delete ${cat.name}`} onClick={() => requestDelete(cat)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminProductCategoriesPage;
