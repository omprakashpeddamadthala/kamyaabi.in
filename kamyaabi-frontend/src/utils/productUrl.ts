interface ProductLinkParts {
  id?: number;
  slug?: string | null;
  categorySlug?: string | null;
}

export function productUrl(product: ProductLinkParts): string {
  const slug = product.slug?.trim();
  if (slug) {
    const categorySlug = product.categorySlug?.trim();
    return categorySlug ? `/products/${categorySlug}/${slug}` : `/products/${slug}`;
  }
  return `/products/${product.id ?? ''}`;
}
