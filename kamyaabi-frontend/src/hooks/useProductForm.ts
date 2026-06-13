import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminApi, ProductRequest } from '../api/adminApi';
import { adminProductTagApi } from '../api/productTagApi';
import { Product, ProductImage, ProductTag } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/useToast';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { fetchCategories } from '../features/product/productSlice';

export interface ProductFormErrors {
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

const LIST_PATH = '/admin/products';

export function useProductForm(editingProductId: number | null) {
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

  const updateForm = useCallback((patch: Partial<ProductRequest>) => {
    setProductForm((prev) => ({ ...prev, ...patch }));
  }, []);

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

  return {
    loading,
    loadError,
    saving,
    uploadProgress,
    productForm,
    productErrors,
    updateForm,
    categories,
    allProductTags,
    selectedTagIds,
    setSelectedTagIds,
    images: {
      pendingImages,
      pendingPreviews,
      pendingMainIndex,
      setPendingMainIndex,
      existingImages,
      selectedExistingMainId,
      setSelectedExistingMainId,
      deletingImageId,
      imageToRemove,
      setImageToRemove,
      handleImageFilesSelected,
      handleRemovePendingImage,
      confirmRemoveExistingImage,
    },
    handleSaveProduct,
  };
}
