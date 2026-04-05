import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { ShoppingCart, Add, Remove, Check } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchProductById, clearSelectedProduct } from '../features/product/productSlice';
import { addToCart } from '../features/cart/cartSlice';
import { useFlyToCart } from '../components/common/FlyToCartAnimation';
import PageTransition from '../components/common/PageTransition';

const ProductDetailSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} animation="wave" />
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} animation="wave" />
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

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProduct: product, loading } = useAppSelector((state) => state.products);
  const { user } = useAppSelector((state) => state.auth);
  const { addingProductIds } = useAppSelector((state) => state.cart);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { triggerFlyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement>(null);

  const isAdding = product ? addingProductIds.includes(product.id) : false;

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(Number(id)));
    }
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Prevent duplicate clicks while adding
    if (isAdding) return;
    if (product) {
      if (imageRef.current) {
        triggerFlyToCart(
          product.imageUrl || 'https://via.placeholder.com/50',
          imageRef.current
        );
      }
      dispatch(addToCart({ productId: product.id, quantity })).then((result) => {
        if (addToCart.fulfilled.match(result)) {
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 2000);
        }
      });
    }
  };

  if (loading || !product) return <ProductDetailSkeleton />;

  const hasDiscount = product.discountPrice !== null && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <MuiLink component={Link} to="/products" underline="hover" color="inherit">
            Products
          </MuiLink>
          <Typography color="text.primary">{product.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#F5F5F0',
              }}
            >
              <Box
                component="img"
                ref={imageRef}
                src={product.imageUrl || 'https://via.placeholder.com/600x500?text=Product'}
                alt={product.name}
                sx={{ width: '100%', height: 'auto', maxHeight: 500, objectFit: 'cover' }}
                loading="lazy"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Chip label={product.categoryName} color="primary" variant="outlined" sx={{ mb: 2 }} />

            <Typography variant="h3" sx={{ mb: 1, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              {product.name}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {product.weight} {product.unit}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h4" color="primary" fontWeight={700}>
                ₹{hasDiscount ? product.discountPrice : product.price}
              </Typography>
              {hasDiscount && (
                <>
                  <Typography
                    variant="h5"
                    sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                  >
                    ₹{product.price}
                  </Typography>
                  <Chip label={`${discountPercent}% OFF`} color="error" size="small" />
                </>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
              {product.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body1" fontWeight={600}>
                Quantity:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Remove />
                </IconButton>
                <Typography sx={{ px: 2, fontWeight: 600 }}>{quantity}</Typography>
                <IconButton
                  size="small"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  <Add />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                ({product.stock} in stock)
              </Typography>
            </Box>

            {(!user || user.role !== 'ADMIN') && (
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
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.3s ease',
                  '&:active': {
                    transform: 'scale(0.97)',
                  },
                }}
              >
                {product.stock === 0 ? 'Out of Stock' :
                 isAdding ? 'Adding to cart...' :
                 justAdded ? 'Added to Cart!' : 'Add to Cart'}
              </Button>
            )}
          </Grid>
        </Grid>
      </Container>
    </PageTransition>
  );
};

export default ProductDetailPage;
