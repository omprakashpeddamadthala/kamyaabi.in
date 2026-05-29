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
} from '@mui/material';
import { ShoppingCart, Check } from '@mui/icons-material';
import { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { addToCart, optimisticAddToCart } from '../../features/cart/cartSlice';
import { useFlyToCart } from './FlyToCartAnimation';
import { withCloudinaryTransform } from '../../utils/cloudinary';
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
  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const [justAdded, setJustAdded] = React.useState(false);
  const [ratingInfo, setRatingInfo] = useState<{ avg: number; count: number } | null>(null);

  const isAdding = addingProductIds.includes(product.id);

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

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
    return 'Add to Cart';
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
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
        '&:hover .product-card-image': {
          transform: 'scale(1.05)',
        },
      }}
      onClick={() => navigate(`/products/${product.slug ?? product.id}`)}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          ref={imageRef}
          className="product-card-image"
          image={cardImageUrl || PRODUCT_PLACEHOLDER_IMAGE}
          alt={product.name}
          sx={{
            objectFit: 'cover',
            aspectRatio: '1/1',
            width: '100%',
            transition: 'transform 0.3s ease',
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
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 22,
              bgcolor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
        {hasDiscount && (
          <Chip
            label={`${discountPercent}% OFF`}
            color="error"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 600, fontSize: '0.65rem', height: 22 }}
          />
        )}
      </Box>
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1.25, sm: 2 },
          '&:last-child': { pb: { xs: 1.25, sm: 2 } },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: compact
              ? { xs: '0.78rem', sm: '0.82rem' }
              : { xs: '0.85rem', sm: '0.95rem' },
            fontWeight: 600,
            mb: 0.5,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Typography>

        {ratingInfo && ratingInfo.count > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Rating value={ratingInfo.avg} precision={0.5} readOnly size="small" sx={{ fontSize: '0.9rem' }} />
            <Typography variant="caption" color="text.secondary">({ratingInfo.count})</Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.75,
            mt: 'auto',
            mb: 1.5,
          }}
        >
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ fontSize: compact ? { xs: '0.9rem', sm: '0.95rem' } : { xs: '1rem', sm: '1.1rem' } }}>
            ₹{hasDiscount ? product.discountPrice : product.price}
          </Typography>
          {hasDiscount && (
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.8rem' }}
            >
              ₹{product.price}
            </Typography>
          )}
        </Box>
        {(!user || user.role !== 'ADMIN') && (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={getButtonIcon()}
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              color={justAdded ? 'success' : 'primary'}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: compact ? '0.7rem' : '0.75rem',
                py: 0.5,
                px: 2,
                width: '100%',
                maxWidth: compact ? 200 : 240,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.3s ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              {getButtonContent()}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductCard);
