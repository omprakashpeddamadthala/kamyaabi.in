import React from 'react';
import { Box, Typography } from '@mui/material';
import ProductCard from '../common/ProductCard';
import { revealSx, useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import type { Product } from '../../types';

interface RelatedProductsSectionProps {
  products: Product[];
}

const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({ products }) => {
  const reveal = useRevealOnScroll();
  if (products.length === 0) return null;
  return (
    <Box ref={reveal.ref} sx={{ mt: { xs: 4, md: 5 }, ...revealSx(reveal.visible) }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>You May Also Like</Typography>
      <Box sx={{
        display: 'flex',
        gap: 2.5,
        overflowX: 'auto',
        pb: 2,
        scrollSnapType: 'x mandatory',
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.light', borderRadius: 3 },
      }}>
        {products.map((rp) => (
          <Box
            key={rp.id}
            sx={{
              minWidth: { xs: 150, sm: 180 },
              maxWidth: { xs: 160, sm: 190 },
              scrollSnapAlign: 'start',
              flexShrink: 0,
            }}
          >
            <ProductCard product={rp} compact />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RelatedProductsSection;
