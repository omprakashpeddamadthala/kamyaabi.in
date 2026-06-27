import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Tab,
  Tabs,
  Rating,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Link as MuiLink,
  Breadcrumbs,
} from '@mui/material';
import {
  ShoppingCart,
  Check,
  CheckCircle,
  Star,
  NavigateNext,
  Restaurant,
  Kitchen,
  Description as DescriptionIcon,
  FlashOn,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
  StorefrontOutlined,
  ShieldOutlined,
  KeyboardArrowDown,
  HelpOutline,
  LocalOffer,
  RateReview,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import Seo from '../components/common/Seo';
import { config } from '../config';
import { addToCart, optimisticAddToCart } from '../features/cart/cartSlice';
import { useFlyToCart } from '../components/common/useFlyToCart';
import PageTransition from '../components/common/PageTransition';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { useProductData } from '../hooks/useProductData';
import { useProductReviews } from '../hooks/useProductReviews';
import { usePincodeCheck } from '../hooks/usePincodeCheck';
import { productUrl } from '../utils/productUrl';
import { revealSx, useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { parseDescriptionBullets, parseWeightInGrams } from '../utils/productDetail';
import ProductDetailSkeleton from '../components/product/ProductDetailSkeleton';
import ProductImageGallery from '../components/product/ProductImageGallery';
import TrustBadge from '../components/product/TrustBadge';
import TabPanel from '../components/product/TabPanel';
import WishlistToggleButton from '../components/product/WishlistToggleButton';
import DeliverySection from '../components/product/DeliverySection';
import ProductReviewsTab from '../components/product/ProductReviewsTab';
import ProductFaqTab from '../components/product/ProductFaqTab';
import RelatedProductsSection from '../components/product/RelatedProductsSection';
import ImageLightboxDialog from '../components/product/ImageLightboxDialog';
import ReviewImageLightboxDialog from '../components/product/ReviewImageLightboxDialog';
import StickyAddToCartBar from '../components/product/StickyAddToCartBar';

const ProductDetailPage: React.FC = () => {
  const { slug: flatSlug, productSlug } = useParams<{ slug?: string; productSlug?: string }>();
  const slugParam = productSlug ?? flatSlug;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { product, products } = useProductData(slugParam);
  const { user } = useAppSelector((s) => s.auth);
  const { addingProductIds } = useAppSelector((s) => s.cart);
  const publicSettings = usePublicSettings();
  const showBoughtRecentlyBadge =
    publicSettings == null
      ? true
      : String(publicSettings.show_bought_recently_badge ?? 'true').toLowerCase() !== 'false';

  const reviewState = useProductReviews(product, user);
  const { reviewSummary, faqs } = reviewState;
  const pincodeState = usePincodeCheck(product, user);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isAdding = product ? addingProductIds.includes(product.id) : false;

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    setTabValue(0);
  }, [slugParam]);

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

  const trustReveal = useRevealOnScroll();
  const tabsReveal = useRevealOnScroll();

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

  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 8);
  const hasRating = !!reviewSummary && reviewSummary.totalReviews > 0;

  // GSC FIX: build per-product SEO metadata + schema.org structured data.
  const productPath = productUrl(product);
  const productAbsoluteUrl = `${config.brandSiteUrl}${productPath}`;
  const seoCanonical = product.canonicalUrl || productAbsoluteUrl;
  const plainDescription = (product.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const seoDescription = product.seoDescription
    || (plainDescription
      ? `${plainDescription.slice(0, 157)}${plainDescription.length > 157 ? '…' : ''}`
      : `Buy ${product.name} online at Kamyaabi — premium quality, freshly packed and delivered across India.`);
  const seoImage = product.ogImageUrl || product.mainImageUrl || product.imageUrl || primaryImageSource || undefined;
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: seoDescription,
    image: seoImage ? [seoImage] : undefined,
    sku: product.slug,
    category: product.categoryName || undefined,
    brand: { '@type': 'Brand', name: 'Kamyaabi' },
    offers: {
      '@type': 'Offer',
      url: productAbsoluteUrl,
      priceCurrency: 'INR',
      price: effectivePrice,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(hasRating && reviewSummary
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewSummary.averageRating.toFixed(1),
            reviewCount: reviewSummary.totalReviews,
          },
        }
      : {}),
  };
  const breadcrumbJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${config.brandSiteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${config.brandSiteUrl}/products` },
      ...(product.categoryName
        ? [{
            '@type': 'ListItem',
            position: 3,
            name: product.categoryName,
            item: `${config.brandSiteUrl}/products?category=${product.categoryId}`,
          }]
        : []),
      {
        '@type': 'ListItem',
        position: product.categoryName ? 4 : 3,
        name: product.name,
        item: productAbsoluteUrl,
      },
    ],
  };

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

  return (
    <PageTransition>
      <Seo
        title={product.seoTitle || product.name}
        description={seoDescription}
        canonicalUrl={seoCanonical}
        image={seoImage}
        type="product"
        keywords={product.seoKeywords || undefined}
        jsonLd={[productJsonLd, breadcrumbJsonLd]}
      />
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: 0 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/products" underline="hover" color="inherit">Products</MuiLink>
          {product.categoryName && (
            <MuiLink
              component={Link}
              to={`/products?category=${product.categoryId}`}
              underline="hover"
              color="inherit"
            >
              {product.categoryName}
            </MuiLink>
          )}
          <Typography color="text.primary" fontWeight={500}>{product.name}</Typography>
        </Breadcrumbs>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            <ProductImageGallery
              product={product}
              galleryImages={galleryImages}
              safeIdx={safeIdx}
              primaryImageSource={primaryImageSource}
              isZooming={isZooming}
              zoomPosition={zoomPosition}
              imageRef={imageRef}
              onSelectIdx={setSelectedImageIdx}
              onZoomChange={setIsZooming}
              onMouseMove={handleMouseMove}
              onOpenLightbox={() => setLightboxOpen(true)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    mb: 1,
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: 'var(--text-3xl)' },
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {product.name}
                </Typography>

                {hasRating && reviewSummary && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography variant="body2" fontWeight={800} sx={{ color: 'var(--color-text-primary)' }}>
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
                      sx={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}
                    >
                      ({reviewSummary.totalReviews})
                    </MuiLink>
                  </Box>
                )}

                <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.06)' }} />

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                  {hasDiscount && (
                    <Typography
                      variant="h6"
                      sx={{ color: 'var(--color-error)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.01em' }}
                    >
                      -{discountPercent}%
                    </Typography>
                  )}
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      color: 'var(--color-text-primary)',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <Box component="span" sx={{ fontSize: '0.6em', mr: 0.25, fontWeight: 700 }}>₹</Box>
                    {effectivePrice}
                  </Typography>
                  {pricePer100g != null && (
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', ml: 0.5, fontWeight: 600 }}>
                      (₹{pricePer100g}/100g)
                    </Typography>
                  )}
                </Box>

                {hasDiscount && (
                  <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', mb: 0.5, fontWeight: 500 }}>
                    M.R.P.:{' '}
                    <Box component="span" sx={{ textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                      ₹{product.price}
                    </Box>
                  </Typography>
                )}

                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', mb: 2, fontWeight: 500 }}>
                  Inclusive of all taxes
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{
                    color: inStock ? 'var(--color-success)' : 'var(--color-error)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    mb: 2,
                  }}
                >
                  {inStock ? 'In stock' : 'Out of stock'}
                </Typography>

                {product.variations && product.variations.length > 1 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Available Sizes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {product.variations.map((v) => {
                        const isSelected = v.id === product.id;
                        const vHasDiscount = v.discountPrice !== null && v.discountPrice > 0 && v.discountPrice < v.price;
                        const vPrice = vHasDiscount ? v.discountPrice : v.price;
                        const outOfStock = v.stock === 0;
                        return (
                          <Box
                            key={v.id}
                            onClick={() => {
                              if (!isSelected && v.slug) {
                                navigate(productUrl({ slug: v.slug, categorySlug: product.categorySlug }));
                              }
                            }}
                            sx={{
                              border: '2px solid',
                              borderColor: isSelected ? 'var(--color-brand-primary)' : outOfStock ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                              borderRadius: 'var(--radius-xl)',
                              px: 2.5,
                              py: 1.5,
                              cursor: outOfStock && !isSelected ? 'not-allowed' : 'pointer',
                              bgcolor: isSelected ? 'rgba(29, 78, 216, 0.05)' : outOfStock ? 'var(--color-surface-bg)' : '#fff',
                              opacity: outOfStock && !isSelected ? 0.6 : 1,
                              transition: 'all var(--transition-normal)',
                              '&:hover': {
                                borderColor: outOfStock && !isSelected ? 'rgba(0,0,0,0.05)' : 'var(--color-brand-primary)',
                                transform: outOfStock && !isSelected ? 'none' : 'translateY(-2px)',
                                boxShadow: outOfStock && !isSelected ? 'none' : '0 4px 12px rgba(29, 78, 216, 0.1)',
                              },
                              minWidth: 90,
                              textAlign: 'center',
                              position: 'relative',
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 800,
                                color: isSelected ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                                fontSize: '1.05rem',
                              }}
                            >
                              {v.weight} {v.unit}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isSelected ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              ₹{vPrice}
                            </Typography>
                            {outOfStock && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'var(--color-error)', fontWeight: 700, mt: 0.5 }}>
                                Out of stock
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {product.categoryName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Category:</Typography>
                    <MuiLink
                      component={Link}
                      to={`/products?category=${product.categoryId}`}
                      underline="hover"
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}
                    >
                      {product.categoryName}
                    </MuiLink>
                  </Box>
                )}

                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <LocalOffer sx={{ fontSize: 16, color: 'var(--color-text-muted)' }} />
                    {product.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        variant="outlined"
                        component={Link}
                        to={`/products?tag=${tag.slug}`}
                        clickable
                        sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, borderRadius: 'var(--radius-full)' }}
                      />
                    ))}
                  </Box>
                )}

                {(!user || user.role !== 'ADMIN') && (
                  <Box ref={ctaRef} sx={{ mb: 3, p: 3, bgcolor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <FormControl size="small" sx={{ mb: 2.5, minWidth: 120 }}>
                      <Select
                        id="qty-select"
                        value={String(Math.min(quantity, Math.max(product.stock, 1)))}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                        disabled={!inStock}
                        IconComponent={KeyboardArrowDown}
                        inputProps={{ 'aria-label': 'Quantity' }}
                        sx={{
                          borderRadius: 'var(--radius-full)',
                          bgcolor: '#fff',
                          fontWeight: 700,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.2)' },
                          '& .MuiSelect-select': { py: 1.25, pl: 2.5 },
                        }}
                        renderValue={(v) => `Qty: ${v}`}
                      >
                        {Array.from({ length: Math.min(Math.max(product.stock, 1), 10) }, (_, i) => i + 1).map((n) => (
                          <MenuItem key={n} value={String(n)} sx={{ fontWeight: 600 }}>{n}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Button
                        fullWidth
                        size="large"
                        onClick={handleAddToCart}
                        disabled={!inStock || isAdding}
                        startIcon={
                          isAdding ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> :
                          justAdded ? <Check /> : <ShoppingCart />
                        }
                        sx={{
                          bgcolor: justAdded ? '#10b981' : 'var(--color-brand-primary)',
                          color: '#FFFFFF',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          textTransform: 'none',
                          py: 1.5,
                          boxShadow: justAdded ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(29, 78, 216, 0.25)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: justAdded ? '#059669' : 'var(--color-brand-primary-dark)',
                            transform: 'translateY(-2px)',
                            boxShadow: justAdded ? '0 12px 24px rgba(16, 185, 129, 0.4)' : '0 12px 24px rgba(29, 78, 216, 0.35)',
                          },
                          '&:active': { transform: 'scale(0.98)' },
                          '&.Mui-disabled': {
                            bgcolor: 'rgba(0,0,0,0.05)',
                            color: 'rgba(0,0,0,0.3)',
                          },
                        }}
                      >
                        {!inStock ? 'Out of Stock' :
                         isAdding ? 'Adding...' :
                         justAdded ? 'Added to Cart!' : 'Add to Cart'}
                      </Button>

                      <Button
                        fullWidth
                        size="large"
                        onClick={handleBuyNow}
                        disabled={!inStock || isAdding}
                        startIcon={<FlashOn />}
                        sx={{
                          bgcolor: 'var(--color-brand-secondary)',
                          color: 'var(--color-surface-dark)',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          textTransform: 'none',
                          py: 1.5,
                          boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: '#d97706',
                            color: '#fff',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 24px rgba(245, 158, 11, 0.35)',
                          },
                          '&:active': { transform: 'scale(0.98)' },
                          '&.Mui-disabled': {
                            bgcolor: 'rgba(0,0,0,0.05)',
                            color: 'rgba(0,0,0,0.3)',
                          },
                        }}
                      >
                        Buy Now
                      </Button>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <WishlistToggleButton />
                    </Box>
                  </Box>
                )}

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

            <DeliverySection
              user={user}
              pincodeResult={pincodeState.pincodeResult}
              pincodeLoading={pincodeState.pincodeLoading}
              pincodeError={pincodeState.pincodeError}
              hasNoAddress={pincodeState.hasNoAddress}
            />

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
                {key === 'description' && descriptionBullets.length > 0 && (
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
                          bgcolor: 'var(--color-surface-bg)',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'background-color 0.2s',
                          '&:hover': { bgcolor: 'rgba(29, 78, 216,0.04)' },
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

                {key === 'nutrition' && product.nutritionalInfo && (
                  <>
                    <Grid container spacing={2}>
                      {Object.entries(product.nutritionalInfo).map(([label, value]) => (
                        <Grid item xs={6} sm={4} key={label}>
                          <Box sx={{
                            p: 2,
                            bgcolor: 'var(--color-surface-bg)',
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
                  <ProductReviewsTab
                    data={reviewState}
                    user={user}
                    onSelectLightboxImage={setLightboxImageUrl}
                  />
                )}

                {key === 'faq' && <ProductFaqTab faqs={faqs} />}
              </TabPanel>
            ))}
          </Box>
        )}

        <RelatedProductsSection products={relatedProducts} />
      </Container>

      <ImageLightboxDialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        galleryImages={galleryImages}
        safeIdx={safeIdx}
        productName={product.name}
        onSelectIdx={setSelectedImageIdx}
      />

      <ReviewImageLightboxDialog
        imageUrl={lightboxImageUrl}
        onClose={() => setLightboxImageUrl(null)}
      />

      {isTablet && (!user || user.role !== 'ADMIN') && (
        <StickyAddToCartBar
          show={stickyVisible}
          productName={product.name}
          price={effectivePrice}
          outOfStock={product.stock === 0}
          isAdding={isAdding}
          justAdded={justAdded}
          onAddToCart={handleAddToCart}
        />
      )}
    </PageTransition>
  );
};

export default ProductDetailPage;
