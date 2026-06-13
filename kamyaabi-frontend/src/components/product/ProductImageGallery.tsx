import React from 'react';
import { Box, Typography } from '@mui/material';
import { ZoomIn } from '@mui/icons-material';
import { cloudinarySrcSet, withCloudinaryTransform } from '../../utils/cloudinary';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../../config/images';
import type { Product, ProductImage } from '../../types';

interface ProductImageGalleryProps {
  product: Product;
  galleryImages: ProductImage[];
  safeIdx: number;
  primaryImageSource: string;
  isZooming: boolean;
  zoomPosition: { x: number; y: number };
  imageRef: React.RefObject<HTMLImageElement>;
  onSelectIdx: (idx: number) => void;
  onZoomChange: (zooming: boolean) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onOpenLightbox: () => void;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  galleryImages,
  safeIdx,
  primaryImageSource,
  isZooming,
  zoomPosition,
  imageRef,
  onSelectIdx,
  onZoomChange,
  onMouseMove,
  onOpenLightbox,
}) => (
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      flexDirection: { xs: 'column', md: 'row' },
    }}
  >
    {galleryImages.length > 1 && (
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          gap: 1,
          order: { xs: 2, md: 1 },
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        {galleryImages.map((img, idx) => (
          <Box
            key={img.id ?? idx}
            component="img"
            src={withCloudinaryTransform(img.imageUrl, 'w_120,h_120,c_fill,q_auto,f_auto')}
            alt={`${product.name} thumbnail ${idx + 1}`}
            onMouseEnter={() => onSelectIdx(idx)}
            onClick={() => onSelectIdx(idx)}
            tabIndex={0}
            role="button"
            aria-label={`View image ${idx + 1}`}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectIdx(idx);
            }}
            sx={{
              width: { xs: 60, md: 56 },
              height: { xs: 60, md: 56 },
              objectFit: 'cover',
              borderRadius: 1,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: idx === safeIdx ? 'primary.main' : 'divider',
              outline: idx === safeIdx ? '2px solid' : 'none',
              outlineColor: 'primary.main',
              outlineOffset: 1,
              transition: 'border-color 0.2s ease, outline 0.2s ease',
              '&:hover': { borderColor: 'primary.main' },
            }}
          />
        ))}
      </Box>
    )}

    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        order: { xs: 1, md: 2 },
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'var(--color-surface-bg)',
        position: 'relative',
        cursor: 'zoom-in',
        '&:hover .zoom-hint': { opacity: isZooming ? 0 : 1 },
      }}
      onMouseEnter={() => onZoomChange(true)}
      onMouseLeave={() => onZoomChange(false)}
      onMouseMove={onMouseMove}
      onClick={onOpenLightbox}
    >
      <Box
        component="img"
        ref={imageRef}
        src={withCloudinaryTransform(primaryImageSource, 'w_800,c_limit,q_auto,f_auto') || PRODUCT_PLACEHOLDER_IMAGE}
        srcSet={cloudinarySrcSet(primaryImageSource) || undefined}
        sizes="(max-width: 900px) 100vw, 500px"
        width={800}
        height={520}
        alt={product.name}
        sx={{
          width: '100%',
          height: 'auto',
          maxHeight: 520,
          aspectRatio: '1 / 1',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          transform: isZooming ? 'scale(1.5)' : 'scale(1)',
        }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <Box
        className="zoom-hint"
        sx={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          borderRadius: 1,
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      >
        <ZoomIn fontSize="small" />
        <Typography variant="caption">Click to expand</Typography>
      </Box>
    </Box>
  </Box>
);

export default ProductImageGallery;
