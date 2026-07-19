import { Product, BlogPost } from '../types';

interface ProductBootstrapData {
  path: string;
  product: Product;
}

interface BlogBootstrapData {
  path: string;
  post: BlogPost;
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

const isBlogPost = (value: unknown): value is BlogPost => (
  isRecord(value)
  && typeof value.id === 'number'
  && typeof value.title === 'string'
  && typeof value.slug === 'string'
);

const isProductBootstrapData = (value: unknown): value is ProductBootstrapData => (
  isRecord(value)
  && typeof value.path === 'string'
  && isProduct(value.product)
);

const isBlogBootstrapData = (value: unknown): value is BlogBootstrapData => (
  isRecord(value)
  && typeof value.path === 'string'
  && isBlogPost(value.post)
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

export const readBootstrapBlog = (): BlogPost | null => {
  const element = document.getElementById('kamyaabi-bootstrap-data');
  if (!element?.textContent) return null;

  try {
    const data: unknown = JSON.parse(element.textContent);
    if (!isBlogBootstrapData(data) || data.path !== window.location.pathname) return null;
    return data.post;
  } catch {
    return null;
  }
};
