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
import { addToCart, optimisticAddToCart } from '../features/cart/cartSlice';
import { useFlyToCart } from '../components/common/useFlyToCart';
import PageTransition from '../components/common/PageTransition';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { useProductData } from '../hooks/useProductData';
import { useProductReviews } from '../hooks/useProductReviews';
import { usePincodeCheck } from '../hooks/usePincodeCheck';
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
  const { slug: slugParam } = useParams<{ slug: string }>();
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

  const lightboxPrev = () => setSelectedImageIdx((i) => (i > 0 ? i - 1 : galleryImages.length - 1));
  const lightboxNext = () => setSelectedImageIdx((i) => (i < galleryImages.length - 1 ? i + 1 : 0));

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
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: 0 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/products" underline="hover" color="inherit">Products</MuiLink>
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
                fontWeight: 600,
                fontSize: 'var(--text-3xl)',
                lineHeight: 1.3,
                fontFamily: 'var(--font-display)',
              }}
            >
              {product.name}
            </Typography>

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
                  fontSize: 'var(--text-4xl)',
                  color: '#0F1111',
                  lineHeight: 1,
                }}
              >
                <Box component="span" sx={{ fontSize: '0.55em', mr: 0.25 }}>₹</Box>
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
                            fontSize: 'var(--text-sm)',
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
                          <Typography variant="caption" sx={{ display: 'block', color: '#CC0C39', fontSize: 'var(--text-xs)' }}>
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
                    sx={{ fontSize: 'var(--text-sm)' }}
                  />
                ))}
              </Box>
            )}

            {(!user || user.role !== 'ADMIN') && (
              <Box ref={ctaRef} sx={{ mb: 2 }}>
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
                      bgcolor: 'var(--color-surface-bg)',
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
                      bgcolor: 'var(--color-brand-primary)',
                      color: '#FFFFFF',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: 'var(--text-base)',
                      textTransform: 'none',
                      py: 1.25,
                      boxShadow: '0 2px 5px rgba(213,217,217,.5)',
                      border: '1px solid var(--color-brand-primary-dark)',
                      '&:hover': {
                        bgcolor: '#1E40AF',
                        boxShadow: '0 2px 6px rgba(213,217,217,.6)',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'var(--color-surface-bg)',
                        color: '#A0A0A0',
                        border: '1px solid #E0E0E0',
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
                      color: '#0F1111',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: 'var(--text-base)',
                      textTransform: 'none',
                      py: 1.25,
                      boxShadow: '0 2px 5px rgba(213,217,217,.5)',
                      border: '1px solid #B45309',
                      '&:hover': {
                        bgcolor: '#B45309',
                        boxShadow: '0 2px 6px rgba(213,217,217,.6)',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'var(--color-surface-bg)',
                        color: '#A0A0A0',
                        border: '1px solid #E0E0E0',
                      },
                    }}
                  >
                    Buy Now
                  </Button>
                </Box>

                <WishlistToggleButton />
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
              pincode={pincodeState.pincode}
              setPincode={pincodeState.setPincode}
              pincodeResult={pincodeState.pincodeResult}
              setPincodeResult={pincodeState.setPincodeResult}
              pincodeLoading={pincodeState.pincodeLoading}
              pincodeError={pincodeState.pincodeError}
              setPincodeError={pincodeState.setPincodeError}
              hasNoAddress={pincodeState.hasNoAddress}
              onCheckPincode={pincodeState.handleCheckPincode}
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
        primaryImageSource={primaryImageSource}
        productName={product.name}
        onPrev={lightboxPrev}
        onNext={lightboxNext}
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
