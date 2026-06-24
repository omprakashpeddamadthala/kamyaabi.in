import React, { useEffect } from 'react';
import Seo from '../components/common/Seo';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Button,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  Delete,
  FavoriteBorder,
  ShoppingCart,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchWishlist, removeFromWishlist } from '../features/wishlist/wishlistSlice';
import { addToCart, optimisticAddToCart } from '../features/cart/cartSlice';
import PageTransition from '../components/common/PageTransition';
import { withCloudinaryTransform } from '../utils/cloudinary';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../config/images';
import type { WishlistItem } from '../types';

const WishlistSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={200} height={48} sx={{ mb: 4 }} animation="wave" />
    <Grid container spacing={3}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Card sx={{ '&:hover': { transform: 'none' } }}>
            <Skeleton variant="rectangular" height={200} animation="wave" />
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" width="80%" height={24} animation="wave" />
              <Skeleton variant="text" width="40%" height={20} animation="wave" />
              <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 1 }} animation="wave" />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
);

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (productId: number) => void;
  onAddToCart: (item: WishlistItem) => void;
  addingProductIds: number[];
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
  item,
  onRemove,
  onAddToCart,
  addingProductIds,
}) => {
  const navigate = useNavigate();
  const isAdding = addingProductIds.includes(item.productId);
  const hasDiscount =
    item.productDiscountPrice !== null &&
    item.productDiscountPrice > 0 &&
    item.productDiscountPrice < item.productPrice;

  const imageUrl = withCloudinaryTransform(item.productImageUrl);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--color-surface-card)',
        border: '1px solid rgba(29, 78, 216,0.10)',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 'var(--shadow-hover)',
        },
      }}
    >
      <Box sx={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => navigate(`/products/${item.productSlug ?? item.productId}`)}
      >
        <CardMedia
          component="img"
          image={imageUrl || PRODUCT_PLACEHOLDER_IMAGE}
          alt={item.productName}
          sx={{ height: 200, objectFit: 'cover' }}
        />
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.productId);
          }}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)', color: 'error.main' },
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
        {!item.inStock && (
          <Chip
            label="Out of Stock"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
            }}
          />
        )}
      </Box>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            mb: 0.5,
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onClick={() => navigate(`/products/${item.productSlug ?? item.productId}`)}
        >
          {item.productName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>
            ₹{hasDiscount ? item.productDiscountPrice : item.productPrice}
          </Typography>
          {hasDiscount && (
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: 'var(--color-text-secondary)' }}
            >
              ₹{item.productPrice}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<ShoppingCart sx={{ fontSize: 16 }} />}
            disabled={!item.inStock || isAdding}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(item);
            }}
            sx={{
              bgcolor: 'var(--color-brand-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: 'var(--color-brand-dark)' },
            }}
          >
            {isAdding ? 'Adding...' : item.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

const WishlistPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { wishlist, loading } = useAppSelector((state) => state.wishlist);
  const { addingProductIds } = useAppSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (productId: number) => {
    dispatch(removeFromWishlist(productId));
  };

  const handleAddToCart = (item: WishlistItem) => {
    dispatch(
      optimisticAddToCart({
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        productPrice: item.productPrice,
        productDiscountPrice: item.productDiscountPrice,
        quantity: 1,
      }),
    );
    dispatch(addToCart({ productId: item.productId, quantity: 1 }));
  };

  if (loading && !wishlist) {
    return <WishlistSkeleton />;
  }

  const items = wishlist?.items ?? [];

  return (
    <PageTransition>
      {/* GSC FIX: account wishlist is private — noindex. */}
      <Seo title="My Wishlist" noindex />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: 'var(--color-text-primary)', mb: 4, fontFamily: 'var(--font-primary)' }}
        >
          My Wishlist
          {items.length > 0 && (
            <Typography component="span" variant="body1" sx={{ ml: 1.5, color: 'var(--color-text-secondary)' }}>
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </Typography>
          )}
        </Typography>

        {items.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 10,
              bgcolor: 'var(--color-surface-card)',
              borderRadius: 3,
              border: '1px solid rgba(29, 78, 216,0.08)',
            }}
          >
            <FavoriteBorder sx={{ fontSize: 48, color: 'var(--color-text-secondary)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', mb: 1 }}>
              Your wishlist is empty
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 3 }}>
              Browse our products and add your favourites here.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/products')}
              sx={{
                bgcolor: 'var(--color-brand-primary)',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                px: 4,
                borderRadius: 2,
                '&:hover': { bgcolor: 'var(--color-brand-dark)' },
              }}
            >
              Browse Products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.id}>
                <WishlistItemCard
                  item={item}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  addingProductIds={addingProductIds}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </PageTransition>
  );
};

export default WishlistPage;
