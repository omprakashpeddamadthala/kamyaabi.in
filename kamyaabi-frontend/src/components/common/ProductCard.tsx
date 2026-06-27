/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves product navigation to /products/:slug-or-id, auth redirect to /login, optimistic cart update, fly-to-cart animation, and addToCart payload.
 * - Preserves existing product fields: image/mainImage, category, discountPrice, stock, variationCount, rating summary API, and review count display.
 * - Visual-only changes: tokenized card, responsive media ratio, low-stock badge, hover actions, and add-to-cart micro-interaction styling.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Rating,
  IconButton,
} from '@mui/material';
import { ShoppingCart, Check, Favorite, FavoriteBorder } from '@mui/icons-material';
import { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { addToCart, optimisticAddToCart } from '../../features/cart/cartSlice';
import { toggleWishlistItem } from '../../features/wishlist/wishlistSlice';
import { useFlyToCart } from './useFlyToCart';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { productUrl } from '../../utils/productUrl';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../../config/images';
import { reviewApi } from '../../api/reviewApi';

interface ProductCardProps {
  product: Product;
  /** Renders a smaller, more compact card (e.g. for "You May Also Like" rails). */
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { addingProductIds } = useAppSelector((state) => state.cart);
  const { productIds: wishlistProductIds, togglingProductIds } = useAppSelector((state) => state.wishlist);
  const isWishlisted = wishlistProductIds.includes(product.id);
  const isTogglingWishlist = togglingProductIds.includes(product.id);
  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const [justAdded, setJustAdded] = React.useState(false);
  const [ratingInfo, setRatingInfo] = useState<{ avg: number; count: number } | null>(null);

  const isAdding = addingProductIds.includes(product.id);

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const lowStock = product.stock > 0 && product.stock < 5;

  const cardImageSource = product.mainImageUrl || product.imageUrl || '';
  const cardImageUrl = withCloudinaryTransform(cardImageSource);

  useEffect(() => {
    let cancelled = false;
    reviewApi.summary(product.id)
      .then((res) => {
        if (!cancelled && res.data.data) {
          setRatingInfo({ avg: res.data.data.averageRating, count: res.data.data.totalReviews });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product.id]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isTogglingWishlist) return;
    dispatch(toggleWishlistItem({ productId: product.id, isInWishlist: isWishlisted }));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isAdding) return;

    dispatch(optimisticAddToCart({
      productId: product.id,
      productName: product.name,
      productImageUrl: cardImageSource,
      productPrice: product.price,
      productDiscountPrice: product.discountPrice,
      quantity: 1,
    }));

    if (imageRef.current) {
      triggerFlyToCart(
        cardImageUrl || PRODUCT_PLACEHOLDER_IMAGE,
        imageRef.current
      );
    }
    dispatch(addToCart({ productId: product.id, quantity: 1 })).then((result) => {
      if (addToCart.fulfilled.match(result)) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
      }
    });
  };

  const getButtonContent = () => {
    if (product.stock === 0) return 'Out of Stock';
    if (isAdding) return 'Adding...';
    if (justAdded) return 'Added \u2713';
    return 'Add'; // Sleeker text for premium feel
  };

  const getButtonIcon = () => {
    if (isAdding) return <CircularProgress size={16} color="inherit" />;
    if (justAdded) return <Check sx={{ fontSize: 16 }} />;
    return <ShoppingCart sx={{ fontSize: 16 }} />;
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible', // For squircle shadows to bleed out if needed
        bgcolor: 'var(--color-surface-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(29, 78, 216, 0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: 'var(--shadow-hover)',
          borderColor: 'rgba(29, 78, 216, 0.2)',
        },
        '&:hover .product-card-image': {
          transform: 'scale(1.08)',
        },
      }}
      onClick={() => navigate(productUrl(product))}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden', borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)', p: 1, pb: 0 }}>
        <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', bgcolor: 'var(--color-surface-bg)' }}>
          <CardMedia
            component="img"
            ref={imageRef}
            className="product-card-image"
            image={cardImageUrl || PRODUCT_PLACEHOLDER_IMAGE}
            alt={product.name}
            sx={{
              objectFit: 'contain',
              height: { xs: 150, sm: 200 },
              width: '100%',
              transition: 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)',
              p: 2,
            }}
            loading="lazy"
          />
          {product.categoryName && (
            <Chip
              label={product.categoryName}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                height: 22,
                bgcolor: 'rgba(255,255,255,0.85)',
                color: 'var(--color-text-secondary)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            />
          )}
          {(product.variationCount ?? 0) > 1 && (
            <Chip
              label={`${product.variationCount} Options`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 22,
                bgcolor: 'var(--color-brand-primary)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(29, 78, 216, 0.4)',
              }}
            />
          )}


          {lowStock && (
            <Chip
              label="Hurry!"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                fontWeight: 800,
                fontSize: '0.65rem',
                height: 22,
                bgcolor: '#f59e0b',
                color: '#fff',
              }}
            />
          )}
        </Box>
      </Box>
      
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          '&:last-child': { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </Typography>
          <IconButton
            onClick={handleToggleWishlist}
            size="small"
            disabled={isTogglingWishlist}
            sx={{
              mt: -0.5,
              mr: -0.5,
              color: isWishlisted ? '#ef4444' : 'var(--color-text-secondary)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            {isWishlisted ? <Favorite sx={{ fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>

        {product.weight && (
          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600, mb: 0.5 }}>
            {product.weight} {product.unit}
            {(product.variationCount ?? 0) > 1 && ` • +${(product.variationCount ?? 0) - 1} More`}
          </Typography>
        )}

        {ratingInfo && ratingInfo.count > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Rating value={ratingInfo.avg} precision={0.5} readOnly size="small" sx={{ fontSize: '1rem', color: '#f59e0b' }} />
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>({ratingInfo.count})</Typography>
          </Box>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mt: 1,
            }}
          >
            <Box>
              {hasDiscount && discountPercent > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: -0.25 }}>
                   <Typography
                    variant="body2"
                    sx={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    ₹{product.price}
                  </Typography>
                  <Typography sx={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 800 }}>
                    {discountPercent}% OFF
                  </Typography>
                </Box>
              )}
              <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: compact ? '1rem' : '1.1rem', letterSpacing: '-0.02em' }}>
                ₹{hasDiscount ? product.discountPrice : product.price}
              </Typography>
            </Box>

            {(!user || user.role !== 'ADMIN') && (
              <Button
                variant={justAdded ? "contained" : "outlined"}
                size="small"
                startIcon={getButtonIcon()}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdding}
                color={justAdded ? 'success' : 'primary'}
                className="product-card-actions"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  py: 0.5,
                  px: 2,
                  minWidth: 80,
                  height: 36,
                  borderRadius: 'var(--radius-lg)',
                  borderWidth: '2px',
                  bgcolor: justAdded ? '#10b981' : 'transparent',
                  color: justAdded ? '#fff' : 'var(--color-brand-primary)',
                  borderColor: justAdded ? '#10b981' : 'var(--color-brand-primary)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderWidth: '2px',
                    bgcolor: 'var(--color-brand-primary)',
                    color: '#fff',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                {getButtonContent()}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductCard);

