import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  fetchProductById,
  fetchProductBySlug,
  clearSelectedProduct,
  fetchProducts,
} from '../features/product/productSlice';
import { productUrl } from '../utils/productUrl';

export function useProductData(productSlug: string | undefined) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const paramIsNumericId = !!productSlug && /^\d+$/.test(productSlug);
  const {
    selectedProduct,
    selectedProductLoading,
    selectedProductError,
    selectedProductRequestKey,
    products,
  } = useAppSelector((s) => s.products);
  const requestKey = productSlug
    ? `${paramIsNumericId ? 'id' : 'slug'}:${productSlug}`
    : null;
  const product = selectedProduct && (
    paramIsNumericId
      ? selectedProduct.id === Number(productSlug)
      : selectedProduct.slug === productSlug
  )
    ? selectedProduct
    : null;
  const loading = selectedProductRequestKey === requestKey && selectedProductLoading;
  const error = selectedProductRequestKey === requestKey ? selectedProductError : null;

  useEffect(() => {
    if (!productSlug || product) return;
    if (paramIsNumericId) {
      dispatch(fetchProductById(Number(productSlug)));
    } else {
      dispatch(fetchProductBySlug(productSlug));
    }
  }, [dispatch, productSlug, paramIsNumericId, product]);

  useEffect(() => {
    return () => { dispatch(clearSelectedProduct()); };
  }, [dispatch]);

  useEffect(() => {
    if (!product?.slug) return;
    if (!paramIsNumericId && product.slug !== productSlug) return;
    const canonical = productUrl(product);
    if (location.pathname !== canonical) {
      navigate(canonical, { replace: true });
    }
  }, [product, productSlug, paramIsNumericId, location.pathname, navigate]);

  const productId = product?.id;
  useEffect(() => {
    if (productId) {
      dispatch(fetchProducts({ page: 0, size: 12 }));
    }
  }, [dispatch, productId]);

  return { product, products, loading, error, paramIsNumericId };
}
