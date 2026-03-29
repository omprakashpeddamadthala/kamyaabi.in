import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { addToCart } from '../../features/cart/cartSlice';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice !== product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
  };

  return (
    <Card
      sx={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="220"
          image={product.imageUrl || 'https://via.placeholder.com/300x220?text=Product'}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
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
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
