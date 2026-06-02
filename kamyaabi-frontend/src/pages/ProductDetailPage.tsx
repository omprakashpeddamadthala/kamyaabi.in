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
  Select,
  MenuItem,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Alert,
} from '@mui/material';
import {
  ShoppingCart,
  Check,
  CheckCircle,
  Close,
  Star,
  NavigateNext,
  ZoomIn,
  Restaurant,
  Kitchen,
  Description as DescriptionIcon,
  ChevronLeft,
  ChevronRight,
  FlashOn,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
  StorefrontOutlined,
  ShieldOutlined,
  KeyboardArrowDown,
  ExpandMore,
  HelpOutline,
  LocalOffer,
  RateReview,
  Delete as DeleteIcon,
  PhotoCamera,
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
import AmazonBanner from '../components/common/AmazonBanner';
import { reviewApi } from '../api/reviewApi';
import type { Review, ReviewSummary, Faq } from '../types';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';
import { usePublicSettings } from '../hooks/usePublicSettings';

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

const ProductDetailSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} animation="wave" />
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 1 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={56} height={56} sx={{ borderRadius: 1 }} animation="wave" />
            ))}
          </Box>
          <Skeleton variant="rectangular" sx={{ flex: 1, height: 460, borderRadius: 2 }} animation="wave" />
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="90%" height={36} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} animation="wave" />
        <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} animation="wave" />
        <Skeleton variant="text" width="100%" height={20} animation="wave" />
        <Skeleton variant="text" width="95%" height={20} animation="wave" />
        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 3 }} animation="wave" />
      </Grid>
      <Grid item xs={12} md={3}>
        <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 2 }} animation="wave" />
      </Grid>
    </Grid>
  </Container>
);

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

function parseDescriptionBullets(raw: string): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  const explicit = trimmed
    .split(/\r?\n|(?:^|\s)[-•*]\s+/gm)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter((s) => s.length > 2);
  if (explicit.length > 1) return explicit;
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z(\"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return sentences.length > 0 ? sentences : [trimmed];
}

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

function parseWeightInGrams(weight: string | undefined, unit: string | undefined): number | null {
  if (!weight) return null;
  const num = parseFloat(String(weight).replace(/[^\d.]/g, ''));
  if (!isFinite(num) || num <= 0) return null;
  const u = (unit || '').toLowerCase().trim();
  if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(u)) return num * 1000;
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(u) || u === '') return num;
  return null;
}

const ProductDetailPage: React.FC = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const paramIsNumericId = !!slugParam && /^\d+$/.test(slugParam);

  const { selectedProduct: product, products } = useAppSelector((s) => s.products);
  const { user } = useAppSelector((s) => s.auth);
  const { addingProductIds } = useAppSelector((s) => s.cart);
  const publicSettings = usePublicSettings();
  const showBoughtRecentlyBadge =
    publicSettings == null
      ? true
      : String(publicSettings.show_bought_recently_badge ?? 'true').toLowerCase() !== 'false';

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  // Review form state
  const [reviewFormRating, setReviewFormRating] = useState<number | null>(null);
  const [reviewFormTitle, setReviewFormTitle] = useState('');
  const [reviewFormText, setReviewFormText] = useState('');
  const [reviewFormImages, setReviewFormImages] = useState<File[]>([]);
  const [reviewFormSubmitting, setReviewFormSubmitting] = useState(false);
  const [reviewFormError, setReviewFormError] = useState('');
  const [reviewFormSuccess, setReviewFormSuccess] = useState('');
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isAdding = product ? addingProductIds.includes(product.id) : false;

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

  useEffect(() => {
    const productId = product?.id;
    if (!productId) return;
    let cancelled = false;
    setReviewsLoading(true);
    Promise.all([reviewApi.list(productId, 0, 50), reviewApi.summary(productId)])
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

  useEffect(() => {
    const productId = product?.id;
    if (!productId) return;
    let cancelled = false;
    reviewApi.getFaqs(productId)
      .then((res) => { if (!cancelled) setFaqs(res.data.data ?? []); })
      .catch(() => { if (!cancelled) setFaqs([]); });
    return () => { cancelled = true; };
  }, [product?.id]);

  const userAlreadyReviewed = user && reviews.some((r) => r.userId === user.id);

  const handleReviewSubmit = async () => {
    if (!product || !user) return;
    if (!reviewFormRating) { setReviewFormError('Please select a rating'); return; }
    if (reviewFormText.length < 20) { setReviewFormError('Review text must be at least 20 characters'); return; }
    setReviewFormError('');
    setReviewFormSubmitting(true);
    try {
      const res = await reviewApi.create(product.id, {
        rating: reviewFormRating,
        title: reviewFormTitle || undefined,
        text: reviewFormText,
      }, reviewFormImages.length > 0 ? reviewFormImages : undefined);
      setReviews((prev) => [res.data.data, ...prev]);
      setReviewSummary((prev) => prev ? {
        ...prev,
        totalReviews: prev.totalReviews + 1,
        averageRating: Math.round(((prev.averageRating * prev.totalReviews + reviewFormRating) / (prev.totalReviews + 1)) * 10) / 10,
      } : prev);
      setReviewFormRating(null);
      setReviewFormTitle('');
      setReviewFormText('');
      setReviewFormImages([]);
      setReviewFormSuccess('Review submitted successfully!');
      setTimeout(() => setReviewFormSuccess(''), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
      setReviewFormError(msg);
    } finally {
      setReviewFormSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await reviewApi.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewSummary((prev) => prev && prev.totalReviews > 1 ? {
        ...prev,
        totalReviews: prev.totalReviews - 1,
      } : prev);
    } catch { /* silently handle */ }
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024 && /image\/(jpeg|png|webp)/.test(f.type));
    setReviewFormImages((prev) => [...prev, ...valid].slice(0, 5));
  };

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

  const orderedImages = product?.images ?? [];
  const galleryImages = orderedImages.length > 0
    ? orderedImages
    : product?.imageUrl
      ? [{ id: -1, imageUrl: product.imageUrl, publicId: '', isMain: true, displayOrder: 0 }]
      : [];
  const safeIdx = Math.min(selectedImageIdx, Math.max(galleryImages.length - 1, 0));
  const activeImage = galleryImages[safeIdx];
  const primaryImageSource = activeImage?.imageUrl || product?.mainImageUrl || product?.imageUrl || '';

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

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

  const lightboxPrev = () => setSelectedImageIdx((i) => (i > 0 ? i - 1 : galleryImages.length - 1));
  const lightboxNext = () => setSelectedImageIdx((i) => (i < galleryImages.length - 1 ? i + 1 : 0));

  const trustReveal = useRevealOnScroll();
  const tabsReveal = useRevealOnScroll();
  const reviewsReveal = useRevealOnScroll();
  const relatedReveal = useRevealOnScroll();

  if (!product) return <ProductDetailSkeleton />;

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.price;

  const weightInGrams = parseWeightInGrams(product.weight, product.unit);
  const pricePer100g = weightInGrams && weightInGrams >= 50
    ? Math.round((effectivePrice / weightInGrams) * 100)
    : null;

  const inStock = product.stock > 0;

  const descriptionBullets = parseDescriptionBullets(product.description);

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
  const tabKeys: Array<'description' | 'nutrition' | 'usage' | 'reviews' | 'faq'> = ['description'];
  if (hasNutrition) tabKeys.push('nutrition');
  if (hasUsageTab) tabKeys.push('usage');
  tabKeys.push('reviews');
  tabKeys.push('faq');
  const safeTabValue = Math.min(tabValue, tabKeys.length - 1);

  const defaultFaqs = [
    { id: -1, question: 'How fresh are the products when delivered?', answer: 'Every order is packed on demand from our climate-controlled storage and sealed in airtight, food-grade pouches. Most customers receive their order within 3–5 business days of dispatch.', displayOrder: 0 },
    { id: -2, question: 'How should I store this product?', answer: 'Keep the pack in a cool, dry place away from direct sunlight. Once opened, transfer the contents to an airtight container or reseal the pouch tightly to preserve crunch and flavor.', displayOrder: 1 },
    { id: -3, question: 'Are these dry fruits raw, roasted, or salted?', answer: 'Preparation varies by product. Refer to the Description and Additional Information sections above for the exact processing details for this specific item.', displayOrder: 2 },
    { id: -4, question: 'Do you offer returns or refunds?', answer: 'Yes. If your order arrives damaged or you are not satisfied with the quality, contact us within 7 days of delivery and we will arrange a replacement or refund as per our return policy.', displayOrder: 3 },
    { id: -5, question: 'Is the packaging vegetarian and food-safe?', answer: 'Absolutely. All Kamyaabi products are 100% vegetarian and packed in FSSAI-compliant, food-grade materials that protect freshness without any added preservatives.', displayOrder: 4 },
  ];
  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <PageTransition>
      {}
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: 0 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/products" underline="hover" color="inherit">Products</MuiLink>
          <Typography color="text.primary" fontWeight={500}>{product.name}</Typography>
        </Breadcrumbs>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 2, md: 3 } }}>
        {/* 2-column layout: Gallery | Details + Actions */}
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="flex-start">
          {/* COLUMN 1: GALLERY (vertical thumbs + main image) */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              {/* Vertical thumbnails (left on desktop, below on mobile) */}
              {galleryImages.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', md: 'column' },
                    gap: 1,
                    order: { xs: 2, md: 1 },
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                  }}
                >
                  {galleryImages.map((img, idx) => (
                    <Box
                      key={img.id ?? idx}
                      component="img"
                      src={withCloudinaryTransform(img.imageUrl, 'w_120,h_120,c_fill,q_auto,f_auto')}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      onMouseEnter={() => setSelectedImageIdx(idx)}
                      onClick={() => setSelectedImageIdx(idx)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View image ${idx + 1}`}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedImageIdx(idx);
                      }}
                      sx={{
                        width: { xs: 60, md: 56 },
                        height: { xs: 60, md: 56 },
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: idx === safeIdx ? 'primary.main' : 'divider',
                        outline: idx === safeIdx ? '2px solid' : 'none',
                        outlineColor: 'primary.main',
                        outlineOffset: 1,
                        transition: 'border-color 0.2s ease, outline 0.2s ease',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Main image */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  order: { xs: 1, md: 2 },
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
                  sizes="(max-width: 900px) 100vw, 500px"
                  width={800}
                  height={520}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 520,
                    aspectRatio: '1 / 1',
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
            </Box>
          </Grid>

          {/* COLUMN 2: PRODUCT DETAILS + ACTIONS */}
          <Grid item xs={12} md={6}>
            {/* Title */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 1,
                fontWeight: 600,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.9rem' },
                lineHeight: 1.3,
                fontFamily: '"Inter", "Roboto", sans-serif',
              }}
            >
              {product.name}
            </Typography>

            {/* Rating (only when reviews exist) */}
            {hasRating && reviewSummary && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {reviewSummary.averageRating.toFixed(1)}
                </Typography>
                <Rating
                  value={reviewSummary.averageRating}
                  precision={0.5}
                  readOnly
                  size="small"
                  sx={{ color: '#F59E0B' }}
                />
                <MuiLink
                  href="#reviews"
                  underline="hover"
                  variant="body2"
                  sx={{ color: '#007185' }}
                >
                  ({reviewSummary.totalReviews})
                </MuiLink>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Discount + Price block */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              {hasDiscount && (
                <Typography
                  variant="h6"
                  sx={{ color: '#CC0C39', fontWeight: 500, fontSize: '1.1rem' }}
                >
                  -{discountPercent}%
                </Typography>
              )}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.8rem', md: '2.1rem' },
                  color: '#0F1111',
                  lineHeight: 1,
                }}
              >
                <Box component="sup" sx={{ fontSize: '0.55em', mr: 0.25, top: '-0.7em', position: 'relative' }}>₹</Box>
                {effectivePrice}
              </Typography>
              {pricePer100g != null && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  (₹{pricePer100g}/100 g)
                </Typography>
              )}
            </Box>

            {hasDiscount && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                M.R.P.:{' '}
                <Box component="span" sx={{ textDecoration: 'line-through' }}>
                  ₹{product.price}
                </Box>
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Inclusive of all taxes
            </Typography>

            {/* Stock indicator */}
            <Typography
              variant="subtitle1"
              sx={{
                color: inStock ? '#007600' : '#CC0C39',
                fontWeight: 600,
                fontSize: '1rem',
                mb: 1.5,
              }}
            >
              {inStock ? 'In stock' : 'Out of stock'}
            </Typography>

            {/* Variation selector */}
            {product.variations && product.variations.length > 1 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#0F1111' }}>
                  Available Sizes:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {product.variations.map((v) => {
                    const isSelected = v.id === product.id;
                    const vHasDiscount = v.discountPrice !== null && v.discountPrice > 0 && v.discountPrice < v.price;
                    const vPrice = vHasDiscount ? v.discountPrice : v.price;
                    const outOfStock = v.stock === 0;
                    return (
                      <Box
                        key={v.id}
                        onClick={() => {
                          if (!isSelected && v.slug) navigate(`/products/${v.slug}`);
                        }}
                        sx={{
                          border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : outOfStock ? '#E0E0E0' : '#D5D9D9',
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          cursor: outOfStock && !isSelected ? 'not-allowed' : 'pointer',
                          bgcolor: isSelected ? 'primary.50' : outOfStock ? '#FAFAFA' : '#fff',
                          opacity: outOfStock && !isSelected ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: outOfStock && !isSelected ? '#E0E0E0' : 'primary.main',
                            boxShadow: outOfStock && !isSelected ? 'none' : '0 1px 5px rgba(0,0,0,0.1)',
                          },
                          minWidth: 80,
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'primary.main' : '#0F1111',
                            fontSize: '0.85rem',
                          }}
                        >
                          {v.weight} {v.unit}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isSelected ? 'primary.dark' : 'text.secondary',
                            fontWeight: 500,
                          }}
                        >
                          ₹{vPrice}
                        </Typography>
                        {outOfStock && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#CC0C39', fontSize: '0.65rem' }}>
                            Out of stock
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Category link */}
            {product.categoryName && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Category:</Typography>
                <MuiLink
                  component={Link}
                  to={`/products?category=${product.categoryId}`}
                  underline="hover"
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                >
                  {product.categoryName}
                </MuiLink>
              </Box>
            )}

            {/* Tag pills */}
            {product.tags && product.tags.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                <LocalOffer sx={{ fontSize: 16, color: 'text.secondary' }} />
                {product.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    variant="outlined"
                    component={Link}
                    to={`/products?tag=${tag.slug}`}
                    clickable
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            )}

            {/* Quantity + Add to Cart + Buy Now */}
            {(!user || user.role !== 'ADMIN') && (
              <Box ref={ctaRef} sx={{ mb: 2 }}>
                {/* Quantity */}
                <FormControl size="small" sx={{ mb: 2, minWidth: 180 }}>
                  <Select
                    id="qty-select"
                    value={String(Math.min(quantity, Math.max(product.stock, 1)))}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                    disabled={!inStock}
                    IconComponent={KeyboardArrowDown}
                    inputProps={{ 'aria-label': 'Quantity' }}
                    sx={{
                      borderRadius: 2,
                      bgcolor: '#F7F7F7',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D5D9D9' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888C8C' },
                      '& .MuiSelect-select': { py: 1.1, pl: 2 },
                    }}
                    renderValue={(v) => `Quantity: ${v}`}
                  >
                    {Array.from({ length: Math.min(Math.max(product.stock, 1), 10) }, (_, i) => i + 1).map((n) => (
                      <MenuItem key={n} value={String(n)}>{n}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                  {/* Add to Cart */}
                  <Button
                    fullWidth
                    size="large"
                    onClick={handleAddToCart}
                    disabled={!inStock || isAdding}
                    startIcon={
                      isAdding ? <CircularProgress size={20} sx={{ color: '#0F1111' }} /> :
                      justAdded ? <Check /> : <ShoppingCart />
                    }
                    sx={{
                      bgcolor: '#FFD814',
                      color: '#0F1111',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      py: 1.25,
                      boxShadow: '0 2px 5px rgba(213,217,217,.5)',
                      border: '1px solid #FCD200',
                      '&:hover': {
                        bgcolor: '#F7CA00',
                        boxShadow: '0 2px 6px rgba(213,217,217,.6)',
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#F7F7F7',
                        color: '#A0A0A0',
                        border: '1px solid #E0E0E0',
                      },
                    }}
                  >
                    {!inStock ? 'Out of Stock' :
                     isAdding ? 'Adding...' :
                     justAdded ? 'Added to Cart!' : 'Add to Cart'}
                  </Button>

                  {/* Buy Now */}
                  <Button
                    fullWidth
                    size="large"
                    onClick={handleBuyNow}
                    disabled={!inStock || isAdding}
                    startIcon={<FlashOn />}
                    sx={{
                      bgcolor: '#FFA41C',
                      color: '#0F1111',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      py: 1.25,
                      boxShadow: '0 2px 5px rgba(213,217,217,.5)',
                      border: '1px solid #FF8F00',
                      '&:hover': {
                        bgcolor: '#FA8900',
                        boxShadow: '0 2px 6px rgba(213,217,217,.6)',
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#F7F7F7',
                        color: '#A0A0A0',
                        border: '1px solid #E0E0E0',
                      },
                    }}
                  >
                    Buy Now
                  </Button>
                </Box>
              </Box>
            )}

            {/* Trust icons row (Free Delivery / Non-Returnable / Delivered / Secure) */}
            <Box
              ref={trustReveal.ref}
              sx={{
                display: 'flex',
                gap: 1,
                py: 1.5,
                mt: 1,
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                ...revealSx(trustReveal.visible),
              }}
            >
              <TrustBadge icon={<LocalShippingOutlined />} label="Free Delivery" />
              <TrustBadge icon={<AssignmentReturnOutlined />} label="Non-Returnable" />
              <TrustBadge icon={<StorefrontOutlined />} label="Kamyaabi Delivered" />
              <TrustBadge icon={<ShieldOutlined />} label="Secure transaction" />
            </Box>

            {/* Bought recently badge */}
            {showBoughtRecentlyBadge && reviewSummary && reviewSummary.recentBuyersCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
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

        <AmazonBanner variant="product" />

        {}
        {(tabKeys.length > 1 || product.description) && (
          <Box ref={tabsReveal.ref} sx={{ mt: { xs: 4, md: 5 }, ...revealSx(tabsReveal.visible) }}>
            <Tabs
              value={safeTabValue}
              onChange={(_, v) => setTabValue(v)}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons="auto"
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
                    : key === 'usage'
                      ? { icon: <Kitchen />, label: 'How to Use' }
                      : key === 'reviews'
                        ? { icon: <RateReview />, label: `Reviews${hasRating ? ` (${reviewSummary!.totalReviews})` : ''}` }
                        : { icon: <HelpOutline />, label: 'FAQ' };
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
                    {descriptionBullets.length > 0 && (
                      <Box
                        component="ul"
                        sx={{
                          listStyle: 'none',
                          p: 0,
                          mt: 0,
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

                    {}
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

                {key === 'reviews' && (
                  <>
                    {reviewsLoading ? (
                      <Grid container spacing={3}>
                        {[0, 1, 2].map((i) => (
                          <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} animation="wave" />
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <>
                        {hasRating && reviewSummary && (
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
                        )}

                        {reviews.length > 0 ? (
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
                                  position: 'relative',
                                }}>
                                  {user?.role === 'ADMIN' && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteReview(review.id)}
                                      sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                                      aria-label="Delete review"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Rating value={review.rating} readOnly size="small" />
                                    {review.title && (
                                      <Typography variant="subtitle2" fontWeight={600}>{review.title}</Typography>
                                    )}
                                  </Box>
                                  {review.text && (
                                    <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6, fontStyle: 'italic' }}>
                                      &ldquo;{review.text}&rdquo;
                                    </Typography>
                                  )}
                                  {review.images && review.images.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                      {review.images.map((img, imgIdx) => (
                                        <Box
                                          key={imgIdx}
                                          component="img"
                                          src={img}
                                          alt={`Review image ${imgIdx + 1}`}
                                          onClick={() => setLightboxImageUrl(img)}
                                          sx={{
                                            width: 56, height: 56, objectFit: 'cover',
                                            borderRadius: 1, cursor: 'pointer',
                                            border: '1px solid', borderColor: 'divider',
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                  <Typography variant="caption" fontWeight={600}>{review.authorName}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    · {formatRelativeDate(review.createdAt)}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Box sx={{ p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: '#FAFAF5', textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              No reviews yet. Be the first to review!
                            </Typography>
                          </Box>
                        )}

                        {/* Review submission form */}
                        <Divider sx={{ my: 4 }} />
                        {user ? (
                          userAlreadyReviewed ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                              You have already reviewed this product.
                            </Alert>
                          ) : (
                            <Box sx={{ maxWidth: 600 }}>
                              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Write a Review</Typography>
                              {reviewFormError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{reviewFormError}</Alert>}
                              {reviewFormSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{reviewFormSuccess}</Alert>}
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>Rating *</Typography>
                                <Rating
                                  value={reviewFormRating}
                                  onChange={(_, v) => setReviewFormRating(v)}
                                  size="large"
                                />
                              </Box>
                              <TextField
                                label="Title (optional)"
                                fullWidth
                                size="small"
                                value={reviewFormTitle}
                                onChange={(e) => setReviewFormTitle(e.target.value.slice(0, 100))}
                                sx={{ mb: 2 }}
                                inputProps={{ maxLength: 100 }}
                              />
                              <TextField
                                label="Your review *"
                                fullWidth
                                multiline
                                rows={4}
                                value={reviewFormText}
                                onChange={(e) => setReviewFormText(e.target.value.slice(0, 1000))}
                                sx={{ mb: 1 }}
                                helperText={`${reviewFormText.length}/1000 (min 20)`}
                                inputProps={{ maxLength: 1000 }}
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                <Button
                                  component="label"
                                  variant="outlined"
                                  size="small"
                                  startIcon={<PhotoCamera />}
                                  disabled={reviewFormImages.length >= 5}
                                >
                                  Add Images ({reviewFormImages.length}/5)
                                  <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={handleReviewImageChange} />
                                </Button>
                                {reviewFormImages.map((f, fi) => (
                                  <Chip
                                    key={fi}
                                    label={f.name.slice(0, 20)}
                                    size="small"
                                    onDelete={() => setReviewFormImages((prev) => prev.filter((_, i) => i !== fi))}
                                  />
                                ))}
                              </Box>
                              <Button
                                variant="contained"
                                onClick={handleReviewSubmit}
                                disabled={reviewFormSubmitting}
                                startIcon={reviewFormSubmitting ? <CircularProgress size={18} color="inherit" /> : <RateReview />}
                              >
                                {reviewFormSubmitting ? 'Submitting...' : 'Submit Review'}
                              </Button>
                            </Box>
                          )
                        ) : (
                          <Box sx={{ p: 3, borderRadius: 2, bgcolor: '#FAFAF5', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" color="text.secondary">
                              <MuiLink component={Link} to="/login" underline="hover" color="primary" fontWeight={600}>
                                Login
                              </MuiLink>{' '}to write a review
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </>
                )}

                {key === 'faq' && (
                  <>
                    {displayFaqs.map((item, idx) => (
                      <Accordion
                        key={item.id ?? idx}
                        disableGutters
                        square
                        sx={{
                          mb: 1.25,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          boxShadow: 'none',
                          '&::before': { display: 'none' },
                          '&.Mui-expanded': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          aria-controls={`faq-content-${idx}`}
                          id={`faq-header-${idx}`}
                          sx={{ px: 2, py: 0.5 }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>{item.question}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {item.answer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </>
                )}
              </TabPanel>
            ))}
          </Box>
        )}

        {}
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
                    minWidth: { xs: 150, sm: 180 },
                    maxWidth: { xs: 160, sm: 190 },
                    scrollSnapAlign: 'start',
                    flexShrink: 0,
                  }}
                >
                  <ProductCard product={rp} compact />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>

      {}
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

      {/* Review image lightbox */}
      <Dialog
        open={!!lightboxImageUrl}
        onClose={() => setLightboxImageUrl(null)}
        maxWidth="md"
        PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.95)', boxShadow: 'none' } }}
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <IconButton
            onClick={() => setLightboxImageUrl(null)}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }}
          >
            <Close />
          </IconButton>
          {lightboxImageUrl && (
            <Box component="img" src={lightboxImageUrl} alt="Review image" sx={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
        </Box>
      </Dialog>

      {}
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
