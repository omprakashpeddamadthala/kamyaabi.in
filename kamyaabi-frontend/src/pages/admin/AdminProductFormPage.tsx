import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Grid,
  Typography,
  IconButton,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Delete,
  CloudUpload,
  Star,
  StarBorder,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { adminApi, ProductRequest } from '../../api/adminApi';
import { adminProductTagApi } from '../../api/productTagApi';
import { Product, ProductImage, ProductTag } from '../../types';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchCategories } from '../../features/product/productSlice';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';

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
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogImageUrl: '',
  canonicalUrl: '',
};

const LIST_PATH = '/admin?tab=products';

const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingProductId = id ? Number(id) : null;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { categories } = useAppSelector((state) => state.products);

  const [loading, setLoading] = useState<boolean>(Boolean(editingProductId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [productForm, setProductForm] = useState<ProductRequest>(initialProductForm);
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});

  const [allProductTags, setAllProductTags] = useState<ProductTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [pendingMainIndex, setPendingMainIndex] = useState<number>(0);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [selectedExistingMainId, setSelectedExistingMainId] = useState<number | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [imageToRemove, setImageToRemove] = useState<ProductImage | null>(null);

  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = pendingPreviews;
  }, [pendingPreviews]);
  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const hydrateFromProduct = useCallback((product: Product) => {
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
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      seoKeywords: product.seoKeywords || '',
      ogImageUrl: product.ogImageUrl || '',
      canonicalUrl: product.canonicalUrl || '',
    });
    setSelectedTagIds(product.tags?.map((t) => t.id) ?? []);
    setExistingImages(product.images ?? []);
    const mainImg = (product.images ?? []).find((i) => i.isMain);
    setSelectedExistingMainId(mainImg ? mainImg.id : product.images?.[0]?.id ?? null);
  }, []);

  useEffect(() => {
    dispatch(fetchCategories());
    adminProductTagApi
      .getAll()
      .then((res) => setAllProductTags(res.data.data))
      .catch(() => undefined);
  }, [dispatch]);

  useEffect(() => {
    if (!editingProductId) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    adminApi
      .getProductById(editingProductId)
      .then((res) => {
        if (active) hydrateFromProduct(res.data.data);
      })
      .catch((err) => {
        if (active) setLoadError(parseApiError(err, 'Failed to load product').message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editingProductId, hydrateFromProduct]);

  const handleImageFilesSelected = (files: File[]) => {
    const nonImage = files.find((f) => !f.type.startsWith('image/'));
    if (nonImage) {
      setProductErrors((prev) => ({ ...prev, images: `Unsupported file type: ${nonImage.type || nonImage.name}` }));
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

  const confirmRemoveExistingImage = async () => {
    if (!imageToRemove || !editingProductId) return;
    setDeletingImageId(imageToRemove.id);
    try {
      await adminApi.deleteProductImage(editingProductId, imageToRemove.id);
      const remaining = existingImages.filter((img) => img.id !== imageToRemove.id);
      setExistingImages(remaining);
      if (selectedExistingMainId === imageToRemove.id) {
        const newMain = remaining.find((i) => i.isMain) || remaining[0];
        setSelectedExistingMainId(newMain ? newMain.id : null);
      }
      showSuccess('Image removed');
    } catch (err) {
      showError(parseApiError(err, 'Failed to remove image').message);
    } finally {
      setDeletingImageId(null);
      setImageToRemove(null);
    }
  };

  const validateProductForm = (): boolean => {
    const errs: ProductFormErrors = {};
    if (!productForm.name.trim()) errs.name = 'Name is required';
    if (!productForm.categoryId) errs.categoryId = 'Category is required';
    if (productForm.price <= 0) errs.price = 'Price (MRP) must be greater than zero';
    if (productForm.discountPrice && productForm.discountPrice > 0 && productForm.discountPrice >= productForm.price) {
      errs.discountPrice = 'Discount price must be less than MRP';
    }
    if (productForm.stock < 0) errs.stock = 'Stock cannot be negative';
    if (!productForm.weight.trim()) errs.weight = 'Weight is required';
    if (!productForm.unit) errs.unit = 'Unit is required';
    if (!editingProductId && pendingImages.length === 0) errs.images = 'At least one image is required';
    setProductErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateProductForm()) return;
    setSaving(true);
    setUploadProgress(pendingImages.length > 0 ? 0 : null);
    try {
      const payload: ProductRequest = {
        ...productForm,
        discountPrice: productForm.discountPrice && productForm.discountPrice > 0 ? productForm.discountPrice : undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      };
      const onProgress = pendingImages.length > 0 ? setUploadProgress : undefined;
      if (editingProductId) {
        await adminApi.updateProduct(editingProductId, payload, pendingImages, selectedExistingMainId, onProgress);
        showSuccess('Product updated');
      } else {
        await adminApi.createProduct(payload, pendingImages, pendingMainIndex, onProgress);
        showSuccess('Product created');
      }
      navigate(LIST_PATH);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to save product');
      if (Object.keys(parsed.fieldErrors).length > 0) {
        const mapped: ProductFormErrors = {};
        for (const [key, value] of Object.entries(parsed.fieldErrors)) {
          (mapped as Record<string, string>)[key] = value;
        }
        setProductErrors(mapped);
      }
      showError(parsed.message);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={220} height={40} />
        <Skeleton variant="rounded" height={520} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <AdminFormShell
      title={editingProductId ? 'Edit Product' : 'Add Product'}
      subtitle={editingProductId ? 'Update product details, images, tags and SEO metadata.' : 'Create a new product with images, pricing, tags and SEO metadata.'}
      onSubmit={handleSaveProduct}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingProductId ? 'Save changes' : 'Create product'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load product"
          message={loadError}
          confirmLabel="Retry"
          cancelLabel="Back to list"
          onConfirm={() => editingProductId && navigate(0)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
            <TextField
              label="Discount Price ₹"
              type="number"
              value={productForm.discountPrice || ''}
              onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })}
              fullWidth
              error={!!productErrors.discountPrice}
              helperText={productErrors.discountPrice ?? 'Optional. Must be less than MRP.'}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
        </Grid>

        <Divider textAlign="left" sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
          <Typography variant="overline" color="text.secondary">Images</Typography>
        </Divider>
        <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Product Images ({existingImages.length + pendingImages.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            JPG, PNG, WEBP, GIF, or AVIF. No size limit. Click a thumbnail to make it the main image.
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
                    aria-label="Remove image"
                    sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                    onClick={() => setImageToRemove(img)}
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
                      borderColor: !editingProductId && pendingMainIndex === idx ? 'primary.main' : 'transparent',
                    }}
                  />
                  <IconButton
                    size="small"
                    aria-label="Remove pending image"
                    sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                    onClick={() => handleRemovePendingImage(idx)}
                    disabled={saving}
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
          <Button variant="outlined" component="label" size="small" startIcon={<CloudUpload />} disabled={saving}>
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
          {productErrors.images && <FormHelperText error sx={{ mt: 1 }}>{productErrors.images}</FormHelperText>}
          {uploadProgress != null && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Uploading… {Math.round(uploadProgress * 100)}%</Typography>
              <LinearProgress variant="determinate" value={Math.round(uploadProgress * 100)} sx={{ mt: 0.5, borderRadius: 1, height: 6 }} />
            </Box>
          )}
          {editingProductId && (
            <Box sx={{ mt: 1.5 }}>
              <InlineConfirmBar
                open={Boolean(imageToRemove)}
                title="Remove image?"
                message="This permanently removes the image from the product."
                confirmLabel="Remove"
                loading={deletingImageId != null}
                onConfirm={confirmRemoveExistingImage}
                onCancel={() => setImageToRemove(null)}
              />
            </Box>
          )}
        </Box>

        <Divider textAlign="left" sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
          <Typography variant="overline" color="text.secondary">Inventory</Typography>
        </Divider>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth required error={!!productErrors.categoryId}>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={productForm.categoryId || ''}
                onChange={(e) => setProductForm({ ...productForm, categoryId: Number(e.target.value) })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
              {productErrors.categoryId && <FormHelperText>{productErrors.categoryId}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
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
          <Grid item xs={6} sm={6} md={3}>
            <TextField
              label="Weight"
              value={productForm.weight}
              onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
              fullWidth
              error={!!productErrors.weight}
              helperText={productErrors.weight}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
        {allProductTags.length > 0 && (
          <FormControl fullWidth>
            <InputLabel>Tags</InputLabel>
            <Select
              label="Tags"
              multiple
              value={selectedTagIds}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTagIds(typeof val === 'string' ? val.split(',').map(Number) : (val as number[]));
              }}
              renderValue={(selected) =>
                (selected as number[]).map((tid) => allProductTags.find((t) => t.id === tid)?.name ?? tid).join(', ')
              }
            >
              {allProductTags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>{tag.name}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Optional. Select tags for this product.</FormHelperText>
          </FormControl>
        )}

        <Accordion disableGutters sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">SEO Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Meta Title"
                value={productForm.seoTitle || ''}
                onChange={(e) => setProductForm({ ...productForm, seoTitle: e.target.value })}
                fullWidth
                helperText="Page title for search engines (50-60 chars recommended)"
              />
              <TextField
                label="Meta Description"
                value={productForm.seoDescription || ''}
                onChange={(e) => setProductForm({ ...productForm, seoDescription: e.target.value })}
                fullWidth
                multiline
                rows={2}
                helperText="Page description for search engines (150-160 chars recommended)"
              />
              <TextField
                label="Meta Keywords"
                value={productForm.seoKeywords || ''}
                onChange={(e) => setProductForm({ ...productForm, seoKeywords: e.target.value })}
                fullWidth
                helperText="Comma-separated keywords"
              />
              <TextField
                label="OG Image URL"
                value={productForm.ogImageUrl || ''}
                onChange={(e) => setProductForm({ ...productForm, ogImageUrl: e.target.value })}
                fullWidth
                helperText="Image URL for social media sharing (1200x630px recommended)"
              />
              <TextField
                label="Canonical URL"
                value={productForm.canonicalUrl || ''}
                onChange={(e) => setProductForm({ ...productForm, canonicalUrl: e.target.value })}
                fullWidth
                helperText="Canonical URL if different from the default product page URL"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </AdminFormShell>
  );
};

export default AdminProductFormPage;
