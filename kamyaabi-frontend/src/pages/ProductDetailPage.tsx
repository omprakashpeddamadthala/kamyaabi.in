import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Skeleton,
  CircularProgress,
  Tab,
  Tabs,
  Rating,
  Dialog,
  useMediaQuery,
  useTheme,
  Slide,
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Remove,
  Check,
  CheckCircle,
  Close,
  VerifiedUser,
  LocalShipping,
  Inventory,
  Lock,
  Star,
  NavigateNext,
  ZoomIn,
  Restaurant,
  Kitchen,
  Description as DescriptionIcon,
  ChevronLeft,
  ChevronRight,
  FlashOn,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import {
  fetchProductById,
  fetchProductBySlug,
  clearSelectedProduct,
  fetchProducts,
} from '../features/product/productSlice';
import { addToCart, optimisticAddToCart } from '../features/cart/cartSlice';
import { useFlyToCart } from '../components/common/FlyToCartAnimation';
import PageTransition from '../components/common/PageTransition';
import { cloudinarySrcSet, withCloudinaryTransform } from '../utils/cloudinary';
import ProductCard from '../components/common/ProductCard';
import { reviewApi } from '../api/reviewApi';
import type { Review, ReviewSummary } from '../types';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';

/* ─── Scroll-reveal hook (IntersectionObserver) ──────────────────────────
 * Uses a callback ref so the observer attaches the moment the target node
 * mounts. With a plain `useRef` + one-shot `useEffect`, the effect ran once
 * on the initial render — when the component still showed the skeleton and
 * the box hadn't mounted yet — so the observer was never wired up. After
 * the product loaded the section stayed at opacity 0 forever, leaving a
 * tall band of empty whitespace under the description/related products. */
function useRevealOnScroll(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(true);
        },
        { threshold },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [threshold],
  );

  useEffect(
    () => () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    },
    [],
  );

  return { ref, visible };
}

const revealSx = (visible: boolean) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(24px)',
  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
});

/* ─── Skeleton ───────────────────────────────────────────────────────── */
const ProductDetailSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} animation="wave" />
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} animation="wave" />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" width={72} height={72} sx={{ borderRadius: 1 }} animation="wave" />
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" width={100} height={32} sx={{ mb: 2, borderRadius: 2 }} animation="wave" />
        <Skeleton variant="text" width="80%" height={48} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} animation="wave" />
        <Skeleton variant="text" width="50%" height={40} sx={{ mb: 3 }} animation="wave" />
        <Skeleton variant="rectangular" height={1} sx={{ mb: 3 }} animation="wave" />
        <Skeleton variant="text" width="100%" height={20} animation="wave" />
        <Skeleton variant="text" width="90%" height={20} animation="wave" />
        <Skeleton variant="text" width="70%" height={20} sx={{ mb: 3 }} animation="wave" />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} animation="wave" />
      </Grid>
    </Grid>
  </Container>
);

/* ─── Trust Badge component ──────────────────────────────────────────── */
interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}
const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, label }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
    flex: '1 1 0',
    minWidth: 80,
    textAlign: 'center',
  }}>
    <Box sx={{ color: 'secondary.main', fontSize: 28, display: 'flex' }}>{icon}</Box>
    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ lineHeight: 1.2 }}>
      {label}
    </Typography>
  </Box>
);

/* ─── Tab panel ──────────────────────────────────────────────────────── */
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} id={`product-tabpanel-${index}`} aria-labelledby={`product-tab-${index}`}>
    {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
  </Box>
);

/* ─── Description parser ─────────────────────────────────────────────
 * Parses a free-form product description into scannable bullet points.
 * Rules:
 * - Explicit newlines or existing `-` / `•` / `*` markers win.
 * - Otherwise fall back to sentence splitting so a single paragraph still
 *   renders as a structured list.
 * Short fragments (< 3 chars) are dropped to avoid stray "a." bullets.
 */
function parseDescriptionBullets(raw: string): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  const explicit = trimmed
    .split(/\r?\n|(?:^|\s)[-•*]\s+/gm)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter((s) => s.length > 2);
  if (explicit.length > 1) return explicit;
  // Sentence split: ". ", "! ", "? " — keeping things simple and punctuation-safe.
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z(\"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return sentences.length > 0 ? sentences : [trimmed];
}

/* ─── Relative date helper ───────────────────────────────────────────── */
function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < day) return 'today';
  if (diff < day * 2) return 'yesterday';
  if (diff < day * 30) return `${Math.floor(diff / day)} days ago`;
  if (diff < day * 365) return `${Math.floor(diff / (day * 30))} months ago`;
  return `${Math.floor(diff / (day * 365))} years ago`;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Main Component                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */
const ProductDetailPage: React.FC = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // The route param is called `slug`, but legacy /products/<numeric-id>
  // links (e.g. from emails or cart items keyed by productId) still resolve
  // here. Detect that case so we can fetch by id and then redirect the URL
  // to the canonical slug — the SPA equivalent of a 301 redirect.
  const paramIsNumericId = !!slugParam && /^\d+$/.test(slugParam);

  const { selectedProduct: product, products } = useAppSelector((s) => s.products);
  const { user } = useAppSelector((s) => s.auth);
  const { addingProductIds } = useAppSelector((s) => s.cart);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);

  /* Reviews + summary loaded from the backend; null until the API resolves. */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isAdding = product ? addingProductIds.includes(product.id) : false;

  /* Fetch product + related products */
  useEffect(() => {
    if (slugParam) {
      if (paramIsNumericId) {
        dispatch(fetchProductById(Number(slugParam)));
      } else {
        dispatch(fetchProductBySlug(slugParam));
      }
      setSelectedImageIdx(0);
      setQuantity(1);
      setTabValue(0);
    }
    return () => { dispatch(clearSelectedProduct()); };
  }, [dispatch, slugParam, paramIsNumericId]);

  /* 301-equivalent: once the product loads after a numeric-id lookup,
     rewrite the URL to the canonical /products/:slug form so shared
     links, bookmarks and the back button all use the stable slug. */
  useEffect(() => {
    if (paramIsNumericId && product?.slug) {
      navigate(`/products/${product.slug}`, { replace: true });
    }
  }, [paramIsNumericId, product?.slug, navigate]);

  useEffect(() => {
    if (product) {
      dispatch(fetchProducts({ page: 0, size: 12 }));
    }
  }, [dispatch, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Pull real reviews + aggregated rating + recent-buyer count from backend.
     Keyed on the resolved product's numeric id (not the URL param) so this
     works for both slug and legacy numeric lookups. */
  useEffect(() => {
    const productId = product?.id;
    if (!productId) return;
    let cancelled = false;
    setReviewsLoading(true);
    Promise.all([reviewApi.list(productId, 0, 6), reviewApi.summary(productId)])
      .then(([listRes, sumRes]) => {
        if (cancelled) return;
        setReviews(listRes.data.data?.content ?? []);
        setReviewSummary(sumRes.data.data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setReviews([]);
        setReviewSummary(null);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [product?.id]);

  /* Sticky CTA observer */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  /* Image gallery helpers */
  const orderedImages = product?.images ?? [];
  const galleryImages = orderedImages.length > 0
    ? orderedImages
    : product?.imageUrl
      ? [{ id: -1, imageUrl: product.imageUrl, publicId: '', isMain: true, displayOrder: 0 }]
      : [];
  const safeIdx = Math.min(selectedImageIdx, Math.max(galleryImages.length - 1, 0));
  const activeImage = galleryImages[safeIdx];
  const primaryImageSource = activeImage?.imageUrl || product?.mainImageUrl || product?.imageUrl || '';

  /* Zoom handlers */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  /* Add to cart */
  const handleAddToCart = useCallback(() => {
    if (!user) { navigate('/login'); return; }
    if (isAdding || !product) return;

    dispatch(optimisticAddToCart({
      productId: product.id,
      productName: product.name,
      productImageUrl: primaryImageSource,
      productPrice: product.price,
      productDiscountPrice: product.discountPrice,
      quantity,
    }));

    if (imageRef.current) {
      triggerFlyToCart(primaryImageSource || PRODUCT_PLACEHOLDER_IMAGE, imageRef.current);
    }

    dispatch(addToCart({ productId: product.id, quantity })).then((result) => {
      if (addToCart.fulfilled.match(result)) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    });
  }, [user, isAdding, product, primaryImageSource, quantity, navigate, dispatch, triggerFlyToCart]);

  /* Buy now */
  const handleBuyNow = useCallback(() => {
    if (!user) { navigate('/login'); return; }
    if (isAdding || !product) return;

    dispatch(optimisticAddToCart({
      productId: product.id,
      productName: product.name,
      productImageUrl: primaryImageSource,
      productPrice: product.price,
      productDiscountPrice: product.discountPrice,
      quantity,
    }));

    dispatch(addToCart({ productId: product.id, quantity })).then((result) => {
      if (addToCart.fulfilled.match(result)) {
        navigate('/cart');
      }
    });
  }, [user, isAdding, product, primaryImageSource, quantity, navigate, dispatch]);

  /* Lightbox navigation */
  const lightboxPrev = () => setSelectedImageIdx((i) => (i > 0 ? i - 1 : galleryImages.length - 1));
  const lightboxNext = () => setSelectedImageIdx((i) => (i < galleryImages.length - 1 ? i + 1 : 0));

  /* Scroll-reveal refs */
  const trustReveal = useRevealOnScroll();
  const tabsReveal = useRevealOnScroll();
  const reviewsReveal = useRevealOnScroll();
  const relatedReveal = useRevealOnScroll();

  // Only show the skeleton when we genuinely have no product yet. Previously
  // any subsequent dispatch (e.g. fetching related products) would flip
  // `loading` back to true and revert the page to a skeleton, producing a
  // visible flash and an empty band of whitespace below the fold.
  if (!product) return <ProductDetailSkeleton />;

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.price;

  // Parsed bullet points rendered inside the "Description" tab.
  const descriptionBullets = parseDescriptionBullets(product.description);

  // Rows rendered inside the "Additional Information" card grid. Optional
  // fields are suppressed so the section only surfaces what the backend
  // actually has for this product.
  const additionalInfoRows: Array<{ label: string; value: string }> = [];
  if (product.weight || product.unit) {
    additionalInfoRows.push({
      label: 'Weight',
      value: [product.weight, product.unit].filter(Boolean).join(' '),
    });
  }
  if (product.categoryName) {
    additionalInfoRows.push({ label: 'Category', value: product.categoryName });
  }
  if (product.shelfLife) {
    additionalInfoRows.push({ label: 'Shelf Life', value: product.shelfLife });
  }
  if (typeof product.stock === 'number') {
    additionalInfoRows.push({
      label: 'Availability',
      value: product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock',
    });
  }

  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 8);
  const hasRating = !!reviewSummary && reviewSummary.totalReviews > 0;
  const hasNutrition = !!product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0;
  const hasHowToUse = !!product.howToUse && product.howToUse.length > 0;
  const hasStorageTips = !!product.storageTips && product.storageTips.length > 0;
  const hasUsageTab = hasHowToUse || hasStorageTips;
  // Tabs are dynamic: every tab below corresponds to a `tabKeys` entry. We
  // skip Nutrition/How-to-Use entirely when the backend has no data for the
  // current product, which keeps `tabValue` from pointing at a missing panel.
  const tabKeys: Array<'description' | 'nutrition' | 'usage'> = ['description'];
  if (hasNutrition) tabKeys.push('nutrition');
  if (hasUsageTab) tabKeys.push('usage');
  const safeTabValue = Math.min(tabValue, tabKeys.length - 1);

  return (
    <PageTransition>
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: 0 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/products" underline="hover" color="inherit">Products</MuiLink>
          <Typography color="text.primary" fontWeight={500}>{product.name}</Typography>
        </Breadcrumbs>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 2, md: 3 } }}>
        {/* ── Main 2-col layout ─────────────────────────────────────── */}
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
          {/* LEFT: Image gallery */}
          <Grid item xs={12} md={6}>
            {/* Main image with zoom */}
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#F5F5F0',
                position: 'relative',
                cursor: 'zoom-in',
                '&:hover .zoom-hint': { opacity: isZooming ? 0 : 1 },
              }}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setLightboxOpen(true)}
            >
              <Box
                component="img"
                ref={imageRef}
                src={withCloudinaryTransform(primaryImageSource, 'w_800,c_limit,q_auto,f_auto') || PRODUCT_PLACEHOLDER_IMAGE}
                srcSet={cloudinarySrcSet(primaryImageSource) || undefined}
                sizes="(max-width: 900px) 100vw, 600px"
                width={800}
                height={520}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 520,
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.3s ease, opacity 0.3s ease',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transform: isZooming ? 'scale(1.5)' : 'scale(1)',
                }}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <Box
                className="zoom-hint"
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none',
                }}
              >
                <ZoomIn fontSize="small" />
                <Typography variant="caption">Click to expand</Typography>
              </Box>
            </Box>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {galleryImages.map((img, idx) => (
                  <Box
                    key={img.id ?? idx}
                    component="img"
                    src={withCloudinaryTransform(img.imageUrl, 'w_120,h_120,c_fill,q_auto,f_auto')}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    onClick={() => setSelectedImageIdx(idx)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View image ${idx + 1}`}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') setSelectedImageIdx(idx); }}
                    sx={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: idx === safeIdx ? 'primary.main' : 'transparent',
                      transition: 'border-color 0.2s ease, transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.05)', borderColor: 'primary.light' },
                    }}
                  />
                ))}
              </Box>
            )}
          </Grid>

          {/* RIGHT: Product info */}
          <Grid item xs={12} md={6}>
            <Chip
              label={product.categoryName}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 1.5 }}
            />

            {/* Product name — prominent */}
            <Typography
              variant="h3"
              component="h1"
              sx={{
                mb: 1,
                fontWeight: 700,
                fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem' },
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </Typography>

            {/* Rating — only rendered once we have at least one real review */}
            {hasRating && reviewSummary && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Rating value={reviewSummary.averageRating} precision={0.5} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({reviewSummary.averageRating.toFixed(1)}) · {reviewSummary.totalReviews}
                  {' '}{reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            )}

            {/* Weight display */}
            {(product.weight || product.unit) && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {product.weight} {product.unit}
              </Typography>
            )}

            {/* Price */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
              <Typography variant="h4" color="primary" fontWeight={700} sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                ₹{effectivePrice}
              </Typography>
              {hasDiscount && (
                <>
                  <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontWeight: 400 }}>
                    ₹{product.price}
                  </Typography>
                  <Chip label={`${discountPercent}% OFF`} color="error" size="small" sx={{ fontWeight: 600 }} />
                </>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Inclusive of all taxes
            </Typography>

            {/* Trust badges */}
            <Box ref={trustReveal.ref} sx={{ ...revealSx(trustReveal.visible) }}>
              <Box sx={{
                display: 'flex',
                gap: { xs: 1.5, sm: 2 },
                py: 2,
                px: { xs: 1, sm: 2 },
                mb: 2.5,
                bgcolor: '#FAFAF5',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
              }}>
                <TrustBadge icon={<VerifiedUser />} label="100% Natural" />
                <TrustBadge icon={<LocalShipping />} label="Free Shipping ₹499+" />
                <TrustBadge icon={<Inventory />} label="Fresh Stock" />
                <TrustBadge icon={<Lock />} label="Secure Payment" />
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Quantity selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body1" fontWeight={600}>Quantity:</Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                border: '2px solid',
                borderColor: 'primary.light',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <IconButton
                  size="small"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  sx={{
                    borderRadius: 0,
                    px: 1.5,
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.main', color: '#fff' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Remove fontSize="small" />
                </IconButton>
                <Typography sx={{
                  px: 2.5,
                  fontWeight: 700,
                  minWidth: 40,
                  textAlign: 'center',
                  userSelect: 'none',
                }}>
                  {quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                  sx={{
                    borderRadius: 0,
                    px: 1.5,
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.main', color: '#fff' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                ({product.stock} in stock)
              </Typography>
            </Box>

            {/* CTA buttons */}
            <Box ref={ctaRef}>
              {(!user || user.role !== 'ADMIN') && (
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={
                      isAdding ? <CircularProgress size={20} color="inherit" /> :
                      justAdded ? <Check /> : <ShoppingCart />
                    }
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || isAdding}
                    color={justAdded ? 'success' : 'primary'}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.3s ease',
                      '&:hover': { transform: 'translateY(-1px)' },
                      '&:active': { transform: 'scale(0.97)' },
                    }}
                  >
                    {product.stock === 0 ? 'Out of Stock' :
                     isAdding ? 'Adding...' :
                     justAdded ? 'Added to Cart!' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<FlashOn />}
                    onClick={handleBuyNow}
                    disabled={product.stock === 0 || isAdding}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-1px)' },
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    Buy Now
                  </Button>
                </Box>
              )}
            </Box>

            {/* Social-proof nudge — only when real recent-buyer data exists */}
            {reviewSummary && reviewSummary.recentBuyersCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
                <Star sx={{ color: '#F59E0B', fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {reviewSummary.recentBuyersCount}
                  {' '}{reviewSummary.recentBuyersCount === 1 ? 'person bought' : 'people bought'}
                  {' '}this in the last 7 days
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* ── Tabbed description ── each tab is rendered only when the
             backend actually has data for it. With nothing to show beyond
             the description, the row is suppressed entirely so we don't
             reserve empty layout below the fold. */}
        {(tabKeys.length > 1 || product.description) && (
          <Box ref={tabsReveal.ref} sx={{ mt: { xs: 4, md: 5 }, ...revealSx(tabsReveal.visible) }}>
            <Tabs
              value={safeTabValue}
              onChange={(_, v) => setTabValue(v)}
              variant={isMobile ? 'fullWidth' : 'standard'}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { fontWeight: 600, minHeight: 56 },
              }}
            >
              {tabKeys.map((key, idx) => {
                const meta = key === 'description'
                  ? { icon: <DescriptionIcon />, label: 'Description' }
                  : key === 'nutrition'
                    ? { icon: <Restaurant />, label: 'Nutritional Info' }
                    : { icon: <Kitchen />, label: 'How to Use' };
                return (
                  <Tab
                    key={key}
                    icon={meta.icon}
                    iconPosition="start"
                    label={meta.label}
                    id={`product-tab-${idx}`}
                    aria-controls={`product-tabpanel-${idx}`}
                  />
                );
              })}
            </Tabs>

            {tabKeys.map((key, idx) => (
              <TabPanel key={key} value={safeTabValue} index={idx}>
                {key === 'description' && (
                  <>
                    {/* Render the full product description verbatim —
                        pre-wrap keeps intentional line breaks and lists
                        that came back from the API. */}
                    <Typography
                      variant="body1"
                      sx={{ lineHeight: 1.8, color: 'text.primary', whiteSpace: 'pre-wrap' }}
                    >
                      {product.description}
                    </Typography>

                    {/* Additional scannable bullet list shown only when the
                        description cleanly parses into multiple bullet-style
                        sentences — supplements the raw text, never replaces it. */}
                    {descriptionBullets.length > 1 && (
                      <Box
                        component="ul"
                        sx={{
                          listStyle: 'none',
                          p: 0,
                          mt: 3,
                          mb: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.25,
                        }}
                      >
                        {descriptionBullets.map((point, i) => (
                          <Box
                            key={i}
                            component="li"
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.25,
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: '#FAFAF5',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'background-color 0.2s',
                              '&:hover': { bgcolor: '#F4F1E6' },
                            }}
                          >
                            <CheckCircle
                              fontSize="small"
                              sx={{ color: 'secondary.main', mt: '3px', flexShrink: 0 }}
                            />
                            <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                              {point}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Additional Information ── surfaces weight/dimensions/
                        shelf-life/category/stock metadata as a clean card grid. */}
                    {additionalInfoRows.length > 0 && (
                      <Box sx={{ mt: 4 }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            mb: 2,
                            fontFamily: '"Playfair Display", serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <DescriptionIcon fontSize="small" color="primary" />
                          Additional Information
                        </Typography>
                        <Grid container spacing={1.5}>
                          {additionalInfoRows.map(({ label, value }) => (
                            <Grid item xs={12} sm={6} key={label}>
                              <Box
                                sx={{
                                  p: 1.75,
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: '#fff',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                  {label}
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ textAlign: 'right' }}>
                                  {value}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </>
                )}

                {key === 'nutrition' && product.nutritionalInfo && (
                  <>
                    <Grid container spacing={2}>
                      {Object.entries(product.nutritionalInfo).map(([label, value]) => (
                        <Grid item xs={6} sm={4} key={label}>
                          <Box sx={{
                            p: 2,
                            bgcolor: '#FAFAF5',
                            borderRadius: 2,
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                            <Typography variant="body2" color="text.secondary">{label}</Typography>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main">{value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      * Values per 100g serving. Refer to product packaging for exact details.
                    </Typography>
                  </>
                )}

                {key === 'usage' && (
                  <>
                    {hasHowToUse && product.howToUse && (
                      <Box component="ul" sx={{ pl: 2.5, '& li': { mb: 1 } }}>
                        {product.howToUse.map((line, i) => (
                          <li key={i}><Typography variant="body1">{line}</Typography></li>
                        ))}
                      </Box>
                    )}
                    {hasStorageTips && product.storageTips && (
                      <>
                        {hasHowToUse && <Divider sx={{ my: 2 }} />}
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Storage Tips</Typography>
                        <Box component="ul" sx={{ pl: 2.5, '& li': { mb: 1 } }}>
                          {product.storageTips.map((line, i) => (
                            <li key={i}><Typography variant="body2">{line}</Typography></li>
                          ))}
                        </Box>
                      </>
                    )}
                  </>
                )}
              </TabPanel>
            ))}
          </Box>
        )}

        {/* ── Reviews section ── hidden when there are zero reviews so we
             don't render an empty header floating above the related-products
             carousel. */}
        {!reviewsLoading && reviews.length > 0 && reviewSummary && (
          <Box ref={reviewsReveal.ref} sx={{ mt: { xs: 4, md: 5 }, ...revealSx(reviewsReveal.visible) }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Customer Reviews</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {reviewSummary.averageRating.toFixed(1)}
              </Typography>
              <Box>
                <Rating value={reviewSummary.averageRating} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary">
                  Based on {reviewSummary.totalReviews}
                  {' '}{reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={3}>
              {reviews.map((review) => (
                <Grid item xs={12} sm={6} md={4} key={review.id}>
                  <Box sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%',
                    bgcolor: 'background.paper',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
                  }}>
                    <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                    {review.text && (
                      <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6, fontStyle: 'italic' }}>
                        &ldquo;{review.text}&rdquo;
                      </Typography>
                    )}
                    <Typography variant="caption" fontWeight={600}>{review.authorName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      · {formatRelativeDate(review.createdAt)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ── You may also like ───────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <Box ref={relatedReveal.ref} sx={{ mt: { xs: 4, md: 5 }, ...revealSx(relatedReveal.visible) }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>You May Also Like</Typography>
            <Box sx={{
              display: 'flex',
              gap: 2.5,
              overflowX: 'auto',
              pb: 2,
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.light', borderRadius: 3 },
            }}>
              {relatedProducts.map((rp) => (
                <Box
                  key={rp.id}
                  sx={{
                    minWidth: { xs: 260, sm: 280 },
                    maxWidth: 300,
                    scrollSnapAlign: 'start',
                    flexShrink: 0,
                  }}
                >
                  <ProductCard product={rp} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>

      {/* ── Lightbox dialog ─────────────────────────────────────────── */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(0,0,0,0.95)', boxShadow: 'none', m: { xs: 1, md: 2 } },
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: { xs: '60vh', md: '80vh' } }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}
          >
            <Close />
          </IconButton>
          {galleryImages.length > 1 && (
            <>
              <IconButton
                onClick={lightboxPrev}
                aria-label="Previous image"
                sx={{ position: 'absolute', left: 8, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <ChevronLeft fontSize="large" />
              </IconButton>
              <IconButton
                onClick={lightboxNext}
                aria-label="Next image"
                sx={{ position: 'absolute', right: 8, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <ChevronRight fontSize="large" />
              </IconButton>
            </>
          )}
          <Box
            component="img"
            src={withCloudinaryTransform(primaryImageSource, 'w_1600,c_limit,q_auto,f_auto') || PRODUCT_PLACEHOLDER_IMAGE}
            alt={product.name}
            decoding="async"
            sx={{
              maxWidth: '90%',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
          {galleryImages.length > 1 && (
            <Box sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
            }}>
              {galleryImages.map((_, idx) => (
                <Box
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: idx === safeIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Dialog>

      {/* ── Sticky mobile CTA ───────────────────────────────────────── */}
      {isTablet && (!user || user.role !== 'ADMIN') && (
        <Slide direction="up" in={stickyVisible} mountOnEnter unmountOnExit>
          <Box sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{product.name}</Typography>
              <Typography variant="subtitle1" color="primary" fontWeight={700}>₹{effectivePrice}</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={isAdding ? <CircularProgress size={18} color="inherit" /> : justAdded ? <Check /> : <ShoppingCart />}
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              color={justAdded ? 'success' : 'primary'}
              sx={{ whiteSpace: 'nowrap', fontWeight: 700, px: 3 }}
            >
              {product.stock === 0 ? 'Out of Stock' : justAdded ? 'Added!' : 'Add to Cart'}
            </Button>
          </Box>
        </Slide>
      )}
    </PageTransition>
  );
};

export default ProductDetailPage;
