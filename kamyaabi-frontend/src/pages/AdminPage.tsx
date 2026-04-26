import React, { useEffect, useState } from 'react';
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
  InputLabel,
  Alert,
  Pagination,
  Paper,
} from '@mui/material';
import { Edit, Delete, Add, Inventory, ShoppingCart as CartIcon, CurrencyRupee, Warning, CloudUpload, Star, StarBorder } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchProducts, fetchCategories } from '../features/product/productSlice';
import { adminApi, ProductRequest, CategoryRequest } from '../api/adminApi';
import { Order, Product, ProductImage } from '../types';
import Loading from '../components/common/Loading';
import { withCloudinaryTransform } from '../utils/cloudinary';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_PRODUCT = 5;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ py: 3 }}>{children}</Box>}</div>
);

const AdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, categories, totalPages, totalElements, currentPage, loading } = useAppSelector(
    (state) => state.products
  );

  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersTotalElements, setOrdersTotalElements] = useState(0);
  const [ordersTotalRevenue, setOrdersTotalRevenue] = useState(0);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [pendingMainIndex, setPendingMainIndex] = useState<number>(0);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [selectedExistingMainId, setSelectedExistingMainId] = useState<number | null>(null);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const [productForm, setProductForm] = useState<ProductRequest>({
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
  });

  const [categoryForm, setCategoryForm] = useState<CategoryRequest>({
    name: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    dispatch(fetchProducts({}));
    dispatch(fetchCategories());
    loadOrders(0);
  }, [dispatch]);

  const loadOrders = async (page: number, status?: string) => {
    setOrdersLoading(true);
    try {
      const res = await adminApi.getAllOrders(page, 10, status || undefined);
      const data = res.data.data;
      setOrders(data.content);
      setOrdersTotalPages(data.totalPages);
      setOrdersTotalElements(data.totalElements);
      // Sum revenue from loaded orders (best effort from available data)
      setOrdersTotalRevenue(data.content.reduce((sum: number, o: Order) => sum + o.totalAmount, 0));
    } catch {
      setError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const validateImageFiles = (files: File[]): string | null => {
    if (files.some((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type))) {
      return 'Only JPG, PNG, or WEBP images are allowed';
    }
    if (files.some((f) => f.size > MAX_IMAGE_SIZE_BYTES)) {
      return 'Each image must be 5MB or smaller';
    }
    return null;
  };

  const handleImageFilesSelected = (files: File[]) => {
    const totalAfter = existingImages.length + pendingImages.length + files.length;
    if (totalAfter > MAX_IMAGES_PER_PRODUCT) {
      setImageValidationError(`You can attach at most ${MAX_IMAGES_PER_PRODUCT} images per product`);
      return;
    }
    const validationError = validateImageFiles(files);
    if (validationError) {
      setImageValidationError(validationError);
      return;
    }
    setImageValidationError(null);
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

  const handleDeleteExistingImage = async (productId: number, imageId: number) => {
    if (!window.confirm('Remove this image from the product?')) return;
    setDeletingImageId(imageId);
    try {
      await adminApi.deleteProductImage(productId, imageId);
      const remaining = existingImages.filter((img) => img.id !== imageId);
      setExistingImages(remaining);
      if (selectedExistingMainId === imageId) {
        const newMain = remaining.find((i) => i.isMain) || remaining[0];
        setSelectedExistingMainId(newMain ? newMain.id : null);
      }
      setSuccess('Image removed');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Failed to remove image');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSaveProduct = async () => {
    if (productForm.price <= 0) {
      setError('Price (MRP) must be greater than zero');
      return;
    }
    if (productForm.discountPrice && productForm.discountPrice > 0 && productForm.discountPrice >= productForm.price) {
      setError('Discount Price (Selling Price) must be less than the original Price (MRP)');
      return;
    }
    if (!editingProductId && pendingImages.length === 0) {
      setError('At least one image is required');
      return;
    }
    const totalImages = existingImages.length + pendingImages.length;
    if (totalImages > MAX_IMAGES_PER_PRODUCT) {
      setError(`A product can have at most ${MAX_IMAGES_PER_PRODUCT} images`);
      return;
    }
    setSavingProduct(true);
    try {
      const payload = {
        ...productForm,
        discountPrice: productForm.discountPrice && productForm.discountPrice > 0 ? productForm.discountPrice : undefined,
      };
      if (editingProductId) {
        await adminApi.updateProduct(editingProductId, payload, pendingImages, selectedExistingMainId);
        setSuccess('Product updated successfully');
      } else {
        await adminApi.createProduct(payload, pendingImages, pendingMainIndex);
        setSuccess('Product created successfully');
      }
      setShowProductDialog(false);
      resetProductForm();
      dispatch(fetchProducts({}));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setDeletingProductId(id);
      try {
        await adminApi.deleteProduct(id);
        setSuccess('Product deleted');
        dispatch(fetchProducts({}));
      } catch {
        setError('Failed to delete product');
      } finally {
        setDeletingProductId(null);
      }
    }
  };

  const handleSaveCategory = async () => {
    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        await adminApi.updateCategory(editingCategoryId, categoryForm);
        setSuccess('Category updated');
      } else {
        await adminApi.createCategory(categoryForm);
        setSuccess('Category created');
      }
      setShowCategoryDialog(false);
      resetCategoryForm();
      dispatch(fetchCategories());
    } catch {
      setError('Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setDeletingCategoryId(id);
      try {
        await adminApi.deleteCategory(id);
        setSuccess('Category deleted');
        dispatch(fetchCategories());
      } catch {
        setError('Failed to delete category');
      } finally {
        setDeletingCategoryId(null);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    if (!status) return;
    setUpdatingOrderId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, status);
      setSuccess('Order status updated');
      loadOrders(0, orderStatusFilter);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError?.response?.data?.message || 'Failed to update order status';
      setError(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: 0, discountPrice: 0, imageUrl: '', categoryId: 0, stock: 0, weight: '', unit: 'g', active: true });
    setEditingProductId(null);
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingImages([]);
    setPendingPreviews([]);
    setPendingMainIndex(0);
    setExistingImages([]);
    setSelectedExistingMainId(null);
    setImageValidationError(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', imageUrl: '' });
    setEditingCategoryId(null);
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
    setSelectedExistingMainId(mainImg ? mainImg.id : (product.images?.[0]?.id ?? null));
    setImageValidationError(null);
    setShowProductDialog(true);
  };

  const openEditCategory = (category: { id: number; name: string; description: string; imageUrl: string }) => {
    setCategoryForm({ name: category.name, description: category.description, imageUrl: category.imageUrl });
    setEditingCategoryId(category.id);
    setShowCategoryDialog(true);
  };

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
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalElements}</Typography>
            <Typography variant="body2" color="text.secondary">Total Products</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <CartIcon sx={{ fontSize: 36, color: 'info.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{ordersTotalElements}</Typography>
            <Typography variant="body2" color="text.secondary">Total Orders</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <CurrencyRupee sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              ₹{ordersTotalRevenue.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
            <Warning sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{products.filter(p => p.stock < 10).length}</Typography>
            <Typography variant="body2" color="text.secondary">Low Stock Alerts</Typography>
          </Paper>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Products" />
          <Tab label="Categories" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {/* Products Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => { resetProductForm(); setShowProductDialog(true); }}>
            Add Product
          </Button>
        </Box>
        {loading ? <Loading /> : (
          <>
            <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price (MRP)</TableCell>
                    <TableCell>Discount Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.categoryName}</TableCell>
                      <TableCell>₹{p.price}</TableCell>
                      <TableCell>{p.discountPrice ? `₹${p.discountPrice}` : '—'}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>
                        <Chip label={p.active ? 'Active' : 'Inactive'} color={p.active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                            <IconButton size="small" onClick={() => openEditProduct(p)} disabled={deletingProductId === p.id}><Edit /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteProduct(p.id)} disabled={deletingProductId === p.id}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={totalPages} page={currentPage + 1} onChange={(_, p) => dispatch(fetchProducts({ page: p - 1 }))} />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      {/* Categories Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
            Add Category
          </Button>
        </Box>
        <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell>{c.productCount}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEditCategory(c)} disabled={deletingCategoryId === c.id}><Edit /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteCategory(c.id)} disabled={deletingCategoryId === c.id}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
                loadOrders(0, val);
              }}
            >
              <MenuItem value="">All Orders</MenuItem>
              {['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED', 'PENDING'].map((s) => (
                <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {ordersLoading ? <Loading message="Loading orders..." /> : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              {orderStatusFilter ? `No orders found for status: ${orderStatusFilter.replace('_', ' ')}` : 'No orders found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {orderStatusFilter ? 'Try selecting a different status filter.' : 'Orders will appear here once customers place them.'}
            </Typography>
          </Box>
        ) : (
          <>
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
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>#{o.id}</TableCell>
                      <TableCell>{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>
                        {o.items.length === 0 ? '—' : (
                          <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }}>
                            {o.items.map((item) => (
                              <Box component="li" key={item.id} sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
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
                            <Box>{o.shippingAddress.city}, {o.shippingAddress.state}</Box>
                            <Box>{o.shippingAddress.pincode}</Box>
                            {o.shippingAddress.phone && <Box>📞 {o.shippingAddress.phone}</Box>}
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell>₹{o.totalAmount}</TableCell>
                      <TableCell><Chip label={o.status} size="small" /></TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 130 }} disabled={updatingOrderId === o.id}>
                          <InputLabel>Update</InputLabel>
                          <Select
                            label="Update"
                            value=""
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          >
                            {['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                              <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {ordersTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={ordersTotalPages} onChange={(_, p) => loadOrders(p - 1, orderStatusFilter)} />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onClose={() => setShowProductDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingProductId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} fullWidth required />
            <TextField label="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} fullWidth multiline rows={3} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Price (MRP) ₹"
                  type="number"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  fullWidth
                  required
                  helperText="Original price before any discount"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Discount Price (Selling Price) ₹"
                  type="number"
                  value={productForm.discountPrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })}
                  fullWidth
                  helperText="Final selling price (must be less than MRP). Leave empty for no discount."
                  inputProps={{ min: 0, step: '0.01' }}
                  error={!!(productForm.discountPrice && productForm.discountPrice > 0 && productForm.price > 0 && productForm.discountPrice >= productForm.price)}
                />
              </Grid>
            </Grid>
            {productForm.discountPrice && productForm.discountPrice > 0 && productForm.price > 0 && productForm.discountPrice < productForm.price && (
              <Alert severity="info" sx={{ mt: -1 }}>
                Discount: {Math.round(((productForm.price - productForm.discountPrice) / productForm.price) * 100)}% OFF — Customer pays ₹{productForm.discountPrice} instead of ₹{productForm.price}
              </Alert>
            )}
            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Product Images ({existingImages.length + pendingImages.length}/{MAX_IMAGES_PER_PRODUCT})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                JPG, PNG, or WEBP up to 5MB each. At least one image is required. Click a thumbnail to make it the main image.
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
                          borderColor: selectedExistingMainId === img.id ? 'primary.main' : 'transparent',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                        onClick={() => editingProductId && handleDeleteExistingImage(editingProductId, img.id)}
                        disabled={deletingImageId === img.id}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      <Box sx={{ position: 'absolute', bottom: 4, left: 4, bgcolor: 'background.paper', borderRadius: '50%' }}>
                        {selectedExistingMainId === img.id ? <Star fontSize="small" color="primary" /> : <StarBorder fontSize="small" />}
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
                        onClick={() => { if (!editingProductId) setPendingMainIndex(idx); }}
                        sx={{
                          width: 88,
                          height: 88,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: editingProductId ? 'default' : 'pointer',
                          border: '2px solid',
                          borderColor: !editingProductId && pendingMainIndex === idx ? 'primary.main' : 'transparent',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                        onClick={() => handleRemovePendingImage(idx)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      {!editingProductId && (
                        <Box sx={{ position: 'absolute', bottom: 4, left: 4, bgcolor: 'background.paper', borderRadius: '50%' }}>
                          {pendingMainIndex === idx ? <Star fontSize="small" color="primary" /> : <StarBorder fontSize="small" />}
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
                disabled={existingImages.length + pendingImages.length >= MAX_IMAGES_PER_PRODUCT}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={(e) => {
                    if (e.target.files) {
                      handleImageFilesSelected(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
              </Button>
              {imageValidationError && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setImageValidationError(null)}>
                  {imageValidationError}
                </Alert>
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" value={productForm.categoryId || ''} onChange={(e) => setProductForm({ ...productForm, categoryId: Number(e.target.value) })}>
                    {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField label="Stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField label="Weight" value={productForm.weight} onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select label="Unit" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}>
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
          <Button onClick={() => setShowProductDialog(false)} disabled={savingProduct}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProduct} disabled={savingProduct}>
            {savingProduct ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onClose={() => setShowCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategoryId ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} fullWidth required />
            <TextField label="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Image URL" value={categoryForm.imageUrl} onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCategoryDialog(false)} disabled={savingCategory}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory} disabled={savingCategory}>
            {savingCategory ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
