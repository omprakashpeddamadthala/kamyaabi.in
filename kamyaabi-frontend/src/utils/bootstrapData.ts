import { Product } from '../types';

interface ProductBootstrapData {
  path: string;
  product: Product;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const isProduct = (value: unknown): value is Product => (
  isRecord(value)
  && typeof value.id === 'number'
  && typeof value.name === 'string'
  && typeof value.slug === 'string'
);

const isProductBootstrapData = (value: unknown): value is ProductBootstrapData => (
  isRecord(value)
  && typeof value.path === 'string'
  && isProduct(value.product)
);

export const readBootstrapProduct = (): Product | null => {
  const element = document.getElementById('kamyaabi-bootstrap-data');
  if (!element?.textContent) return null;

  try {
    const data: unknown = JSON.parse(element.textContent);
    if (!isProductBootstrapData(data) || data.path !== window.location.pathname) return null;
    return data.product;
  } catch {
    return null;
  }
};
