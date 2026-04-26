import React, { useRef } from 'react';
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
} from '@mui/material';
import { ShoppingCart, Check } from '@mui/icons-material';
import { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { addToCart, optimisticAddToCart } from '../../features/cart/cartSlice';
import { useFlyToCart } from './FlyToCartAnimation';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { addingProductIds } = useAppSelector((state) => state.cart);
  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const [justAdded, setJustAdded] = React.useState(false);

  const isAdding = addingProductIds.includes(product.id);

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    // Prevent duplicate clicks while adding
    if (isAdding) return;

    // Phase 7: Optimistic UI — update cart badge instantly before API responds
    dispatch(optimisticAddToCart({
      productId: product.id,
      productName: product.name,
      productImageUrl: product.imageUrl || '',
      productPrice: product.price,
      productDiscountPrice: product.discountPrice,
      quantity: 1,
    }));

    if (imageRef.current) {
      triggerFlyToCart(
        product.imageUrl || 'https://via.placeholder.com/50',
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
    if (isAdding) return 'Adding to cart...';
    if (justAdded) return 'Added!';
    return 'Add to Cart';
  };

  const getButtonIcon = () => {
    if (isAdding) return <CircularProgress size={18} color="inherit" />;
    if (justAdded) return <Check />;
    return <ShoppingCart />;
  };

  return (
    <Card
      sx={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          ref={imageRef}
          height="220"
          image={product.imageUrl || 'https://via.placeholder.com/300x220?text=Product'}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
          loading="lazy"
        />
        {hasDiscount && (
          <Chip
            label={`${discountPercent}% OFF`}
            color="error"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 600 }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {product.categoryName}
        </Typography>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 1 }}>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, whiteSpace: 'nowrap' }}>
          {product.weight} {product.unit}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 'auto' }}>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
            ₹{hasDiscount ? product.discountPrice : product.price}
          </Typography>
          {hasDiscount && (
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: 'text.secondary', whiteSpace: 'nowrap' }}
            >
              ₹{product.price}
            </Typography>
          )}
        </Box>
        {(!user || user.role !== 'ADMIN') && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={getButtonIcon()}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
            color={justAdded ? 'success' : 'primary'}
            sx={{
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.3s ease',
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            {getButtonContent()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductCard);
