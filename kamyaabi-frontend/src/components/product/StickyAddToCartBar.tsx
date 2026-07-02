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
      bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 0 },
      left: 0,
      right: 0,
      bgcolor: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid',
      borderColor: 'rgba(0,0,0,0.05)',
      px: { xs: 2, md: 4 },
      py: 1.5,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
    }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-text-secondary)', display: { xs: 'none', sm: 'block' } }} noWrap>
            {productName}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
            ₹{price}
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        startIcon={isAdding ? <CircularProgress size={18} color="inherit" /> : justAdded ? <Check /> : <ShoppingCart />}
        onClick={onAddToCart}
        disabled={outOfStock || isAdding}
        color={justAdded ? 'success' : 'primary'}
        sx={{ 
          whiteSpace: 'nowrap', 
          fontWeight: 800, 
          px: { xs: 3, md: 4 }, 
          py: 1.25,
          borderRadius: 'var(--radius-full)',
          fontSize: '0.9rem',
          boxShadow: justAdded ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(29, 78, 216, 0.3)',
          bgcolor: justAdded ? '#10b981' : 'var(--color-brand-primary)',
          '&:hover': {
            bgcolor: justAdded ? '#059669' : '#1e40af',
          }
        }}
      >
        {outOfStock ? 'Out of Stock' : justAdded ? 'Added!' : 'Add to Cart'}
      </Button>
    </Box>
  </Slide>
);

export default StickyAddToCartBar;

