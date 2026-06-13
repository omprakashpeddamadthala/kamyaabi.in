import React from 'react';
import { Box, Button, CircularProgress, Slide, Typography } from '@mui/material';
import { Check, ShoppingCart } from '@mui/icons-material';

interface StickyAddToCartBarProps {
  show: boolean;
  productName: string;
  price: number;
  outOfStock: boolean;
  isAdding: boolean;
  justAdded: boolean;
  onAddToCart: () => void;
}

const StickyAddToCartBar: React.FC<StickyAddToCartBarProps> = ({
  show,
  productName,
  price,
  outOfStock,
  isAdding,
  justAdded,
  onAddToCart,
}) => (
  <Slide direction="up" in={show} mountOnEnter unmountOnExit>
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
        <Typography variant="body2" fontWeight={600} noWrap>{productName}</Typography>
        <Typography variant="subtitle1" color="primary" fontWeight={700}>₹{price}</Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={isAdding ? <CircularProgress size={18} color="inherit" /> : justAdded ? <Check /> : <ShoppingCart />}
        onClick={onAddToCart}
        disabled={outOfStock || isAdding}
        color={justAdded ? 'success' : 'primary'}
        sx={{ whiteSpace: 'nowrap', fontWeight: 700, px: 3 }}
      >
        {outOfStock ? 'Out of Stock' : justAdded ? 'Added!' : 'Add to Cart'}
      </Button>
    </Box>
  </Slide>
);

export default StickyAddToCartBar;
