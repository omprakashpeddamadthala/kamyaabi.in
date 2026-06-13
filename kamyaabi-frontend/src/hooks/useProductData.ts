import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  fetchProductById,
  fetchProductBySlug,
  clearSelectedProduct,
  fetchProducts,
} from '../features/product/productSlice';

export function useProductData(slugParam: string | undefined) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const paramIsNumericId = !!slugParam && /^\d+$/.test(slugParam);
  const { selectedProduct: product, products } = useAppSelector((s) => s.products);

  useEffect(() => {
    if (slugParam) {
      if (paramIsNumericId) {
        dispatch(fetchProductById(Number(slugParam)));
      } else {
        dispatch(fetchProductBySlug(slugParam));
      }
    }
    return () => { dispatch(clearSelectedProduct()); };
  }, [dispatch, slugParam, paramIsNumericId]);

  useEffect(() => {
    if (paramIsNumericId && product?.slug) {
      navigate(`/products/${product.slug}`, { replace: true });
    }
  }, [paramIsNumericId, product?.slug, navigate]);

  useEffect(() => {
    if (product) {
      dispatch(fetchProducts({ page: 0, size: 12 }));
    }
  }, [dispatch, product?.id]);

  return { product, products, paramIsNumericId };
}
