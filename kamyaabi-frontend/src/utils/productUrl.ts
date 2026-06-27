/**
 * Builds the canonical, SEO-friendly product detail path.
 *
 * Preferred hierarchical form `/products/{categorySlug}/{productSlug}` provides
 * a category > product hierarchy for search engines. Falls back to the flat
 * `/products/{productSlug}` form (still a valid, redirecting route) when a
 * category slug is unavailable, and finally to the numeric id for very old
 * records that have not been backfilled yet.
 */
export interface ProductLinkParts {
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
