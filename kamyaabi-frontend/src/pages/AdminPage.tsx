import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Tabs,
  Tab,
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
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Paper,
  Stack,
  InputAdornment,
  Switch,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Inventory,
  ShoppingCart as CartIcon,
  CurrencyRupee,
  Warning,
  Search as SearchIcon,
  Article,
  Label,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCategories } from '../features/product/productSlice';
import {
  adminApi,
  AdminProductFilters,
} from '../api/adminApi';
import {
  Category,
  DashboardStats,
  Order,
  PageResponse,
  Product,
} from '../types';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import UsersTab from '../components/admin/UsersTab';
import SettingsTab from '../components/admin/SettingsTab';
import AdminReviewsPanel from '../components/admin/AdminReviewsPanel';
import AdminCouponsTab from '../components/admin/AdminCouponsTab';
import HeroBannersTab from '../components/admin/HeroBannersTab';
import { withCloudinaryTransform } from '../utils/cloudinary';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import InlineConfirmBar from '../components/admin/InlineConfirmBar';
import TableSkeleton from '../components/common/TableSkeleton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onConfirm: (() => Promise<void>) | (() => void);
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const ORDER_STATUSES = [
  'PAID',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'PENDING',
] as const;

const TAB_IDS = ['products', 'categories', 'orders', 'coupons', 'reviews', 'users', 'analytics', 'settings', 'hero-banners'] as const;
type TabId = (typeof TAB_IDS)[number];

const tabIndexOf = (id: string | null | undefined): number => {
  const idx = TAB_IDS.indexOf((id ?? 'products') as TabId);
  return idx >= 0 ? idx : 0;
};

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

const AdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { categories } = useAppSelector((state) => state.products);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = (searchParams.get('tab') as TabId | null) ?? 'products';
  const tabValue = tabIndexOf(tabId);
  const pageParam = clampPage(searchParams.get('page'));
  const limitParam = clampLimit(searchParams.get('limit'));

  const productPage = tabId === 'products' ? pageParam - 1 : 0;
  const ordersPage = tabId === 'orders' ? pageParam - 1 : 0;
  const categoryPage = tabId === 'categories' ? pageParam - 1 : 0;
  const currentLimit = limitParam;

  const updateUrlParams = useCallback(
    (patch: Partial<{ tab: TabId; page: number; limit: number }>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.tab !== undefined) next.set('tab', patch.tab);
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

  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminProductsLoading, setAdminProductsLoading] = useState(true);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productTotalElements, setProductTotalElements] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<number | ''>('');
  const [productActiveFilter, setProductActiveFilter] = useState<'' | 'active' | 'inactive'>('');
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);

  const [categoryRows, setCategoryRows] = useState<Category[]>([]);
  const [categoryRowsLoading, setCategoryRowsLoading] = useState(true);
  const [categoryTotalPages, setCategoryTotalPages] = useState(0);
  const [categoryTotalElements, setCategoryTotalElements] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersTotalElements, setOrdersTotalElements] = useState(0);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    loading: false,
    onConfirm: () => undefined,
  });

  const loadAdminProducts = useCallback(
    async (filters: AdminProductFilters = {}) => {
      setAdminProductsLoading(true);
      try {
        const res = await adminApi.getProducts({
          page: productPage,
          size: currentLimit,
          q: productSearch || undefined,
          categoryId: productCategoryFilter === '' ? undefined : productCategoryFilter,
          active:
            productActiveFilter === ''
              ? undefined
              : productActiveFilter === 'active',
          ...filters,
        });
        const data: PageResponse<Product> = res.data.data;
        setAdminProducts(data.content);
        setProductTotalPages(data.totalPages);
        setProductTotalElements(data.totalElements);
      } catch (err) {
        const parsed = parseApiError(err, 'Failed to load products');
        showError(parsed.message);
      } finally {
        setAdminProductsLoading(false);
      }
    },
    [
      productActiveFilter,
      productCategoryFilter,
      productPage,
      productSearch,
      currentLimit,
      showError,
    ],
  );

  const loadOrders = useCallback(
    async (page: number, size: number, status?: string) => {
      setOrdersLoading(true);
      try {
        const res = await adminApi.getAllOrders(page, size, status || undefined);
        const data = res.data.data;
        setOrders(data.content);
        setOrdersTotalPages(data.totalPages);
        setOrdersTotalElements(data.totalElements);
      } catch (err) {
        const parsed = parseApiError(err, 'Failed to load orders');
        showError(parsed.message);
      } finally {
        setOrdersLoading(false);
      }
    },
    [showError],
  );

  const loadCategoryRows = useCallback(
    async (page: number, size: number) => {
      setCategoryRowsLoading(true);
      try {
        const res = await adminApi.getCategoriesPaged(page, size);
        const data = res.data.data;
        setCategoryRows(data.content);
        setCategoryTotalPages(data.totalPages);
        setCategoryTotalElements(data.totalElements);
      } catch (err) {
        const parsed = parseApiError(err, 'Failed to load categories');
        showError(parsed.message);
      } finally {
        setCategoryRowsLoading(false);
      }
    },
    [showError],
  );

  const loadDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getDashboardStats();
      setDashboardStats(res.data.data);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to load dashboard stats');
      showError(parsed.message);
    } finally {
      setStatsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    dispatch(fetchCategories());
    loadDashboardStats();
  }, [dispatch, loadDashboardStats]);

  useEffect(() => {
    if (tabId === 'products') loadAdminProducts();
  }, [loadAdminProducts, tabId]);

  useEffect(() => {
    if (tabId === 'orders') loadOrders(ordersPage, currentLimit, orderStatusFilter);
  }, [tabId, ordersPage, currentLimit, orderStatusFilter, loadOrders]);

  useEffect(() => {
    if (tabId === 'categories') loadCategoryRows(categoryPage, currentLimit);
  }, [tabId, categoryPage, currentLimit, loadCategoryRows]);



  const requestDeleteProduct = (id: number, name: string) => {
    setConfirmState({
      open: true,
      title: 'Delete product?',
      message: `Are you sure? This will permanently delete "${name}" and all its images from Cloudinary, along with any reviews, cart entries, and order line-items referencing it. This action cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          await adminApi.deleteProduct(id);
          showSuccess('Product deleted');
          loadAdminProducts();
          loadDashboardStats();
        } catch (err) {
          const parsed = parseApiError(err, 'Failed to delete product');
          showError(parsed.message);
        } finally {
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };



  const requestDeleteCategory = (id: number, name: string, productCount: number) => {
    if (productCount > 0) {
      showError(
        `Cannot delete "${name}" — ${productCount} product(s) are assigned. Reassign or remove them first.`,
      );
      return;
    }
    setConfirmState({
      open: true,
      title: 'Delete category?',
      message: `This permanently deletes "${name}". This cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          await adminApi.deleteCategory(id);
          showSuccess('Category deleted');
          dispatch(fetchCategories());
          loadCategoryRows(categoryPage, currentLimit);
          loadAdminProducts();
          loadDashboardStats();
        } catch (err) {
          const parsed = parseApiError(err, 'Failed to delete category');
          showError(parsed.message);
        } finally {
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };


  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    if (!status) return;
    setUpdatingOrderId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, status);
      showSuccess('Order status updated');
      loadOrders(ordersPage, currentLimit, orderStatusFilter);
      loadDashboardStats();
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to update order status');
      showError(parsed.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };




  const handleToggleProductStatus = async (product: Product, nextActive: boolean) => {
    if (togglingProductId === product.id) return;
    setTogglingProductId(product.id);
    setAdminProducts((rows) =>
      rows.map((r) => (r.id === product.id ? { ...r, active: nextActive } : r)),
    );
    try {
      await adminApi.setProductStatus(product.id, nextActive);
      showSuccess(nextActive ? 'Product activated' : 'Product deactivated');
      loadDashboardStats();
    } catch (err) {
      setAdminProducts((rows) =>
        rows.map((r) => (r.id === product.id ? { ...r, active: !nextActive } : r)),
      );
      const parsed = parseApiError(err, 'Failed to update product status');
      showError(parsed.message);
      loadAdminProducts();
    } finally {
      setTogglingProductId(null);
    }
  };



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <InlineConfirmBar
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        loading={confirmState.loading}
        confirmLabel="Confirm"
        onConfirm={() => confirmState.onConfirm()}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false, loading: false }))}
      />

      {}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <Inventory sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {statsLoading ? '—' : (dashboardStats?.totalProducts ?? 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Products
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <CartIcon sx={{ fontSize: 36, color: 'info.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {statsLoading ? '—' : (dashboardStats?.totalOrders ?? 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Orders
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <CurrencyRupee sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {statsLoading
                ? '—'
                : `₹${(dashboardStats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <Warning sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {statsLoading ? '—' : (dashboardStats?.lowStockCount ?? 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Low Stock Alerts
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Blog & Product Tags Management */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Content Management
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<Article />}
            onClick={() => navigate('/admin/blog')}
          >
            Blog Posts
          </Button>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => navigate('/admin/blog/categories')}
          >
            Blog Categories
          </Button>
          <Button
            variant="outlined"
            startIcon={<Label />}
            onClick={() => navigate('/admin/blog/tags')}
          >
            Blog Tags
          </Button>
          <Button
            variant="outlined"
            startIcon={<Label />}
            onClick={() => navigate('/admin/products/tags')}
          >
            Product Tags
          </Button>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => navigate('/admin/products/categories')}
          >
            Product Categories
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => updateUrlParams({ tab: TAB_IDS[v], page: 1 })}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Products" />
          <Tab label="Categories" />
          <Tab label="Orders" />
          <Tab label="Coupons" />
          <Tab label="Reviews" />
          <Tab label="Users" />
          <Tab label="Analytics" />
          <Tab label="Settings" />
          <Tab label="Hero Banners" />
        </Tabs>
      </Box>

      {}
      <TabPanel value={tabValue} index={0}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2, alignItems: { md: 'center' } }}
        >
          <TextField
            size="small"
            placeholder="Search by name or description"
            value={productSearchInput}
            onChange={(e) => setProductSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateUrlParams({ page: 1 });
                setProductSearch(productSearchInput.trim());
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
              value={productCategoryFilter}
              onChange={(e) => {
                updateUrlParams({ page: 1 });
                setProductCategoryFilter(e.target.value === '' ? '' : Number(e.target.value));
              }}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={productActiveFilter}
              onChange={(e) => {
                updateUrlParams({ page: 1 });
                setProductActiveFilter(e.target.value as '' | 'active' | 'inactive');
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/admin/products/new')}
          >
            Add Product
          </Button>
        </Stack>

        <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 80 }}>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price (MRP)</TableCell>
                <TableCell>Discount Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ width: 160 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adminProductsLoading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : adminProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No products match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                adminProducts.map((p) => {
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
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'grey.100',
                              borderRadius: 1,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.categoryName}</TableCell>
                      <TableCell>₹{p.price}</TableCell>
                      <TableCell>{p.discountPrice ? `₹${p.discountPrice}` : '—'}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Switch
                            size="small"
                            checked={!!p.active}
                            disabled={togglingProductId === p.id}
                            onChange={(e) => handleToggleProductStatus(p, e.target.checked)}
                            inputProps={{
                              'aria-label': `Toggle status for ${p.name}`,
                            }}
                          />
                          <Chip
                            label={p.active ? 'Active' : 'Inactive'}
                            color={p.active ? 'success' : 'default'}
                            size="small"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => requestDeleteProduct(p.id, p.name)}
                          aria-label={`Delete ${p.name}`}
                          disabled={!p.active}
                        >
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
        {(productTotalPages > 1 || productTotalElements > 0) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {productTotalElements} product{productTotalElements === 1 ? '' : 's'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per page</InputLabel>
                <Select
                  label="Per page"
                  value={currentLimit}
                  onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {productTotalPages > 1 && (
                <Pagination
                  count={productTotalPages}
                  page={productPage + 1}
                  onChange={(_, p) => updateUrlParams({ page: p })}
                />
              )}
            </Box>
          </Box>
        )}
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              navigate('/admin/categories/new');
            }}
          >
            Add Category
          </Button>
        </Box>
        <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
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
              {categoryRowsLoading ? (
                <TableSkeleton rows={5} columns={5} />
              ) : categoryRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No categories yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categoryRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {c.slug || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{c.parentName || '—'}</TableCell>
                    <TableCell>{c.productCount}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/categories/edit/${c.id}`)}
                        aria-label={`Edit ${c.name}`}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => requestDeleteCategory(c.id, c.name, c.productCount)}
                        aria-label={`Delete ${c.name}`}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {(categoryTotalPages > 1 || categoryTotalElements > 0) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {categoryTotalElements} categor{categoryTotalElements === 1 ? 'y' : 'ies'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per page</InputLabel>
                <Select
                  label="Per page"
                  value={currentLimit}
                  onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {categoryTotalPages > 1 && (
                <Pagination
                  count={categoryTotalPages}
                  page={categoryPage + 1}
                  onChange={(_, p) => updateUrlParams({ page: p })}
                />
              )}
            </Box>
          </Box>
        )}
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }} disabled={ordersLoading}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              label="Filter by Status"
              value={orderStatusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setOrderStatusFilter(val);
                updateUrlParams({ page: 1 });
              }}
            >
              <MenuItem value="">All Orders</MenuItem>
              {ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Shipping Address</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Shipping</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersLoading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {orderStatusFilter
                        ? `No orders for status: ${orderStatusFilter.replace('_', ' ')}`
                        : 'No orders yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>#{o.id}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      {o.items.length === 0 ? (
                        '—'
                      ) : (
                        <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
                          {o.items.map((item) => (
                            <Box
                              component="li"
                              key={item.id}
                              sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}
                            >
                              {item.productName} × {item.quantity}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', minWidth: 140 }}>
                      {o.shippingAddress ? (
                        <Box>
                          <Box sx={{ fontWeight: 600 }}>{o.shippingAddress.fullName}</Box>
                          <Box>{o.shippingAddress.street}</Box>
                          <Box>
                            {o.shippingAddress.city}, {o.shippingAddress.state}
                          </Box>
                          <Box>{o.shippingAddress.pincode}</Box>
                          {o.shippingAddress.phone && <Box>📞 {o.shippingAddress.phone}</Box>}
                        </Box>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>₹{o.totalAmount}</TableCell>
                    <TableCell>
                      <Chip label={o.status} size="small" />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', minWidth: 120 }}>
                      {o.awbNumber ? (
                        <Box>
                          {o.courierName && <Box sx={{ fontWeight: 600 }}>{o.courierName}</Box>}
                          <Box>AWB: {o.awbNumber}</Box>
                          {o.shippingStatus && (
                            <Chip
                              label={o.shippingStatus.replace(/_/g, ' ')}
                              size="small"
                              color="info"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : o.shiprocketSynced === false && (o.status === 'PAID' || o.status === 'CONFIRMED') ? (
                        <Chip label="Sync Pending" size="small" color="warning" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControl
                        size="small"
                        sx={{ minWidth: 130 }}
                        disabled={updatingOrderId === o.id}
                      >
                        <InputLabel>Update</InputLabel>
                        <Select
                          label="Update"
                          value=""
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        >
                          {['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(
                            (s) => (
                              <MenuItem key={s} value={s}>
                                {s}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {(ordersTotalPages > 1 || ordersTotalElements > 0) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {ordersTotalElements} order{ordersTotalElements === 1 ? '' : 's'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per page</InputLabel>
                <Select
                  label="Per page"
                  value={currentLimit}
                  onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {ordersTotalPages > 1 && (
                <Pagination
                  count={ordersTotalPages}
                  page={ordersPage + 1}
                  onChange={(_, p) => updateUrlParams({ page: p })}
                />
              )}
            </Box>
          </Box>
        )}
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={3}>
        <AdminCouponsTab active={tabId === 'coupons'} />
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={4}>
        <AdminReviewsPanel active={tabId === 'reviews'} />
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={5}>
        <UsersTab active={tabId === 'users'} currentUserId={currentUser?.id} />
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={6}>
        <AnalyticsTab active={tabId === 'analytics'} />
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={7}>
        <SettingsTab active={tabId === 'settings'} />
      </TabPanel>

      {}
      <TabPanel value={tabValue} index={8}>
        <HeroBannersTab active={tabId === 'hero-banners'} />
      </TabPanel>

    </Container>
  );
};

export default AdminPage;
