import React from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, Close } from '@mui/icons-material';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../../config/images';
import type { ProductImage } from '../../types';

interface ImageLightboxDialogProps {
  open: boolean;
  onClose: () => void;
  galleryImages: ProductImage[];
  safeIdx: number;
  primaryImageSource: string;
  productName: string;
  onPrev: () => void;
  onNext: () => void;
  onSelectIdx: (idx: number) => void;
}

const ImageLightboxDialog: React.FC<ImageLightboxDialogProps> = ({
  open,
  onClose,
  galleryImages,
  safeIdx,
  primaryImageSource,
  productName,
  onPrev,
  onNext,
  onSelectIdx,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="lg"
    fullWidth
    PaperProps={{
      sx: { bgcolor: 'rgba(0,0,0,0.95)', boxShadow: 'none', m: { xs: 1, md: 2 } },
    }}
  >
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: { xs: '60vh', md: '80vh' } }}>
      <IconButton
        onClick={onClose}
        aria-label="Close lightbox"
        sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}
      >
        <Close />
      </IconButton>
      {galleryImages.length > 1 && (
        <>
          <IconButton
            onClick={onPrev}
            aria-label="Previous image"
            sx={{ position: 'absolute', left: 8, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>
          <IconButton
            onClick={onNext}
            aria-label="Next image"
            sx={{ position: 'absolute', right: 8, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        </>
      )}
      <Box
        component="img"
        src={withCloudinaryTransform(primaryImageSource, 'w_1600,c_limit,q_auto,f_auto') || PRODUCT_PLACEHOLDER_IMAGE}
        alt={productName}
        decoding="async"
        sx={{
          maxWidth: '90%',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: 1,
        }}
      />
      {galleryImages.length > 1 && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
        }}>
          {galleryImages.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => onSelectIdx(idx)}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: idx === safeIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  </Dialog>
);

export default ImageLightboxDialog;
