/**
 * Local SVG fallback rendered when a product has no image. Shipping a static
 * asset under `/public` keeps requests on-origin (no extra DNS lookup) and
 * avoids the latency / privacy surface of `via.placeholder.com`.
 */
export const PRODUCT_PLACEHOLDER_IMAGE = '/assets/img/product-placeholder.svg';
