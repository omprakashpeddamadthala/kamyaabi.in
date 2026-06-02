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
  TextField,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  InputAdornment,
  Switch,
} from '@mui/material';
import { Edit, Delete, Add, Search as SearchIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchCategories } from '../../features/product/productSlice';
import { adminApi } from '../../api/adminApi';
import { PageResponse, Product } from '../../types';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
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

const AdminProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { categories } = useAppSelector((state) => state.products);

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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({
        page,
        size: limit,
        q: search || undefined,
        categoryId: categoryFilter === '' ? undefined : categoryFilter,
        active: activeFilter === '' ? undefined : activeFilter === 'active',
      });
      const data: PageResponse<Product> = res.data.data;
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load products').message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categoryFilter, activeFilter, showError]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleToggleStatus = async (product: Product, nextActive: boolean) => {
    if (togglingId === product.id) return;
    setTogglingId(product.id);
    setProducts((rows) => rows.map((r) => (r.id === product.id ? { ...r, active: nextActive } : r)));
    try {
      await adminApi.setProductStatus(product.id, nextActive);
      showSuccess(nextActive ? 'Product activated' : 'Product deactivated');
    } catch (err) {
      setProducts((rows) => rows.map((r) => (r.id === product.id ? { ...r, active: !nextActive } : r)));
      showError(parseApiError(err, 'Failed to update product status').message);
      loadProducts();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      showSuccess('Product deleted');
      loadProducts();
    } catch (err) {
      showError(parseApiError(err, 'Failed to delete product').message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Products</Typography>

      <InlineConfirmBar
        open={!!deleteTarget}
        title="Delete product?"
        message={deleteTarget ? `Are you sure? This will permanently delete "${deleteTarget.name}" and all its images from Cloudinary, along with any reviews, cart entries, and order line-items referencing it. This action cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: { md: 'center' } }}>
        <TextField
          size="small"
          placeholder="Search by name or description"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateUrlParams({ page: 1 });
              setSearch(searchInput.trim());
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              updateUrlParams({ page: 1 });
              setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value));
            }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={activeFilter}
            onChange={(e) => {
              updateUrlParams({ page: 1 });
              setActiveFilter(e.target.value as '' | 'active' | 'inactive');
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/products/new')}>
          Add Product
        </Button>
      </Stack>

      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Price (MRP)</TableCell>
              <TableCell>Discount Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ width: 160 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={10} />
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No products match the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const thumb = p.mainImageUrl || p.images?.[0]?.imageUrl || p.imageUrl;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {thumb ? (
                        <Box
                          component="img"
                          src={withCloudinaryTransform(thumb, 'w_64,h_64,c_fill,q_auto,f_auto')}
                          alt={p.name}
                          sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                        />
                      ) : (
                        <Box sx={{ width: 48, height: 48, bgcolor: 'grey.100', borderRadius: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.categoryName}</TableCell>
                    <TableCell>{p.weight || '—'}</TableCell>
                    <TableCell>{p.unit || '—'}</TableCell>
                    <TableCell>₹{p.price}</TableCell>
                    <TableCell>{p.discountPrice ? `₹${p.discountPrice}` : '—'}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          size="small"
                          checked={!!p.active}
                          disabled={togglingId === p.id}
                          onChange={(e) => handleToggleStatus(p, e.target.checked)}
                          inputProps={{ 'aria-label': `Toggle status for ${p.name}` }}
                        />
                        <Chip label={p.active ? 'Active' : 'Inactive'} color={p.active ? 'success' : 'default'} size="small" />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => navigate(`/admin/products/edit/${p.id}`)} aria-label={`Edit ${p.name}`}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`} disabled={!p.active}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(totalPages > 1 || totalElements > 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalElements} product{totalElements === 1 ? '' : 's'}
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

export default AdminProductsPage;
