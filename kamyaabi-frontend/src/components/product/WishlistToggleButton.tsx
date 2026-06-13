import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { toggleWishlistItem } from '../../features/wishlist/wishlistSlice';

const WishlistToggleButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { selectedProduct: product } = useAppSelector((s) => s.products);
  const { productIds: wishlistProductIds, togglingProductIds } = useAppSelector((s) => s.wishlist);

  if (!product) return null;
  const isWishlisted = wishlistProductIds.includes(product.id);
  const isToggling = togglingProductIds.includes(product.id);

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isToggling) return;
    dispatch(toggleWishlistItem({ productId: product.id, isInWishlist: isWishlisted }));
  };

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      startIcon={isWishlisted ? <Favorite sx={{ color: '#e53935', fontSize: 'var(--icon-wishlist)' }} /> : <FavoriteBorder sx={{ fontSize: 'var(--icon-wishlist)' }} />}
      onClick={handleClick}
      disabled={isToggling}
      sx={{
        mt: 1.5,
        borderRadius: 2,
        fontWeight: 600,
        fontSize: 'var(--text-base)',
        textTransform: 'none',
        py: 1,
        color: isWishlisted ? '#e53935' : 'var(--color-text-primary)',
        borderColor: isWishlisted ? '#e53935' : 'rgba(0,0,0,0.23)',
        '&:hover': {
          borderColor: '#e53935',
          bgcolor: 'rgba(229,57,53,0.04)',
        },
      }}
    >
      {isToggling ? 'Updating...' : isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </Button>
  );
};

export default WishlistToggleButton;
