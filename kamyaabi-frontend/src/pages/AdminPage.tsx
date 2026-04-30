import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Pagination,
  Paper,
  LinearProgress,
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
  CloudUpload,
  Star,
  StarBorder,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCategories } from '../features/product/productSlice';
import {
  adminApi,
  AdminProductFilters,
  CategoryRequest,
  ProductRequest,
} from '../api/adminApi';
import {
  Category,
  DashboardStats,
  Order,
  PageResponse,
  Product,
  ProductImage,
} from '../types';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import UsersTab from '../components/admin/UsersTab';
import { withCloudinaryTransform } from '../utils/cloudinary';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import ConfirmDialog from '../components/common/ConfirmDialog';
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

// Slugify mirrors the backend rules in `CategoryServiceImpl.slugify`.
const slugify = (raw: string): string =>
  raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface ProductFormErrors {
  name?: string;
  description?: string;
  price?: string;
  discountPrice?: string;
  categoryId?: string;
  stock?: string;
  weight?: string;
  unit?: string;
  images?: string;
}

interface CategoryFormErrors {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onConfirm: (() => Promise<void>) | (() => void);
}

const initialProductForm: ProductRequest = {
  name: '',
  description: '',
  price: 0,
  discountPrice: 0,
  imageUrl: '',
  categoryId: 0,
  stock: 0,
  weight: '',
  unit: 'g',
  active: true,
};

const initialCategoryForm: CategoryRequest = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: null,
};

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

/**
 * Tab id <-> index mapping. Using stable string keys in the URL lets us
 * reorder or add tabs without breaking bookmarks.
 */
const TAB_IDS = ['products', 'categories', 'orders', 'users', 'analytics'] as const;
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
  const { showSuccess, showError } = useToast();
  const { categories } = useAppSelector((state) => state.products);
  const currentUser = useAppSelector((state) => state.auth.user);

  // URL-driven pagination state. `tab`, `page`, and `limit` all flow through
  // the query string so deep links / back-forward restore the exact view.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = (searchParams.get('tab') as TabId | null) ?? 'products';
  const tabValue = tabIndexOf(tabId);
  const pageParam = clampPage(searchParams.get('page'));
  const limitParam = clampLimit(searchParams.get('limit'));

  // Per-tab page index (0-based). The URL `page` is 1-based for humans; we
  // translate here so the backend + MUI Pagination stay consistent.
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

  // Admin product list state (independent of public Redux slice — the admin
  // page must surface soft-deleted products).
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminProductsLoading, setAdminProductsLoading] = useState(true);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productTotalElements, setProductTotalElements] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<number | ''>('');
  const [productActiveFilter, setProductActiveFilter] = useState<'' | 'active' | 'inactive'>('');
  // Per-row toggle spinner — prevents double-clicks and lets us disable the
  // switch while the PATCH is in flight.
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);

  // Categories tab — now paginated server-side.
  const [categoryRows, setCategoryRows] = useState<Category[]>([]);
  const [categoryRowsLoading, setCategoryRowsLoading] = useState(true);
  const [categoryTotalPages, setCategoryTotalPages] = useState(0);
  const [categoryTotalElements, setCategoryTotalElements] = useState(0);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersTotalElements, setOrdersTotalElements] = useState(0);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Dashboard summary cards — fetched from the backend so admins see true
  // totals, not just whatever happens to be on the current page.
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialog state
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Confirm dialog (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    loading: false,
    onConfirm: () => undefined,
  });

  // In-flight markers
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Image uploader state
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [pendingMainIndex, setPendingMainIndex] = useState<number>(0);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [selectedExistingMainId, setSelectedExistingMainId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form state
  const [productForm, setProductForm] = useState<ProductRequest>(initialProductForm);
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});
  const [categoryForm, setCategoryForm] = useState<CategoryRequest>(initialCategoryForm);
  const [categoryErrors, setCategoryErrors] = useState<CategoryFormErrors>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Refs to track previews to revoke
  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = pendingPreviews;
  }, [pendingPreviews]);
  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

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

  // Initial data load — categories for the Redux slice (product form),
  // plus paginated categories + dashboard stats. The tab-specific effects
  // below take care of products / orders.
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

  // -- Image uploader helpers ---------------------------------------------

  const handleImageFilesSelected = (files: File[]) => {
    // Per spec: no client-side size cap; trust server validation. We still
    // require the picked files to be images so we don't ship a non-image
    // payload that the server will reject.
    const nonImage = files.find((f) => !f.type.startsWith('image/'));
    if (nonImage) {
      setProductErrors((prev) => ({
        ...prev,
        images: `Unsupported file type: ${nonImage.type || nonImage.name}`,
      }));
      return;
    }
    setProductErrors((prev) => ({ ...prev, images: undefined }));
    const nextPreviews = files.map((f) => URL.createObjectURL(f));
    setPendingImages((prev) => [...prev, ...files]);
    setPendingPreviews((prev) => [...prev, ...nextPreviews]);
  };

  const handleRemovePendingImage = (idx: number) => {
    URL.revokeObjectURL(pendingPreviews[idx]);
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (pendingMainIndex === idx) setPendingMainIndex(0);
    else if (pendingMainIndex > idx) setPendingMainIndex((v) => v - 1);
  };

  const requestRemoveExistingImage = (productId: number, imageId: number) => {
    setConfirmState({
      open: true,
      title: 'Remove image?',
      message: 'This permanently removes the image from the product.',
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        setDeletingImageId(imageId);
        try {
          await adminApi.deleteProductImage(productId, imageId);
          const remaining = existingImages.filter((img) => img.id !== imageId);
          setExistingImages(remaining);
          if (selectedExistingMainId === imageId) {
            const newMain = remaining.find((i) => i.isMain) || remaining[0];
            setSelectedExistingMainId(newMain ? newMain.id : null);
          }
          showSuccess('Image removed');
        } catch (err) {
          const parsed = parseApiError(err, 'Failed to remove image');
          showError(parsed.message);
        } finally {
          setDeletingImageId(null);
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };

  // -- Product form -------------------------------------------------------

  const validateProductForm = (): boolean => {
    const errs: ProductFormErrors = {};
    if (!productForm.name.trim()) errs.name = 'Name is required';
    if (!productForm.categoryId) errs.categoryId = 'Category is required';
    if (productForm.price <= 0) errs.price = 'Price (MRP) must be greater than zero';
    if (
      productForm.discountPrice &&
      productForm.discountPrice > 0 &&
      productForm.discountPrice >= productForm.price
    ) {
      errs.discountPrice = 'Discount price must be less than MRP';
    }
    if (productForm.stock < 0) errs.stock = 'Stock cannot be negative';
    if (!productForm.weight.trim()) errs.weight = 'Weight is required';
    if (!productForm.unit) errs.unit = 'Unit is required';
    if (!editingProductId && pendingImages.length === 0) {
      errs.images = 'At least one image is required';
    }
    setProductErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateProductForm()) return;
    setSavingProduct(true);
    setUploadProgress(pendingImages.length > 0 ? 0 : null);
    try {
      const payload: ProductRequest = {
        ...productForm,
        discountPrice:
          productForm.discountPrice && productForm.discountPrice > 0
            ? productForm.discountPrice
            : undefined,
      };
      const onProgress = pendingImages.length > 0 ? setUploadProgress : undefined;
      if (editingProductId) {
        await adminApi.updateProduct(
          editingProductId,
          payload,
          pendingImages,
          selectedExistingMainId,
          onProgress,
        );
        showSuccess('Product updated');
      } else {
        await adminApi.createProduct(payload, pendingImages, pendingMainIndex, onProgress);
        showSuccess('Product created');
      }
      setShowProductDialog(false);
      resetProductForm();
      loadAdminProducts();
      loadDashboardStats();
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to save product');
      // Map server-side field errors back onto the form.
      if (Object.keys(parsed.fieldErrors).length > 0) {
        const mapped: ProductFormErrors = {};
        for (const [key, value] of Object.entries(parsed.fieldErrors)) {
          (mapped as Record<string, string>)[key] = value;
        }
        setProductErrors(mapped);
      }
      showError(parsed.message);
    } finally {
      setSavingProduct(false);
      setUploadProgress(null);
    }
  };

  const requestDeleteProduct = (id: number, name: string) => {
    setConfirmState({
      open: true,
      title: 'Delete product?',
      message: `This will deactivate "${name}". Customers will no longer see it but it can be restored.`,
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

  // -- Category form ------------------------------------------------------

  const validateCategoryForm = (): boolean => {
    const errs: CategoryFormErrors = {};
    if (!categoryForm.name.trim()) errs.name = 'Name is required';
    if (categoryForm.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categoryForm.slug)) {
      errs.slug = 'Slug must be lowercase letters/numbers separated by hyphens';
    }
    setCategoryErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCategory = async () => {
    if (!validateCategoryForm()) return;
    setSavingCategory(true);
    try {
      const payload: CategoryRequest = {
        ...categoryForm,
        slug: categoryForm.slug ? categoryForm.slug : undefined,
        parentId: categoryForm.parentId || null,
      };
      if (editingCategoryId) {
        await adminApi.updateCategory(editingCategoryId, payload);
        showSuccess('Category updated');
      } else {
        await adminApi.createCategory(payload);
        showSuccess('Category created');
      }
      setShowCategoryDialog(false);
      resetCategoryForm();
      dispatch(fetchCategories());
      loadCategoryRows(categoryPage, currentLimit);
      loadDashboardStats();
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to save category');
      if (Object.keys(parsed.fieldErrors).length > 0) {
        const mapped: CategoryFormErrors = {};
        for (const [key, value] of Object.entries(parsed.fieldErrors)) {
          (mapped as Record<string, string>)[key] = value;
        }
        setCategoryErrors(mapped);
      }
      showError(parsed.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const requestDeleteCategory = (id: number, name: string, productCount: number) => {
    if (productCount > 0) {
      // Surface block immediately without round-trip.
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

  // -- Orders -------------------------------------------------------------

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

  // -- Form reset / open helpers -----------------------------------------

  const resetProductForm = () => {
    setProductForm(initialProductForm);
    setEditingProductId(null);
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingImages([]);
    setPendingPreviews([]);
    setPendingMainIndex(0);
    setExistingImages([]);
    setSelectedExistingMainId(null);
    setProductErrors({});
    setUploadProgress(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm(initialCategoryForm);
    setEditingCategoryId(null);
    setCategoryErrors({});
    setSlugManuallyEdited(false);
  };

  const openEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || 0,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      stock: product.stock,
      weight: product.weight,
      unit: product.unit,
      active: product.active,
    });
    setEditingProductId(product.id);
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingImages([]);
    setPendingPreviews([]);
    setPendingMainIndex(0);
    setExistingImages(product.images ?? []);
    const mainImg = (product.images ?? []).find((i) => i.isMain);
    setSelectedExistingMainId(mainImg ? mainImg.id : product.images?.[0]?.id ?? null);
    setProductErrors({});
    setUploadProgress(null);
    setShowProductDialog(true);
  };

  const openEditCategory = (category: {
    id: number;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    parentId: number | null;
  }) => {
    setCategoryForm({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId,
    });
    setEditingCategoryId(category.id);
    setCategoryErrors({});
    setSlugManuallyEdited(true); // existing slug must not be overwritten on name edits
    setShowCategoryDialog(true);
  };

  const handleCategoryNameChange = (value: string) => {
    setCategoryForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  };

  // -- Status toggle -------------------------------------------------------

  /**
   * Optimistic inline toggle: flip the row immediately, call PATCH, and on
   * failure roll the row back + refresh from the server so the UI can’t
   * diverge from the true state.
   */
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
      // Roll back and reload from source of truth.
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

  // -- Render -------------------------------------------------------------

  const parentCategoryOptions = useMemo(
    () => categories.filter((c) => c.id !== editingCategoryId && !c.parentId),
    [categories, editingCategoryId],
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      {/* Dashboard Stats */}
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
          <Tab label="Users" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Products Tab */}
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
            onClick={() => {
              resetProductForm();
              setShowProductDialog(true);
            }}
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
                          onClick={() => openEditProduct(p)}
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

      {/* Categories Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetCategoryForm();
              setShowCategoryDialog(true);
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
                        onClick={() => openEditCategory(c)}
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

      {/* Orders Tab */}
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
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersLoading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
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

      {/* Users Tab */}
      <TabPanel value={tabValue} index={3}>
        <UsersTab active={tabId === 'users'} currentUserId={currentUser?.id} />
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={4}>
        <AnalyticsTab active={tabId === 'analytics'} />
      </TabPanel>

      {/* Product Dialog */}
      <Dialog
        open={showProductDialog}
        onClose={() => !savingProduct && setShowProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingProductId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              fullWidth
              required
              error={!!productErrors.name}
              helperText={productErrors.name}
            />
            <TextField
              label="Description"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              error={!!productErrors.description}
              helperText={productErrors.description}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Price (MRP) ₹"
                  type="number"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  fullWidth
                  required
                  error={!!productErrors.price}
                  helperText={productErrors.price ?? 'Original price before any discount'}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Discount Price ₹"
                  type="number"
                  value={productForm.discountPrice || ''}
                  onChange={(e) =>
                    setProductForm({ ...productForm, discountPrice: Number(e.target.value) })
                  }
                  fullWidth
                  error={!!productErrors.discountPrice}
                  helperText={productErrors.discountPrice ?? 'Optional. Must be less than MRP.'}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
            </Grid>
            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Product Images ({existingImages.length + pendingImages.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                JPG, PNG, WEBP, GIF, or AVIF. No size limit. Click a thumbnail to make it the main
                image.
              </Typography>
              {existingImages.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  {existingImages.map((img) => (
                    <Box key={img.id} sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={withCloudinaryTransform(img.imageUrl, 'w_120,h_120,c_fill,q_auto,f_auto')}
                        alt="product"
                        onClick={() => setSelectedExistingMainId(img.id)}
                        sx={{
                          width: 88,
                          height: 88,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor:
                            selectedExistingMainId === img.id ? 'primary.main' : 'transparent',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                        onClick={() =>
                          editingProductId && requestRemoveExistingImage(editingProductId, img.id)
                        }
                        disabled={deletingImageId === img.id}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          bgcolor: 'background.paper',
                          borderRadius: '50%',
                        }}
                      >
                        {selectedExistingMainId === img.id ? (
                          <Star fontSize="small" color="primary" />
                        ) : (
                          <StarBorder fontSize="small" />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              {pendingImages.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  {pendingPreviews.map((preview, idx) => (
                    <Box key={preview} sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={preview}
                        alt="preview"
                        onClick={() => {
                          if (!editingProductId) setPendingMainIndex(idx);
                        }}
                        sx={{
                          width: 88,
                          height: 88,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: editingProductId ? 'default' : 'pointer',
                          border: '2px solid',
                          borderColor:
                            !editingProductId && pendingMainIndex === idx
                              ? 'primary.main'
                              : 'transparent',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                        onClick={() => handleRemovePendingImage(idx)}
                        disabled={savingProduct}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      {!editingProductId && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                          }}
                        >
                          {pendingMainIndex === idx ? (
                            <Star fontSize="small" color="primary" />
                          ) : (
                            <StarBorder fontSize="small" />
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<CloudUpload />}
                disabled={savingProduct}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleImageFilesSelected(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
              </Button>
              {productErrors.images && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {productErrors.images}
                </FormHelperText>
              )}
              {uploadProgress != null && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Uploading… {Math.round(uploadProgress * 100)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.round(uploadProgress * 100)}
                    sx={{ mt: 0.5, borderRadius: 1, height: 6 }}
                  />
                </Box>
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth required error={!!productErrors.categoryId}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    value={productForm.categoryId || ''}
                    onChange={(e) =>
                      setProductForm({ ...productForm, categoryId: Number(e.target.value) })
                    }
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {productErrors.categoryId && (
                    <FormHelperText>{productErrors.categoryId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Stock"
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  fullWidth
                  error={!!productErrors.stock}
                  helperText={productErrors.stock}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Weight"
                  value={productForm.weight}
                  onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                  fullWidth
                  error={!!productErrors.weight}
                  helperText={productErrors.weight}
                />
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    label="Unit"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  >
                    <MenuItem value="g">g</MenuItem>
                    <MenuItem value="kg">kg</MenuItem>
                    <MenuItem value="pcs">pcs</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProductDialog(false)} disabled={savingProduct}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
            disabled={savingProduct}
          >
            {savingProduct ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={showCategoryDialog}
        onClose={() => !savingCategory && setShowCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingCategoryId ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={categoryForm.name}
              onChange={(e) => handleCategoryNameChange(e.target.value)}
              fullWidth
              required
              error={!!categoryErrors.name}
              helperText={categoryErrors.name}
            />
            <TextField
              label="Slug"
              value={categoryForm.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setCategoryForm({ ...categoryForm, slug: e.target.value });
              }}
              fullWidth
              error={!!categoryErrors.slug}
              helperText={
                categoryErrors.slug ??
                'Auto-generated from name. Override to customize the URL slug.'
              }
            />
            <FormControl fullWidth>
              <InputLabel>Parent category</InputLabel>
              <Select
                label="Parent category"
                value={categoryForm.parentId ?? ''}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    parentId: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              >
                <MenuItem value="">No parent (top-level)</MenuItem>
                {parentCategoryOptions.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {categoryErrors.parentId ?? 'Optional. Only top-level categories can be parents.'}
              </FormHelperText>
            </FormControl>
            <TextField
              label="Description"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              error={!!categoryErrors.description}
              helperText={categoryErrors.description}
            />
            <TextField
              label="Image URL"
              value={categoryForm.imageUrl}
              onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCategoryDialog(false)} disabled={savingCategory}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveCategory} disabled={savingCategory}>
            {savingCategory ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        loading={confirmState.loading}
        confirmLabel="Confirm"
        destructive
        onConfirm={() => confirmState.onConfirm()}
        onCancel={() =>
          setConfirmState((s) => ({ ...s, open: false, loading: false }))
        }
      />
    </Container>
  );
};

export default AdminPage;
