import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchCategories } from '../../features/product/productSlice';
import { adminApi } from '../../api/adminApi';
import { Category } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/useToast';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';
import TableSkeleton from '../../components/common/TableSkeleton';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const clampLimit = (raw: string | null): number => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE;
};

const clampPage = (raw: string | null): number => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
};

const AdminCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = clampPage(searchParams.get('page')) - 1;
  const limit = clampLimit(searchParams.get('limit'));

  const updateUrlParams = useCallback(
    (patch: Partial<{ page: number; limit: number }>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.page !== undefined) {
            if (patch.page <= 1) next.delete('page');
            else next.set('page', String(patch.page));
          }
          if (patch.limit !== undefined) {
            if (patch.limit === DEFAULT_PAGE_SIZE) next.delete('limit');
            else next.set('limit', String(patch.limit));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategoriesPaged(page, limit);
      const data = res.data.data;
      setRows(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load categories').message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, showError]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const requestDelete = (cat: Category) => {
    if (cat.productCount > 0) {
      showError(`Cannot delete "${cat.name}" — ${cat.productCount} product(s) are assigned. Reassign or remove them first.`);
      return;
    }
    setDeleteTarget(cat);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showSuccess('Category deleted');
      dispatch(fetchCategories());
      loadRows();
    } catch (err) {
      showError(parseApiError(err, 'Failed to delete category').message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/categories/new')}>Add Category</Button>
      </Stack>

      <InlineConfirmBar
        open={!!deleteTarget}
        title="Delete category?"
        message={deleteTarget ? `This permanently deletes "${deleteTarget.name}". This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
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
              <TableCell sx={{ width: 140 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No categories yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{c.slug || '—'}</Typography>
                  </TableCell>
                  <TableCell>{c.parentName || '—'}</TableCell>
                  <TableCell>{c.productCount}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => navigate(`/admin/categories/edit/${c.id}`)} aria-label={`Edit ${c.name}`}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => requestDelete(c)} aria-label={`Delete ${c.name}`}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(totalPages > 1 || totalElements > 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalElements} categor{totalElements === 1 ? 'y' : 'ies'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Per page</InputLabel>
              <Select label="Per page" value={limit} onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {totalPages > 1 && (
              <Pagination count={totalPages} page={page + 1} onChange={(_, p) => updateUrlParams({ page: p })} />
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AdminCategoriesPage;
