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
import { Edit, Delete, Add, Inventory, ShoppingCart as CartIcon, CurrencyRupee, Warning } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchProducts, fetchCategories } from '../features/product/productSlice';
import { adminApi, ProductRequest, CategoryRequest } from '../api/adminApi';
import { Order } from '../types';
import Loading from '../components/common/Loading';

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

  const loadOrders = async (page: number) => {
    try {
      const res = await adminApi.getAllOrders(page);
      const data = res.data.data;
      setOrders(data.content);
      setOrdersTotalPages(data.totalPages);
      setOrdersTotalElements(data.totalElements);
      // Sum revenue from loaded orders (best effort from available data)
      setOrdersTotalRevenue(data.content.reduce((sum: number, o: Order) => sum + o.totalAmount, 0));
    } catch {
      setError('Failed to load orders');
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProductId) {
        await adminApi.updateProduct(editingProductId, productForm);
        setSuccess('Product updated successfully');
      } else {
        await adminApi.createProduct(productForm);
        setSuccess('Product created successfully');
      }
      setShowProductDialog(false);
      resetProductForm();
      dispatch(fetchProducts({}));
    } catch {
      setError('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApi.deleteProduct(id);
        setSuccess('Product deleted');
        dispatch(fetchProducts({}));
      } catch {
        setError('Failed to delete product');
      }
    }
  };

  const handleSaveCategory = async () => {
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
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await adminApi.deleteCategory(id);
        setSuccess('Category deleted');
        dispatch(fetchCategories());
      } catch {
        setError('Failed to delete category');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    if (!status) return;
    try {
      await adminApi.updateOrderStatus(orderId, status);
      setSuccess('Order status updated');
      loadOrders(0);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError?.response?.data?.message || 'Failed to update order status';
      setError(msg);
    }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: 0, discountPrice: 0, imageUrl: '', categoryId: 0, stock: 0, weight: '', unit: 'g', active: true });
    setEditingProductId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', imageUrl: '' });
    setEditingCategoryId(null);
  };

  const openEditProduct = (product: { id: number; name: string; description: string; price: number; discountPrice: number | null; imageUrl: string; categoryId: number; stock: number; weight: string; unit: string; active: boolean }) => {
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
                        <IconButton size="small" onClick={() => openEditProduct(p)}><Edit /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteProduct(p.id)}><Delete /></IconButton>
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
                    <IconButton size="small" onClick={() => openEditCategory(c)}><Edit /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteCategory(c.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Orders Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
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
                  <TableCell>{o.items.length}</TableCell>
                  <TableCell>₹{o.totalAmount}</TableCell>
                  <TableCell><Chip label={o.status} size="small" /></TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel>Update</InputLabel>
                      <Select
                        label="Update"
                        value=""
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                      >
                        {['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
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
            <Pagination count={ordersTotalPages} onChange={(_, p) => loadOrders(p - 1)} />
          </Box>
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
                <TextField label="Price (MRP)" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} fullWidth required />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Discount Price" type="number" value={productForm.discountPrice} onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })} fullWidth />
              </Grid>
            </Grid>
            <TextField label="Image URL" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} fullWidth />
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
          <Button onClick={() => setShowProductDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProduct}>Save</Button>
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
          <Button onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
